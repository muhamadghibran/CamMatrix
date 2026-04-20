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

echo "[1/7] Menyiapkan Direktori & Dependensi OS..."
mkdir -p /var/www
cp -r . $APP_DIR || true # Asumsi script dijalankan dari dalam project folder

apt-get update -y
apt-get install -y curl wget git python3 python3-venv python3-pip

# Install Postgres 16 dan pgvector secara otomatis (tanpa prompt / interaktif)
# Ubuntu 24.04 biasanya sudah menyediakan postgresql-16
DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-16 postgresql-contrib postgresql-16-pgvector

echo "[2/7] Mengonfigurasi PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Mengeksekusi pembuatan DB, pembuatan kredensial, dan extension pgcrypto/pgvector
sudo -u postgres psql -c "CREATE DATABASE cctv_vms;" || echo "DB cctv_vms mungkin sudah ada"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'yourpassword';"
sudo -u postgres psql -d cctv_vms -c "CREATE EXTENSION IF NOT EXISTS vector;"


echo "[3/7] Menginstal & Menjalankan MinIO (Native S3 Storage)..."
wget -qO /usr/local/bin/minio https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x /usr/local/bin/minio

mkdir -p /mnt/data/minio
cat <<EOF > /etc/default/minio
MINIO_VOLUMES="/mnt/data/minio"
MINIO_OPTS="--console-address :9001"
MINIO_ROOT_USER="minioadmin"
MINIO_ROOT_PASSWORD="minioadmin"
EOF

cp $APP_DIR/linux_deployment/minio.service /etc/systemd/system/
systemctl daemon-reload
systemctl start minio
systemctl enable minio


echo "[4/7] Menginstal & Menjalankan MediaMTX (RTSP/WebRTC Engine)..."
wget -qO mediamtx.tar.gz https://github.com/bluenviron/mediamtx/releases/download/v1.9.0/mediamtx_v1.9.0_linux_amd64.tar.gz
tar -xvzf mediamtx.tar.gz -C /usr/local/bin/ mediamtx
rm mediamtx.tar.gz

mkdir -p /etc/mediamtx
cp $APP_DIR/media_server/mediamtx.yml /etc/mediamtx/mediamtx.yml

cp $APP_DIR/linux_deployment/mediamtx.service /etc/systemd/system/
systemctl daemon-reload
systemctl start mediamtx
systemctl enable mediamtx


echo "[5/7] Menginstal NVM, Node.js & Membangun Frontend React..."
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


echo "[6/7] Menyiapkan Python Backend & Menjalankan Migrasi..."
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Proses Pembuatan Struktur Database Pertama Kali di Linux
alembic upgrade head

cp $APP_DIR/linux_deployment/cammatrix-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl start cammatrix-backend
systemctl enable cammatrix-backend


echo "[7/7] Validasi Akhir..."
systemctl --no-pager status minio mediamtx postgresql cammatrix-backend cammatrix-frontend | grep "Active:" || true

echo "=========================================================="
echo "🎉 INSTALASI MURNI SYSTEMD SELESAI!"
echo "Semua aplikasi hidup, berjalan independen, dan akan AUTO-START."
echo "=========================================================="
echo "Cek API Backend: http://IP_SERVER:8000"
echo "Cek Frontend   : http://IP_SERVER:5173"
echo "Cek MinIO S3   : http://IP_SERVER:9001"
echo "=========================================================="
