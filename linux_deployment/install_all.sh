#!/bin/bash
# ==============================================================================
# CamMatrix Ubuntu 24.04 Native Systemd Auto-Installer
# Sangat disarankan dijalankan di server baru (Fresh Install) dengan previlege ROOT
# CARA JALAN: sudo bash linux_deployment/install_all.sh
# ==============================================================================

set -e # Script akan langsung berhenti jika ada salah satu command yang error

echo "=========================================="
echo "🚀 Memulai Instalasi CamMatrix Murni di Linux"
echo "=========================================="

APP_DIR="/var/www/CamMatrix"

# Pastikan script dijalankan di folder root project agar bisa menemukan file-file
if [ ! -d "linux_deployment" ]; then
    echo "ERROR: Jalankan script ini dari dalam folder root project CamMatrix!"
    exit 1
fi

echo "[1/8] Menyiapkan Direktori & Menginstal System Dependencies..."
mkdir -p /var/www
cp -r . $APP_DIR || true # Asumsi script dijalankan dari dalam project folder

apt-get update -y
apt-get install -y curl wget git python3 python3-venv python3-pip openssl build-essential libpq-dev

# Generate Kredensial Acak Super Aman
DB_PASS=$(openssl rand -hex 12)
MINIO_PASS=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_PASS=$(openssl rand -hex 6)

echo "[2/8] Membuat file konfigurasi Lingkungan (.env)..."
cat <<EOF > $APP_DIR/backend/.env
DATABASE_URL=postgresql+asyncpg://postgres:${DB_PASS}@localhost:5432/cctv_vms
SECRET_KEY=${JWT_SECRET}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=${MINIO_PASS}
MINIO_BUCKET_NAME=records
EOF

cat <<EOF > $APP_DIR/frontend/.env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=
EOF

# Install Postgres 16 dan pgvector secara otomatis (tanpa prompt / interaktif)
# Ubuntu 24.04 biasanya sudah menyediakan postgresql-16
DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-16 postgresql-contrib postgresql-16-pgvector

echo "[3/8] Mengonfigurasi PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Mengeksekusi pembuatan DB, pembuatan kredensial, dan extension pgcrypto/pgvector
sudo -u postgres psql -c "CREATE DATABASE cctv_vms;" || echo "DB cctv_vms mungkin sudah ada"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${DB_PASS}';"
sudo -u postgres psql -d cctv_vms -c "CREATE EXTENSION IF NOT EXISTS vector;"


echo "[4/8] Menginstal & Menjalankan MinIO (Native S3 Storage)..."
wget -qO /usr/local/bin/minio https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x /usr/local/bin/minio

mkdir -p /mnt/data/minio
cat <<EOF > /etc/default/minio
MINIO_VOLUMES="/mnt/data/minio"
MINIO_OPTS="--console-address :9001"
MINIO_ROOT_USER="admin"
MINIO_ROOT_PASSWORD="${MINIO_PASS}"
EOF

cp $APP_DIR/linux_deployment/minio.service /etc/systemd/system/
systemctl daemon-reload
systemctl start minio
systemctl enable minio


echo "[5/8] Menginstal & Menjalankan MediaMTX (RTSP/WebRTC Engine)..."
wget -qO mediamtx.tar.gz https://github.com/bluenviron/mediamtx/releases/download/v1.9.0/mediamtx_v1.9.0_linux_amd64.tar.gz
tar -xvzf mediamtx.tar.gz -C /usr/local/bin/ mediamtx
rm mediamtx.tar.gz

mkdir -p /etc/mediamtx
cp $APP_DIR/media_server/mediamtx.yml /etc/mediamtx/mediamtx.yml

cp $APP_DIR/linux_deployment/mediamtx.service /etc/systemd/system/
systemctl daemon-reload
systemctl start mediamtx
systemctl enable mediamtx


echo "[6/8] Menginstal NVM, Node.js & Membangun Frontend React..."
# Pasang versi terbaru NodeJS Native untuk Ubuntu 24.04
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs

cd $APP_DIR/frontend
npm install
npm run build

# Jadikan sebagai daemon via systemd
cp $APP_DIR/linux_deployment/cammatrix-frontend.service /etc/systemd/system/
systemctl daemon-reload
systemctl start cammatrix-frontend
systemctl enable cammatrix-frontend


echo "[7/8] Menyiapkan Python Backend & Menjalankan Migrasi..."
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
# Install passlib dan bcrypt selain rekues utama
pip install -r requirements.txt
pip install passlib[bcrypt]

# Proses Pembuatan Struktur Database Pertama Kali di Linux
alembic upgrade head

# Otomatis Membuat Akun Admin Pertama menggunakan Python Script Injection
cat << 'EOF' > seed_admin.py
import asyncio, os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from sqlalchemy import text

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DB_URL = os.getenv("DATABASE_URL")

async def seed():
    engine = create_async_engine(DB_URL)
    session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)()
    hashed = pwd_context.hash(os.getenv("ADMIN_PASS"))
    async with session.begin():
        await session.execute(text(f"INSERT INTO users (full_name, email, hashed_password, role) VALUES ('System Admin', 'admin@vms.com', '{hashed}', 'admin') ON CONFLICT DO NOTHING;"))
    await session.close()
    await engine.dispose()

asyncio.run(seed())
EOF

export DATABASE_URL="postgresql+asyncpg://postgres:${DB_PASS}@localhost:5432/cctv_vms"
export ADMIN_PASS="${ADMIN_PASS}"
python3 seed_admin.py

cp $APP_DIR/linux_deployment/cammatrix-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl start cammatrix-backend
systemctl enable cammatrix-backend


echo "[8/8] Validasi Akhir..."
systemctl --no-pager status minio mediamtx postgresql cammatrix-backend cammatrix-frontend | grep "Active:" || true

echo "=========================================================="
echo "🎉 INSTALASI MURNI SYSTEMD SELESAI!"
echo "Semua aplikasi hidup, berjalan independen, dan akan AUTO-START."
echo "=========================================================="
echo "Cek API Backend: http://IP_SERVER:8000"
echo "Cek Frontend   : http://IP_SERVER:5173"
echo "=========================================================="
echo "🔐 KREDENSIAL APLIKASI (SIMPAN BAIK-BAIK!)"
echo "=========================================================="
echo "Web Login (Admin)"
echo "- Email    : admin@vms.com"
echo "- Password : ${ADMIN_PASS}"
echo ""
echo "Database (PostgreSQL)"
echo "- User     : postgres"
echo "- Password : ${DB_PASS}"
echo ""
echo "S3 Storage (MinIO) -> http://IP_SERVER:9001"
echo "- User     : admin"
echo "- Password : ${MINIO_PASS}"
echo "=========================================================="
