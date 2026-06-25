#!/bin/bash
# ==============================================================================
# CamMatrix Linux Systemd Deployment Updater
# Cara pakai di VPS: sudo bash linux_deployment/update_deployment.sh
# ==============================================================================

# Menghentikan eksekusi jika terjadi error
set -e

echo "======================================================"
echo "🔄 Memulai Pembaruan (Update) CamMatrix di Linux Server"
echo "======================================================"

APP_DIR="/var/www/CamMatrix"

# Pastikan dijalankan dari dalam folder project CamMatrix
if [ ! -d "linux_deployment" ]; then
    echo "❌ ERROR: Jalankan script ini dari folder root project CamMatrix (/var/www/CamMatrix)!"
    exit 1
fi

echo "-------------------------------------------"
echo "[1/4] Mengambil perubahan terbaru dari Git..."
echo "-------------------------------------------"
# Coba tarik perubahan terbaru dari GitHub
git pull origin main || {
    echo "⚠️ Git pull gagal. Mencoba menaruh perubahan lokal ke stash..."
    git stash
    git pull origin main
    git stash pop || true
}

echo "-------------------------------------------"
echo "[2/4] Memperbarui Backend (FastAPI)..."
echo "-------------------------------------------"
cd "$APP_DIR/backend"

if [ -d "venv" ]; then
    # Masuk ke virtual environment Python
    source venv/bin/activate
    
    echo "Installing updated backend dependencies..."
    pip install -r requirements.txt
    pip install passlib[bcrypt] || true
    
    echo "Menjalankan migrasi database (Alembic)..."
    alembic upgrade head
    
    deactivate
else
    echo "⚠️ Virtual environment 'venv' tidak ditemukan. Membuat venv baru..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install passlib[bcrypt] || true
    alembic upgrade head
    deactivate
fi

echo "-------------------------------------------"
echo "[3/4] Memperbarui & Build Frontend (React)..."
echo "-------------------------------------------"
cd "$APP_DIR/frontend"

echo "Installing npm dependencies..."
npm install

echo "Membangun (Build) aset produksi React..."
npm run build

echo "-------------------------------------------"
echo "[4/4] Menyegarkan Konfigurasi Systemd & Restart..."
echo "-------------------------------------------"
# Salin konfigurasi systemd terbaru jika ada perubahan
if [ -f "$APP_DIR/linux_deployment/cammatrix-backend.service" ]; then
    sudo cp "$APP_DIR/linux_deployment/cammatrix-backend.service" /etc/systemd/system/
fi

if [ -f "$APP_DIR/linux_deployment/cammatrix-frontend.service" ]; then
    sudo cp "$APP_DIR/linux_deployment/cammatrix-frontend.service" /etc/systemd/system/
fi

# Reload systemd daemon agar mendeteksi perubahan konfigurasi unit file
sudo systemctl daemon-reload

echo "Mengulang (Restart) layanan backend..."
sudo systemctl restart cammatrix-backend

echo "Mengulang (Restart) layanan frontend..."
sudo systemctl restart cammatrix-frontend

echo "======================================================"
echo "🎉 SELESAI! Seluruh komponen berhasil diperbarui & direstart."
echo "======================================================"
echo "Periksa status layanan dengan perintah:"
echo "  - Backend  : systemctl status cammatrix-backend"
echo "  - Frontend : systemctl status cammatrix-frontend"
echo "======================================================"
