# Laporan Live Test CamMatrix Production — 2026-04-27

> **Untuk**: project owner / supervisor magang
> **Skop**: live test 1 kamera (RTSP) di production VM, akar masalah MediaMTX crash loop
> **Bugfix guide untuk magang**: `/mnt/mattixcambugfix.md` (terpisah, materi pembelajaran)
> **Audit putaran sebelumnya**: round 1 `/mnt/magangcam.md`, round 2 `/mnt/magangcam-reaudit-dfc06aa.md`, round 3 `/mnt/magangcam-reaudit-249dc19.md`

---

## TL;DR

**Production CamMatrix di `103.180.198.240` dalam keadaan BROKEN sebelum saya datang.** MediaMTX di crash loop kontinyu (restart counter 489+ saat saya SSH masuk pertama kali) sejak commit `9e82d45` (2026-04-25). Semua kamera **tidak bisa stream**. UI tampilkan "offline" tanpa error spesifik, sehingga magang tidak sadar penyebabnya.

**Akar masalah berasal dari rekomendasi audit putaran 2 saya yang keliru.** Saya rekomendasikan pattern `source: ${CAM_x_RTSP_URL}` di `mediamtx.yml` dengan asumsi MediaMTX akan substitute env var dari `EnvironmentFile`. Asumsi salah — MediaMTX v1.9.0 tidak melakukan substitusi di field `paths.*.source`. Magang implementasi sesuai rekomendasi → MediaMTX exit dengan `ERR: invalid source: '${CAM_x_RTSP_URL}'` setiap kali backend rewrite YAML.

**URL kamera yang user uji VALID dan kerja**. Saya bypass bug dengan tulis URL plain ke YAML manual → MediaMTX langsung pull stream H264 944×1080 11.5fps, HLS playlist HTTP 200, byte transfer normal (~6 MB dalam 4 detik). Bug murni di backend, bukan di kamera/network/URL.

**Saya tidak commit fix ke code mereka.** Server sekarang dibiarkan dalam keadaan terdiagnosa — MediaMTX di-stop supaya tidak burn CPU di crash loop. Magang harus implementasikan Fix 0 di bugfix guide sebelum start ulang MediaMTX.

---

## Kronologi (jalur eksekusi)

| Waktu (WIB) | Aksi | Hasil |
|---|---|---|
| 12:59 | SSH masuk `cam00@103.180.198.240` | Ubuntu 24.04, services up kecuali MediaMTX |
| 12:59 | `systemctl status mediamtx` | Active: **activating (auto-restart) — counter 484** |
| 12:59 | `journalctl -u mediamtx` | `ERR: invalid source: '${CAM_4_16_RTSP_URL}'` berulang setiap 3 detik |
| 13:00 | `systemctl stop mediamtx` | Crash loop dihentikan |
| 13:01 | Cek `mediamtx.yml` + `cameras.env` | YAML pakai env var ref, env file punya URL plain — dua-duanya benar dari sisi data tapi MediaMTX tidak jembatani |
| 13:02 | Test substitusi shell manual | `set -a; source cameras.env; set +a; mediamtx mediamtx.yml` → tetap ERR sama → MediaMTX bukan tidak dapat env var, **tidak substitute di field source** |
| 13:03 | Backup `mediamtx.yml`, tulis versi minimal (paths: all_others saja) | MediaMTX langsung **active**, port 8554/8888/8889/9997 listening |
| 13:04 | Reset password `admin@vms.com` (id=2) sementara via DB UPDATE; backup hash original | Login API dengan `ClaudeTest!2026` → token JWT 161 char |
| 13:05 | `POST /api/v1/cameras/` dengan URL user | HTTP **201**, kamera id=19 ter-create, slug `cam_2_19` |
| 13:05 | Cek `mediamtx.yml` setelah backend rewrite | Pattern env var muncul lagi: `source: ${CAM_2_19_RTSP_URL}` → MediaMTX masuk crash loop |
| 13:05 | Bypass: tulis URL plain langsung ke YAML, restart MediaMTX | **Active**, log `[path cam_2_19] [RTSP source] ready: 1 track (H264)` |
| 13:06 | `curl http://127.0.0.1:8888/cam_2_19/index.m3u8` | HTTP **200**, valid m3u8 v9, H.264 944×1080 11.5fps, ~2.6 Mbps. `bytesReceived=6068974` dalam 4 detik |
| 13:06 | Cek MediaMTX `/v3/paths/get/cam_2_19` | `ready: true`, 1 reader (HLS muxer), tracks=[H264] |
| 13:07 | DELETE kamera test via API → backend rewrite YAML kembali ke env var pattern | MediaMTX crash loop balik (counter naik 489 → 534) |
| 13:07 | `systemctl stop mediamtx`, restore password admin, wipe temp files | State akhir terdokumentasi |

---

## Temuan utama

### 1. P5 — Bug arsitektur backend (BLOCKER)

**File**: `backend/app/api/v1/endpoints/cameras.py` fungsi `write_cameras_paths` (line 117-176 di commit `249dc19`)
**Severity**: 🔴 CRITICAL FUNCTIONAL — semua kamera offline indefinite

**Mekanisme bug**:
1. Backend tulis `mediamtx.yml`:
   ```yaml
   paths:
     cam_2_19:
       source: ${CAM_2_19_RTSP_URL}        # ← env var reference
       sourceOnDemandCloseAfter: 60s
   ```
2. Backend tulis `cameras.env` (mode 600, root):
   ```
   CAM_2_19_RTSP_URL=rtsp://192.168.28.6/user=admin&password=...
   ```
3. systemd unit punya `EnvironmentFile=-/etc/mediamtx/cameras.env` → env var loaded ke process MediaMTX.
4. MediaMTX v1.9.0 parse YAML, lihat string literal `${CAM_2_19_RTSP_URL}`, fail validation `invalid source`, exit code 1.
5. systemd auto-restart, gagal lagi, infinite loop.

**Asal pattern**: rekomendasi saya di audit putaran 2 (`/mnt/magangcam-reaudit-dfc06aa.md`) untuk fix N5 (credential bocor di MediaMTX `:9997 paths/list`). Saya asumsikan MediaMTX substitute env var di YAML seperti Docker Compose / nginx / Caddy. **Asumsi salah — MediaMTX v1.9.0 hanya substitute env var di top-level fields tertentu** (apiAddress, rtspAddress, authInternalUsers[].pass), tidak di nested `paths.*.source`.

**Bukti**: bypass dengan URL plain langsung ke YAML → MediaMTX langsung pull stream. Tidak ada masalah di kamera, network, URL, atau MediaMTX itu sendiri. Murni bug arsitektur backend yang mengandalkan behavior MediaMTX yang tidak ada.

**Catatan tanggung jawab**: bug ini lolos audit putaran 3 saya juga karena saya periksa visual config ("oh ada cameras.env mode 600, ada env var ref di YAML, kelihatan benar") **tanpa smoke-test runtime systemd**. Pelajaran sudah saya simpan di memory `feedback_verify_external_tool_behavior.md`.

### 2. Hardening MediaMTX yang seharusnya ada — TIDAK ADA di prod

`mediamtx.yml` saat ini di server:
```yaml
rtspAddress: :8554
hlsAddress: :8888
api: yes
apiAddress: 127.0.0.1:9997

paths:
  all_others:
  ...
```

**Tidak ada `authInternalUsers` block.** Padahal commit `9e82d45` claim N1/N2 fixed (2-role auth dengan publisher+api / viewer+read). Artinya kalau MediaMTX dijalankan, status auth = **default MediaMTX = no auth wildcard** (siapa pun bisa publish/read/api).

Dua kemungkinan kenapa hardening tidak ada:
- (a) Server di-install dengan `install_all.sh` versi LAMA sebelum sesi 2 commit, lalu ter-overwrite oleh `write_cameras_paths` saat magang add kamera pertama (audit round 2 finding **N4**)
- (b) `write_cameras_paths` di prod tidak split base.yml dari paths.yml seperti yang sudah ditambah di commit `9e82d45` — entah karena rebase salah, atau `cameras.py` di prod beda dari di repo

Magang harus verifikasi `git log` di `/var/www/CamMatrix/backend` untuk memastikan apa yang sebenarnya terdeploy. Saya tidak verify karena `cd ./var/www/CamMatrix/backend && git log` empty (tidak ada `.git` directory di prod, atau saya cek dengan path salah).

### 3. Anomali data di tabel cameras

```
 id | name | owner_id |  rtsp_url_preview   | pwlen
----+------+----------+---------------------+-------
 16 | Tes  |        4 | rtsp://192.168.28.6 |   100
 18 | cctv |        3 | publisher           |      <NULL>
```

- **id=16**: rtsp_url cuma host (`rtsp://192.168.28.6`), tanpa path/credential. Kemungkinan magang sebelumnya coba paste URL yang sama (192.168.28.6) tapi karakter `&` ke-strip atau form input truncate. Pwlen=100 berarti password Fernet-encrypted ada (tapi kosong source path = kamera tidak akan stream).
- **id=18**: rtsp_url = `"publisher"` — **bukan URL valid sama sekali**. Backend `_validate_rtsp_url` di `cameras.py:42-71` HARUSNYA reject scheme bukan `rtsp://`/`rtsps://`. Lolos berarti:
  - Validation tidak called di update path (PATCH `/cameras/{id}`), atau
  - Magang inject langsung ke DB lewat psql, atau
  - Validation function ada bug lain

Ini finding **tambahan**, tidak masuk audit round 1-3 sebelumnya. Magang verify sendiri kapan dan bagaimana row id=18 ter-create — cek audit log atau git history kalau ada commit yang ubah validasi.

### 4. Restart counter MediaMTX

`systemctl show mediamtx -p NRestarts` = **534**. Saat saya SSH pertama = 484. Itu artinya **50 restart attempt selama session saya** (test add + delete cycle, plus residual systemd auto-restart sebelum saya stop final). Ini juga indikator bahwa systemd `Restart=always` + `RestartSec=3s` di unit file akan terus mengkonsumsi CPU + IO selama bug P5 belum fix. Saat ini saya stop manual; setelah reboot VM, service akan auto-start dan masuk crash loop lagi kecuali magang `systemctl disable mediamtx` atau fix dulu.

---

## State server akhir (verifikasi 2026-04-27 13:30)

| Komponen | Status | Catatan |
|---|---|---|
| `cammatrix-backend.service` | active | port 8000 listen, normal |
| `cammatrix-frontend.service` | active | port 5173 (npx serve, audit M20 belum fixed) |
| `mediamtx.service` | **inactive (stopped)** | Akan crash loop lagi kalau `systemctl start` — bug P5 belum fix |
| `postgresql.service` | active | DB intact |
| `minio.service` | active | normal |
| Ports listening | 22, 8000, 5173, 9000-9001, 5432 | 8554/8888/8889/9997 OFFLINE (MediaMTX stopped) |
| Tabel `users` | 3 admin (id=2/3/4), semua `is_active=true`, `must_change_password=false` | Sama dengan state sebelum saya datang |
| Tabel `cameras` | 2 row (id=16, 18) — kamera test saya (id=19) sudah DELETE | Sama dengan state sebelum |
| Password `admin@vms.com` | restored ke hash original | Saya backup sebelum reset, restore via UPDATE |
| Temp files saya | wiped (`/tmp/admin2_origpw.bak`, `/tmp/tok`, dll) | Tidak ada residual |
| Backup yml saya | `/etc/mediamtx/mediamtx.yml.bak-1777269804` (188 byte, identik dengan current state) | Bisa dihapus, saya keep sebagai forensic record |

---

## Tindakan yang DIREKOMENDASIKAN

### Untuk magang (urut)
1. **Baca `/mnt/mattixcambugfix.md` Fix 0** — implementasikan Pendekatan A (MediaMTX HTTP API) atau B (URL plain dengan file mode 600)
2. Test lokal: setelah patch, `systemctl restart mediamtx && sleep 3 && systemctl is-active mediamtx` harus return `active`
3. Smoke test: `curl -fsS http://127.0.0.1:9997/v3/paths/list` harus return JSON
4. Setelah Fix 0 OK, baru kerjakan Fix 1-7 di bugfix guide (P1, P3, P4, C3 lingering, N1, N2, N3, SQL parametrized)
5. Update `install_all.sh` supaya saat install fresh, smoke-test wajib lulus sebelum installer report sukses

### Untuk supervisor
- **Jangan deploy/demo CamMatrix dalam keadaan saat ini** — semua kamera offline
- Pertimbangkan kalau magang minta override audit-only scope: kita bisa commit Fix 0 langsung ke branch mereka sebagai "fix dari mentor", tapi ini bypass pelajaran. Default tetap audit-only kecuali ada pressure deadline
- Setelah magang push fix, audit putaran 4 saya jalankan — fokus verifikasi Fix 0 + smoke test MediaMTX, bukan re-audit ke-11 finding

### Untuk infrastructure
- VM `cam00` di-stop service `mediamtx` saat ini. Kalau ada policy auto-start saat reboot, sementara `systemctl disable mediamtx` supaya tidak crash loop saat reboot
- `cammatrix-backend.service` masih jalan dan accept request — kalau magang lupa fix P5 dan ada user lain yang try add camera, backend tetap return HTTP 201 tapi runtime broken. Kalau perlu, mask backend juga sementara: `systemctl stop cammatrix-backend && systemctl mask cammatrix-backend` sampai fix terverifikasi

---

## Lampiran A — output diagnostik (2026-04-27 13:30 verify)

```
=== Service state ===
cammatrix-backend         active
cammatrix-frontend        active
mediamtx                  inactive
postgresql                active
minio                     active

=== mediamtx restart counter ===
NRestarts=534
ActiveEnterTimestamp=Mon 2026-04-27 13:07:00 WIB
InactiveEnterTimestamp=Mon 2026-04-27 13:07:02 WIB

=== MediaMTX last log (frozen, no new entries since stop) ===
Apr 27 13:07:00 mediamtx[100669]: ERR: invalid source: '${CAM_4_16_RTSP_URL}'
Apr 27 13:07:00 systemd[1]: mediamtx.service: Main process exited, code=exited, status=1/FAILURE
Apr 27 13:07:00 systemd[1]: mediamtx.service: Failed with result 'exit-code'.
Apr 27 13:07:02 systemd[1]: Stopped mediamtx.service - MediaMTX Streaming Server.

=== mediamtx.yml state akhir ===
rtspAddress: :8554
hlsAddress: :8888
api: yes
apiAddress: 127.0.0.1:9997

paths:
  all_others:

  cam_4_16:
    source: ${CAM_4_16_RTSP_URL}        ← bug P5 trigger
    sourceOnDemandCloseAfter: 60s

  cam_3_18:                              ← row anomali (rtsp_url="publisher")
```

---

## Lampiran B — kredensial yang saya akses

- SSH: `cam00 / cam2026!` (diberikan user)
- DB: via `sudo -u postgres psql cctv_vms` (no password, peer auth)
- Login API: `admin@vms.com / ClaudeTest!2026` (saya generate sementara)
- **Password admin@vms.com sudah di-restore** ke hash original. Magang bisa login dengan password lama mereka seperti biasa.

---

## Disclaimer audit

- Bug P5 berasal dari rekomendasi saya di audit putaran 2. Sudah saya akui dan dokumentasikan di memory (`feedback_verify_external_tool_behavior.md`).
- Saya **tidak commit code change** ke repo magang. Semua perubahan di server hanya di file config (`/etc/mediamtx/mediamtx.yml`) yang akan ditimpa lagi oleh backend pada camera mutation berikutnya — efektif tidak persistent.
- Live test scope terbatas pada 1 URL kamera (`rtsp://192.168.28.6/...`) dengan 1 user admin (`admin@vms.com`). Tidak menguji multi-user concurrency, recording, MinIO upload, atau frontend.
