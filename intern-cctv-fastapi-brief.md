# Brief FastAPI Admin — CCTV Web

> Brief untuk tim magang. Scope: **FastAPI admin + generator pattern**.
> Public viewer (nginx, HLS, ffmpeg, halaman publik) urusan magang sepenuhnya.

---

## 0. Pembagian tegas

| Komponen | Port | Tanggung jawab | Siapa garap |
|---|---|---|---|
| nginx (public viewer) | 80/443 | Render halaman CCTV, serve HLS/snapshot dari disk | **Magang** |
| FastAPI (admin) | 8000 (HTTP loopback) atau 8443 (TLS) | Login, manage user, CRUD kamera, trigger generator | **Brief ini** |
| Generator script | — | Baca DB/YAML → tulis snippet config nginx → validate → reload | **Brief ini** |

**Aturan**: FastAPI **tidak pernah** dipanggil oleh viewer publik. Tidak ada `auth_request` dari nginx ke FastAPI. nginx fully autonomous untuk viewer. FastAPI hanya kontrol dari sisi admin.

---

## 1. Port plan

```
[Admin]   https://admin.cctv.local:8443  ──▶  FastAPI (uvicorn)
                                              │
                                              │  tulis cameras.yaml
                                              │  panggil generator
                                              ▼
                                         [Generator script]
                                              │
                                              │  render snippet → nginx -t → nginx -s reload
                                              ▼
[Pengunjung] https://cctv.local            nginx serve HLS  (tanpa lewat FastAPI)
```

Dua hostname terpisah → bind ke port berbeda → tidak saling tahu. Gampang di-firewall: port admin (8443) cukup di-allow dari subnet kantor saja.

---

## 2. Alur login admin

```
GET /login
  └─ FastAPI render form, set cookie csrf_token (secrets.token_urlsafe(32))

POST /login  body: {username, password, csrf_token}
  ├─ rate-limit slowapi: 5/menit per IP   → kalau lewat: 429
  ├─ csrf check: secrets.compare_digest(cookie, body)   → mismatch: 403
  ├─ user = db.query(User).filter_by(username=...).first()
  │     kalau None: bcrypt.checkpw dummy hash (timing-safe), return 401
  ├─ bcrypt.checkpw(password, user.password_hash)        → mismatch: 401
  ├─ session_id = secrets.token_urlsafe(32)
  ├─ simpan ke Redis (atau tabel sessions): {session_id: {user_id, role, csrf_token, exp}}
  ├─ set cookie: session_id (HttpOnly, Secure, SameSite=Lax, exp 8 jam)
  ├─ audit_log(user_id, "login.success", ip, user_agent)
  └─ 302 → /dashboard

POST /logout
  └─ delete session, clear cookie, audit_log("logout")
```

**Wajib**:
- `SECRET_KEY` & `SESSION_ENCRYPT_KEY` dari env, fail-fast kalau kosong
- bcrypt cost ≥ 12
- Session di **server-side** (Redis/DB), bukan JWT — biar bisa revoke kalau akun di-suspend

---

## 3. Middleware order (penting, urutan salah → security hole)

```
Request
  → 1. TrustedHostMiddleware     (block host header injection)
  → 2. HTTPSRedirect (kalau prod)
  → 3. SessionMiddleware         (load session dari cookie)
  → 4. CSRFMiddleware            (untuk method state-changing)
  → 5. RateLimitMiddleware
  → 6. AuditMiddleware           (log request + user_id)
  → Router
```

CSRF check **sebelum** sampai router supaya body besar tidak di-parse percuma untuk request yang bakal ditolak.

---

## 4. Dependency injection — pola yang harus dipakai

```python
# deps.py — pseudo
def get_db(): ...
def get_current_session(request) -> Session | None: ...
def require_user(s = Depends(get_current_session)):
    if not s: raise HTTPException(401)
    return s
def require_role(*roles):
    def dep(s = Depends(require_user)):
        if s.role not in roles: raise HTTPException(403)
        return s
    return dep

# routers/cameras.py
@router.post("")
def create_camera(payload, db=Depends(get_db),
                  s=Depends(require_role("admin"))):
    ...
```

Pakai `Depends`, jangan cek session manual di tiap handler. Lebih sulit lupa.

---

## 5. Alur tambah kamera (generator pattern — INTI)

```
POST /api/cameras  body: {slug, name, rtsp_url, rtsp_user, rtsp_pass, is_public}

  1. require_role("admin")
  2. csrf check
  3. validate Pydantic:
       - slug: regex ^[a-z0-9-]+$  (dipakai sebagai path nginx, harus aman)
       - rtsp_url: scheme rtsp:// only
       - name: maxlen 100
  4. encrypt rtsp_pass:
       Fernet(key=os.environ["CAMERA_PASS_KEY"]).encrypt(...)
  5. db.add(Camera(...)); db.commit()
  6. audit_log(user, "camera.create", slug)
  7. trigger_generator()    ← lihat alur 6
  8. return 201 CameraOut (rtsp_pass redacted ke "***")
```

---

## 6. Alur generator (jembatan FastAPI → nginx)

```
trigger_generator() — dipanggil setelah create/update/delete kamera

  1. lock file /var/run/cctv-generator.lock (flock, anti-race kalau 2 admin barengan)
  2. backup:
       cp /etc/cctv/cameras.yaml  /var/backups/cctv/cameras-<ts>.yaml
       cp /etc/nginx/conf.d/cameras.generated.conf  /var/backups/cctv/cameras-<ts>.conf
  3. dump dari DB ke /etc/cctv/cameras.yaml:
       cameras:
         - slug: parkir-utara
           name: "Parkir Utara"
           rtsp_url: rtsp://...      (untuk stream-worker, bukan untuk nginx)
           is_public: true
  4. render: panggil generator/render.py (atau Jinja2 template) →
       hasilkan /etc/nginx/conf.d/cameras.generated.conf
       (location block per kamera, alias ke /data/hls/<slug>/)
  5. validate: subprocess.run(["nginx", "-t"]) — capture stderr
       kalau exit != 0:
         restore backup ke kedua file
         audit_log("generator.failed", stderr)
         raise HTTPException(500, "config invalid, rolled back")
  6. reload: subprocess.run(["nginx", "-s", "reload"])
  7. audit_log("generator.applied", N kamera)
  8. release lock
```

**Yang krusial**:
- FastAPI tidak menulis ke `/etc/nginx/` langsung pakai user FastAPI. Generator dijalankan via **sudoers narrow signature** — user `cctv-admin` hanya boleh exec 2 command persis: `nginx -t` dan `nginx -s reload`. Tidak ada wildcard.
- Lock file mencegah corrupted state kalau 2 admin click bersamaan.
- Validate-before-reload + rollback = nginx tidak akan pernah load config rusak.

---

## 7. Endpoint list (minimum)

```
POST   /login
POST   /logout
GET    /me

GET    /api/cameras                      operator+
POST   /api/cameras                      admin
GET    /api/cameras/{slug}               operator+
PATCH  /api/cameras/{slug}               admin
DELETE /api/cameras/{slug}               admin

GET    /api/users                        admin
POST   /api/users                        admin
PATCH  /api/users/{id}                   admin (role/password)
DELETE /api/users/{id}                   admin

GET    /api/audit-logs                   admin    (filter: user_id, action, since)
POST   /api/generator/reapply            admin    (manual re-trigger kalau perlu)
```

---

## 8. DB schema FastAPI

```sql
users        id, username UNIQUE, password_hash, role ENUM('viewer','operator','admin'),
             is_active, created_at, last_login_at
cameras      id, slug UNIQUE, name, rtsp_url, rtsp_user, rtsp_pass_enc,
             is_public, created_by, created_at, updated_at
audit_logs   id, user_id NULL, action, target, detail JSONB, ip, user_agent, ts
sessions     session_id PK, user_id, csrf_token, ip, user_agent, created_at, expires_at
             (atau di Redis dengan TTL)
```

---

## 9. Hardening checklist FastAPI (non-negotiable)

1. `SECRET_KEY`, `CAMERA_PASS_KEY` dari env, fail-fast saat startup kalau kosong
2. bcrypt cost ≥ 12
3. CSRF token di semua POST/PUT/PATCH/DELETE
4. Rate-limit `/login` (5/menit per IP) — pakai slowapi
5. Session server-side (Redis/DB), TTL 8 jam, sliding refresh opsional
6. Cookie: `HttpOnly`, `Secure`, `SameSite=Lax`
7. Pydantic validation tegas, slug pakai regex (dipakai sebagai path nginx → injection risk)
8. RTSP password encrypted at rest (Fernet)
9. Audit log tiap aksi state-changing (siapa, kapan, apa, IP)
10. Sudoers narrow untuk reload nginx (2 signatures, no wildcard)
11. Bind FastAPI ke `127.0.0.1:8000` di balik reverse proxy lokal, atau langsung TLS di `0.0.0.0:8443` dengan firewall
12. `pip-audit` atau `safety` di CI

---

## 10. Yang magang urus sendiri (di luar brief ini)

- Konfigurasi nginx (vhost public, HLS, rate-limit viewer, TLS, dst)
- Stream-worker ffmpeg RTSP→HLS
- Halaman publik (HTML/JS player — hls.js atau video.js)
- Jinja2/React untuk halaman admin (FastAPI cuma backend; bebas pilih)
- Deployment (systemd unit, Docker Compose, atau apa pun)
- Schema migration tool (Alembic atau bikin sendiri)

---

## 11. Kapan kembali bertanya

- Kalau bingung soal generator pattern (paling sering nyangkut di sini)
- Kalau review hardening sebelum production
- Kalau ada konflik race-condition antara FastAPI dan nginx reload

Sebelum itu, kerjakan sendiri.
