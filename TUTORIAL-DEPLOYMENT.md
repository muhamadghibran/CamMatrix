# Panduan Deployment & Testing CamMatrix ke Ubuntu 24.04 LTS

Tutorial ini merangkum langkah-langkah praktis untuk "memindahkan" dan menguji proyek aplikasi CamMatrix buatanmu ke sistem operasi asli (Native) Ubuntu 24.04 menggunakan sekumpulan skrip `systemd` yang sudah kita buat bersama.

Inti dari tutorial ini adalah memastikan kelima komponen aplikasi (PostgreSQL, MinIO, MediaMTX, Frontend React, dan Backend FastAPI) menyala bersamaan di latar belakang.

---

## Skenario 1: Test di VPS Baru (Sangat Disarankan)

Bila kamu ingin mengunggah project ini agar bisa dikumpulkan sebagai tugas akhir dan diakses dosen/teman melalui internet murni:

### Langkah 1: Persiapan Server
1. Beli / sewa server (VPS) kosong yang mengusung Sistem Operasi **Ubuntu 24.04 LTS (x64)**.
2. Dapatkan kredensial **Alamat IP Public** dan **Password Root**.
3. Buka Terminal Windows kamu (CMD atau PowerShell), dan hubungkan komputermu mengendalikan VPS Linux tersebut dari jarak jauh.
   ```bash
   ssh root@<ALAMAT_IP_SERVER_KAMU>
   ```
   > Pastikan kamu bersedia mengetik password jika diminta oleh sistem (catatan: saat mengetik password di Linux, teksnya tidak akan kelihatan. Ketik saja lalu `Enter`).

### Langkah 2: Mengunggah Folder Proyek
1. Jika project ini sudah kamu dorong (Push) ke **GitHub**, tarik masuk kodenya ke Linux dengan perintah berikut. *(Kita menggunakan perintah `chown` terlebih dahulu agar tidak terjadi error "Permission denied" pada akun komputermu)*:
   ```bash
   # Buat folder wadah secara paksa
   sudo mkdir -p /var/www
   
   # Jadikan folder tersebut milik akun kamu saat ini
   sudo chown -R $USER:$USER /var/www
   
   # Masuk dan unduh repo Github di dalamnya
   cd /var/www
   git clone <URL_GITHUB_BISA_KAMU_PASTE_DISINI> CamMatrix
   cd CamMatrix
   ```
2. *(Opsi Bebas)* Jika belum masuk GitHub, pindahkan foldernya menggunakan FTP seperti FileZilla atau SCP.

### Langkah 3: Eksekusi Jurus Pamungkas (Script Instalasi Systemd)
1. Pergi ke dalam folder tempat kita menaruh script-nya. Pastikan kamu berada di titik `/var/www/CamMatrix`.
2. Berikan izin kepada Linux agar script tersebut boleh berjalan dan tidak diblokir.
   ```bash
   sudo chmod +x linux_deployment/install_all.sh
   ```
3. Tekan Enter untuk memulai keajaiban. (Bisa jadi kamu disuruh rebahan sekitar 10 - 20 menit saat sistem sibuk mengunduh dan memasang Node.js, Python, PostgreSQL, Nginx, DLL.)
   ```bash
   sudo bash linux_deployment/install_all.sh
   ```

### Langkah 4: Validasi & Tes Kinerja Web
Saat script berhenti, ketik `reboot` lalu `Enter` untuk merestart Komputer Linux secara sengaja agar kita bisa membuktikan bahwa `systemd` sungguhan berjalan tanpa dipancing lagi. Tembak Browser kamu menuju Alamat berikut:

- 🟢 **Frontend Web (React)** -> `http://<ALAMAT_IP_SERVER_KAMU>:5173`
- 🟢 **Backend Engine (FastAPI)** -> `http://<ALAMAT_IP_SERVER_KAMU>:8000/docs`
- 🟢 **Cloud Storage S3 (MinIO)** -> `http://<ALAMAT_IP_SERVER_KAMU>:9001`
*(Catatan: Jangan lupa ubah tulisan localhost pada file .env jika berada di IP Asli ya)*

---

## Perintah Mengendalikan Layanan Manual

Karena kita sudah meninggalkan command `docker`, kini manajer "satpam" bangunan kamu adalah `systemctl`. Kenali sedikit kendalinya:

**Melihat kondisi nyawa aplikasi Backend (Error log dll)**
```bash
sudo systemctl status cammatrix-backend
sudo journalctl -u cammatrix-backend -f
```

**Mematikan aplikasi Streaming CCTV (MediaMTX)**
```bash
sudo systemctl stop mediamtx
```

**Merestart / Update Database MinIO jika ada error**
```bash
sudo systemctl restart minio
```

*Selesai! Dengan menguasai tutorial ini, maka keahlianmu dalam urusan server setara dengan Engineer profesional kelas DevOps Industri / Startup!*
