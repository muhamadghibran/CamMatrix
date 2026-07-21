# 🖥️ CamMatrix — SSH & Server Management Cheatsheet

Panduan lengkap perintah terminal untuk akses SSH, monitoring, restart, dan manajemen layanan CamMatrix di VPS Ubuntu 24.04.

---

## 🔌 1. Akses SSH ke VPS

```bash
# Login ke server menggunakan password
ssh root@YOUR_SERVER_IP

# Login menggunakan SSH Key (lebih aman — direkomendasikan)
ssh -i ~/.ssh/id_rsa root@YOUR_SERVER_IP

# Login ke port SSH kustom (jika port bukan 22)
ssh -p 2222 root@YOUR_SERVER_IP

# Keluar dari SSH session
exit
```

---

## 📁 2. Navigasi Direktori Utama

```bash
# Masuk ke direktori utama project
cd /var/www/CamMatrix

# Masuk ke backend
cd /var/www/CamMatrix/backend

# Masuk ke frontend
cd /var/www/CamMatrix/frontend

# Masuk ke konfigurasi mediamtx
cd /etc/mediamtx

# Lihat isi direktori
ls -la /var/www/CamMatrix
```

---

## 🔄 3. Cek Status & Restart Layanan (systemd)

### ✅ Cek Status Semua Layanan Sekaligus

```bash
systemctl status cammatrix-backend cammatrix-frontend mediamtx minio postgresql
```

### 🔙 Backend (FastAPI — Port 8000)

```bash
# Cek status
systemctl status cammatrix-backend

# Restart
sudo systemctl restart cammatrix-backend

# Stop
sudo systemctl stop cammatrix-backend

# Start
sudo systemctl start cammatrix-backend

# Lihat log real-time (tekan Ctrl+C untuk keluar)
journalctl -u cammatrix-backend -f

# Lihat 100 baris log terakhir
journalctl -u cammatrix-backend -n 100 --no-pager
```

### 🌐 Frontend React (via npx serve — Port 5173)

```bash
# Cek status
systemctl status cammatrix-frontend

# Restart
sudo systemctl restart cammatrix-frontend

# Stop
sudo systemctl stop cammatrix-frontend

# Start
sudo systemctl start cammatrix-frontend

# Lihat log real-time
journalctl -u cammatrix-frontend -f
```

### 📹 MediaMTX Streaming Server (Port 8554/8888/8889)

```bash
# Cek status
systemctl status mediamtx

# Restart
sudo systemctl restart mediamtx

# Lihat log real-time
journalctl -u mediamtx -f

# Lihat daftar kamera yang sedang streaming (via REST API)
curl http://127.0.0.1:9997/v3/paths/list | python3 -m json.tool
```

### 🗄️ PostgreSQL Database (Port 5432)

```bash
# Cek status
systemctl status postgresql

# Restart
sudo systemctl restart postgresql

# Masuk ke PostgreSQL CLI
sudo -u postgres psql

# Masuk ke database CamMatrix
sudo -u postgres psql -d cctv_vms

# Keluar dari psql
\q
```

### 🪣 MinIO Object Storage (Port 9000/9001)

```bash
# Cek status
systemctl status minio

# Restart
sudo systemctl restart minio

# Lihat log real-time
journalctl -u minio -f
```

---

## 🚀 4. Deploy Ulang / Update Aplikasi

### Update dari Git & Rebuild Otomatis

```bash
# Masuk ke direktori project
cd /var/www/CamMatrix

# Jalankan script update otomatis (git pull + build + restart)
sudo bash linux_deployment/update_deployment.sh
```

Script ini akan otomatis:
1. `git pull origin main` — tarik kode terbaru
2. `pip install -r requirements.txt` + `alembic upgrade head` — update backend
3. `npm install` + `npm run build` — rebuild frontend
4. `systemctl restart` — restart semua layanan

---

## 🔧 5. Update Manual Komponen (Tanpa Script)

### Update Backend Saja

```bash
cd /var/www/CamMatrix/backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
deactivate
sudo systemctl restart cammatrix-backend
```

### Update Frontend Saja

```bash
cd /var/www/CamMatrix/frontend
npm install
npm run build
sudo systemctl restart cammatrix-frontend
```

### Reload Setelah Ubah Service File

```bash
sudo systemctl daemon-reload
sudo systemctl restart cammatrix-backend
sudo systemctl restart cammatrix-frontend
```

---

## 🔑 6. Manajemen Admin & Database

### Buat Akun Admin Baru

```bash
cd /var/www/CamMatrix/backend
source venv/bin/activate

python3 << 'EOF'
import asyncio, os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from sqlalchemy import text

EMAIL    = "admin_baru@domain.com"   # Ganti ini
PASSWORD = "PasswordKuat123!"         # Ganti ini
NAME     = "Nama Admin"               # Ganti ini

async def seed():
    engine  = create_async_engine(os.getenv("DATABASE_URL"))
    session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)()
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = pwd_context.hash(PASSWORD)
    
    async with session.begin():
        sql = text("""
            INSERT INTO users (full_name, email, hashed_password, role, is_active, must_change_password) 
            VALUES (:name, :email, :password, 'ADMIN', true, true) 
            ON CONFLICT (email) DO NOTHING;
        """)
        await session.execute(sql, {"name": NAME, "email": EMAIL, "password": hashed})
    await session.close()

asyncio.run(seed())
print(f"✅ Admin dibuat: {EMAIL}")
EOF
```

### Lihat Semua Pengguna di Database

```bash
sudo -u postgres psql -d cctv_vms -c "SELECT id, email, role, is_active, must_change_password FROM users;"
```

### Lihat Semua Kamera di Database

```bash
sudo -u postgres psql -d cctv_vms -c "SELECT id, name, location, rtsp_url FROM cameras;"
```

### Reset / Hapus Database (HATI-HATI — data hilang!)

```bash
sudo -u postgres psql -c "DROP DATABASE cctv_vms;"
sudo -u postgres psql -c "CREATE DATABASE cctv_vms;"
sudo -u postgres psql -d cctv_vms -c "CREATE EXTENSION IF NOT EXISTS vector;"
cd /var/www/CamMatrix/backend
source venv/bin/activate
alembic upgrade head
deactivate
```

---

## 🔑 7. Generate Key / Secret Baru

```bash
# Generate SECRET_KEY baru (JWT)
python3 -c "import secrets; print(secrets.token_hex(32))"

# Generate ENCRYPTION_KEY baru (Fernet)
openssl rand -hex 32

# Generate password acak aman
openssl rand -base64 24

# Lihat isi .env backend saat ini (HATI-HATI di depan orang lain)
cat /var/www/CamMatrix/backend/.env
```

---

## 📊 8. Monitoring Performa Server

```bash
# Lihat penggunaan CPU & RAM (tekan q untuk keluar)
htop

# Lihat penggunaan disk
df -h

# Lihat penggunaan RAM
free -h

# Lihat proses yang berjalan
ps aux | grep -E "uvicorn|node|mediamtx|postgres|minio"

# Lihat koneksi aktif di port yang digunakan CamMatrix
ss -tlnp | grep -E "8000|5173|8554|8888|8889|9000|9001|9997|5432"

# Lihat usage storage folder rekaman
du -sh /var/www/CamMatrix/recordings/
```

---

## 🔐 9. Keamanan & Firewall (UFW)

```bash
# Cek status firewall
sudo ufw status

# Izinkan port yang diperlukan
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 8000/tcp    # Backend API
sudo ufw allow 5173/tcp    # Frontend
sudo ufw allow 8554/tcp    # RTSP
sudo ufw allow 8888/tcp    # HLS streaming
sudo ufw allow 8889/tcp    # WebRTC
sudo ufw allow 9001/tcp    # MinIO Console
# JANGAN buka port 9997 (MediaMTX API) — hanya untuk localhost!

# Aktifkan firewall
sudo ufw enable

# Lihat semua rule
sudo ufw status numbered
```

---

## 📺 10. Cek Streaming MediaMTX

```bash
# Lihat semua path/kamera yang aktif
curl -s http://127.0.0.1:9997/v3/paths/list | python3 -m json.tool

# Cek satu path kamera (contoh: cam_1_1)
curl -s http://127.0.0.1:9997/v3/paths/get/cam_1_1 | python3 -m json.tool

# Lihat konfigurasi MediaMTX aktif
cat /etc/mediamtx/mediamtx.yml

# Lihat password streaming (mode 600 — hanya root)
sudo cat /etc/mediamtx/mediamtx.env

# Sinkronisasi ulang kamera ke MediaMTX via API (setelah ubah kamera)
curl -X POST http://localhost:8000/api/v1/cameras/sync-mediamtx \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🌐 11. Cek Endpoint API Backend

```bash
# Health check backend
curl http://localhost:8000/health

# Root info
curl http://localhost:8000/

# Test login (ganti email & password)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@vms.com&password=YOUR_PASSWORD"
```

---

## 📜 12. Lihat Log Secara Lengkap

```bash
# Log backend (real-time)
journalctl -u cammatrix-backend -f

# Log frontend (real-time)
journalctl -u cammatrix-frontend -f

# Log MediaMTX (real-time)
journalctl -u mediamtx -f

# Log MinIO (real-time)
journalctl -u minio -f

# Log PostgreSQL
journalctl -u postgresql -f

# Log semua layanan CamMatrix sekaligus
journalctl -u cammatrix-backend -u cammatrix-frontend -u mediamtx -u minio -f

# Log sejak 1 jam terakhir
journalctl -u cammatrix-backend --since "1 hour ago"
```

---

## 🛠️ 13. Troubleshooting Umum

### Backend gagal start

```bash
# Cek log error
journalctl -u cammatrix-backend -n 50 --no-pager

# Cek apakah port 8000 sudah dipakai proses lain
ss -tlnp | grep 8000

# Test jalankan manual untuk lihat error langsung
cd /var/www/CamMatrix/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend tidak bisa diakses

```bash
# Cek status
systemctl status cammatrix-frontend

# Pastikan build ada
ls -la /var/www/CamMatrix/frontend/dist/

# Rebuild jika dist kosong/tidak ada
cd /var/www/CamMatrix/frontend
npm run build
sudo systemctl restart cammatrix-frontend
```

### Kamera offline / streaming tidak muncul

```bash
# Cek status mediamtx
systemctl status mediamtx

# Cek daftar path kamera
curl -s http://127.0.0.1:9997/v3/paths/list | python3 -m json.tool

# Restart mediamtx
sudo systemctl restart mediamtx

# Sinkronisasi ulang kamera (login dulu untuk dapat JWT)
# Lakukan melalui UI Admin: halaman Cameras → tombol Sync
```

### Database tidak bisa diakses

```bash
# Cek status PostgreSQL
systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Test koneksi manual
sudo -u postgres psql -d cctv_vms -c "SELECT 1;"
```

---

## 🗺️ Port Summary

| Port | Layanan | Akses |
|------|---------|-------|
| `22` | SSH | Publik (dari IP terpercaya saja) |
| `8000` | FastAPI Backend API | Publik |
| `5173` | React Frontend | Publik |
| `8554` | MediaMTX RTSP | Publik (kamera push) |
| `8888` | MediaMTX HLS | Publik (streaming ke browser) |
| `8889` | MediaMTX WebRTC | Publik |
| `9000` | MinIO S3 API | Internal / Admin |
| `9001` | MinIO Web Console | Admin saja |
| `9997` | MediaMTX REST API | **Localhost saja — JANGAN dibuka!** |
| `5432` | PostgreSQL | Localhost saja |

---

> 💡 **Tips:** Simpan file ini di `/var/www/CamMatrix/SSH-COMMANDS.md` atau bookmark halaman GitHub-nya agar mudah diakses saat dibutuhkan.
