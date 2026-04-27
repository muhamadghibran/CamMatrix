# CamMatrix Audit Fix Bundle

> **Untuk**: tim magang CamMatrix
> **Versi**: 1.0 (2026-04-27)
> **Sumber audit**: `/mnt/magangcam.md` (round 1) + `/mnt/magangcam-reaudit-dfc06aa.md` (round 2) + `/mnt/magangcam-reaudit-249dc19.md` (round 3)
> **Dokumentasi pelajaran**: `/mnt/mattixcambugfix.md`
> **Laporan live test**: `/mnt/cammatrix-laporan-livetest-20260427.md`

Bundle ini berisi **kode siap-apply** untuk Prio 0 + Prio 1 finding audit. Setiap finding dipisah ke modul tersendiri supaya magang bisa apply, verify, lalu lanjut ke modul berikutnya.

---

## Urutan apply (WAJIB ikut urutan)

```
00-p5-mediamtx-envvar/                    ← BLOCKER: tanpa ini MediaMTX crash loop
01-p4-jwt-scope-enforce/                  ← klaim scope JWT akhirnya di-enforce
02-c3-create-admin-removal/               ← hapus create_admin.py admin123
03-p1-publisher-mobile/                   ← regression Larix mobile
04-n1-n2-privacy-tenant/                  ← privacy default-closed + dashboard scope
05-n3-encryption-key-separation/          ← pisah ENCRYPTION_KEY dari SECRET_KEY
```

---

## Cara apply (untuk masing-masing modul)

```bash
cd <module-folder>
sudo cat README.md           # pahami dulu
sudo ./apply.sh              # apply
```

Setelah tiap modul, jalankan tests yang relevant:
```bash
../tests/test_add_camera_pjn.sh   # setelah Modul 00
../tests/test_jwt_scope.sh        # setelah Modul 01
../tests/test_public_filter.sh    # setelah Modul 04
```

---

## Apa isi tiap modul

| Modul | Fix | File yang berubah | Risiko apply |
|---|---|---|---|
| **00-p5** | MediaMTX env var → URL plain | `cameras.py` | 🟢 Aman (sudah live-tested di prod 2026-04-27) |
| **01-p4** | JWT scope enforce | `deps.py` + sed-replace endpoints | 🟢 Aman, frontend perlu handle 403 baru |
| **02-c3** | Hapus `create_admin.py` + CLI baru | delete file + `app/cli.py` baru | 🟢 Aman, tidak break runtime |
| **03-p1** | mediamtx.yml 3-role auth | `mediamtx.yml` rewrite + `mediamtx.env` add user | 🟡 Backend perlu di IP `127.0.0.1` (atau adjust `ips:` block) |
| **04-n1-n2** | `is_public` column + dashboard scope | migration + `models/camera.py` + `public.py` + `dashboard.py` | 🟡 Halaman publik kosong sampai operator opt-in tiap kamera |
| **05-n3** | `ENCRYPTION_KEY` separate | rotation script + `config.py` + `security.py` + `.env` | 🟡 Rotation harus jalan benar — testing di staging dulu |

---

## Yang TIDAK ada di bundle ini

Sengaja di-skip:

| Finding | Alasan |
|---|---|
| **P2** docker-compose half-feature | Butuh keputusan strategis: hapus atau lengkapi. Magang yang putuskan |
| **P3** SERVER_IP urutan di install_all.sh | Cuma swap 2 baris — magang edit langsung |
| **H1** SQL f-string parametrized | Magang edit `seed_admin.py` inline manual; pattern di README cukup detail di `/mnt/mattixcambugfix.md` Fix 7 |
| **H2** systemd User=root | Butuh decision soal user (`cammatrix`/`www-data`) + chown banyak directory |
| **H9** firewall (ufw/iptables) | Tergantung policy network ops |
| **H12** isAuthenticated re-verify | Frontend code, butuh integration dengan axios interceptor mereka |
| **M20** npx serve → nginx/caddy | Butuh decision web server |

Semua finding ini punya kode contoh di `/mnt/mattixcambugfix.md` yang bisa magang adopsi sendiri.

---

## Pre-apply checklist

Sebelum apply ANY modul:

```bash
# 1. Snapshot DB
sudo -u postgres pg_dump cctv_vms > /var/backups/cctv_vms-pre-fix-$(date +%Y%m%d).sql

# 2. Snapshot config
sudo cp -r /etc/mediamtx/ /var/backups/mediamtx-pre-fix-$(date +%Y%m%d)/
sudo cp /var/www/CamMatrix/backend/.env /var/backups/.env-pre-fix-$(date +%Y%m%d)

# 3. Note current state
sudo systemctl status cammatrix-backend mediamtx postgresql > /var/backups/state-pre-fix-$(date +%Y%m%d).txt
```

Setiap apply.sh juga buat backup sendiri di `/var/backups/cammatrix-fix-p5/` dengan timestamp — jadi rollback granular per-file selalu bisa.

---

## Rollback strategy

Per modul punya section "Rollback" di README masing-masing.

Rollback **urutan terbalik** dari apply:
1. Modul 05 dulu (kalau di-apply terakhir)
2. Modul 04 (rollback migration + restore code)
3. Modul 03 (restore mediamtx.yml + restart)
4. Modul 02 (restore create_admin.py)
5. Modul 01 (restore deps.py + sed-reverse endpoints)
6. Modul 00 (restore cameras.py)

Rollback DB snapshot kalau ada masalah serius:
```bash
sudo -u postgres psql cctv_vms -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
sudo -u postgres psql cctv_vms < /var/backups/cctv_vms-pre-fix-<DATE>.sql
```

---

## Test environment recommendation

**Sebelum apply ke prod**, magang sebaiknya:
1. Snapshot VM (Proxmox snapshot atau LXC backup)
2. Apply modul satu per satu
3. Test dengan `tests/*.sh` setiap selesai modul
4. Kalau ada masalah, restore snapshot

Testing di lab VM identik dengan prod (Ubuntu 24.04, PostgreSQL 16, MediaMTX v1.9.0) sebelum production sangat disarankan.

---

## Memetic risk

> "Layered defense (auth + IP + scope) tidak ditangkap sebagai pattern — dia melihat per-line bukan per-arsitektur."
> — audit putaran 3, hipotesis tentang gaya magang

Setelah apply bundle ini, **PIKIRKAN**:
- Mengapa `publisher` ips dikunci ke localhost padahal sudah ada password?
- Mengapa `must_change_password` perlu enforced di 2 tempat (token claim + dependency check)?
- Mengapa `ENCRYPTION_KEY` perlu beda dari `SECRET_KEY` padahal sama-sama 64 hex char?

Jawabannya: **defense-in-depth**. Setiap lapis = independent failure mode. Compromise satu lapis tidak otomatis bobol semuanya. Kalau magang masih melihat 3 hal di atas sebagai redundant, bahaya berikutnya akan ber-pola sama.

---

## Kalau ada masalah / pertanyaan

1. Cek log: `sudo journalctl -u <service> -n 50 --no-pager`
2. Cek file backup: `ls -lt /var/backups/cammatrix-fix-p5/`
3. Reproduce di staging, jangan langsung trial-and-error di prod
4. Kontak mentor dengan: log + backup timestamp + snapshot DB before
