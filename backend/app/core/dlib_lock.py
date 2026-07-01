"""
Global lock untuk mencegah penggunaan dlib secara bersamaan (concurrent).

dlib (library yang digunakan oleh face_recognition) TIDAK thread-safe.
Jika dua thread memanggil face_recognition.face_locations() atau
face_recognition.face_encodings() secara bersamaan, akan terjadi
Segmentation Fault (SIGSEGV) yang mematikan seluruh proses backend.

Semua kode yang memanggil face_recognition HARUS menggunakan lock ini:

    from app.core.dlib_lock import dlib_lock
    with dlib_lock:
        locations = face_recognition.face_locations(rgb)
        encodings = face_recognition.face_encodings(rgb, locations)
"""
import threading

# Semaphore(1) = hanya 1 thread yang boleh akses dlib dalam satu waktu
dlib_lock = threading.Semaphore(1)
