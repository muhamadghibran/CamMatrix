# CamMatrix: Workflow & Data Lifecycle

Dokumen ini menjelaskan alur cerita perjalanan data (*Workflow*) dalam CamMatrix. Mulai dari pengguna datang, pemasangan kamera, hingga siaran diterima.

---

## 1. Alur Interaksi Pengguna (User Journey Workflow)

### Fase A: Onboarding & Autentikasi
1. **Pendaftaran**: Pengguna mendaftar melalui form web atau menggunakan "Sign in With Google".
2. **Penerbitan Tiket**: Backend menvalidasi, lalu menerbitkan JWT (JSON Web Token) berdurasi X hari.
3. **Penyimpanan Lokal**: Frontend (Zustand State Manager) menyimpan JWT ini di `localStorage` Browser.
4. **Pembagian Hak Akses**: Pengguna dilemparkan ke Dashboard. (Jika sistem mendeteksi Role-nya adalah "Admin", maka tab navigasi "Users / Pengguna" baru akan dimunculkan).

### Fase B: Menambahkan Kamera Pribadi
1. **Input Data**: Pengguna mengisi tautan `rtsp://username:pass@lokasi.com/stream` kamera miliknya ke form di aplikasi.
2. **Penempelan Identitas**: Backend menyimpan data tersebut secara *Asynchronous* ke PostgreSQL dan menempelkan `owner_id` = milik pengguna yang menginput (melalui ekstraksi JWT token saat proses upload).
3. **Pembaruan Konfig Streaming**: Backend menyuruh MediaMTX menambahkan path kamera tadi melalui API komando MediaMTX (Contoh: Menambahkan *proxy path* `cam_id_24`).

### Fase C: Menonton Live View (Penyiaran Animasi Grafis)
1. **Permintaan Grid**: React mendengarkan respon pengguna yang menekan tombol *Layout Grid* (misal mode 2x2).
2. **Pengambilan Feed**: Setiap kotak Grid / Sel secara mandiri merender komponen `<HlsPlayer>` atau WebRTC Component. 
3. **Terputus**: Bila RTSP mati/offline dari asalnya, MediaMTX akan mengirim sinyal putus, React mencatat Error, UI otomatis beruba memunculkan layar Placeholder (Wifi/Offline Hitam) seraya meminum *timeout* 3 detik untuk mencoba auto-retry secara reguler.

---

## 2. Alur Data Artificial Intelligence (Masa Depan)
*Workflow Face Analytics saat ekstensi berjalan:*

1. **Grab**: Mesin AI (Python Worker) menarik aliran gambar (misal 5 frame/detik) dari MediaMTX RTSP.
2. **Inferensi**: YOLO/Facenet merumuskan struktur *bounding box* dan skor deteksi (Contoh: "Human Face - 98%").
3. **Sinkronisasi**: Frame dengan deteksi yang lulus *Threshold* akan di-screenshot, dibungkus, lalu dilempar (upload) ke API FastAPI.
4. **Katalogisasi**: FastAPI menyimpan gambar ke MinIO (mendapatkan URL S3). Kemudian mencatat string event ke PostgreSQL database: `[Kamera 5] Terdeteksi [Wajah x] pada [Minggu Kliwon] path_foto="s3://bucket/photo.jpg"`.
5. **Reaksi (Frontend)**: Animasi grafik statistik garis pada Frontend React dan Sparkline akan otomatis melengkung ke atas.
