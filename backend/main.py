from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Event startup: sinkronisasi semua kamera ke MediaMTX saat server mulai."""
    try:
        import httpx
        from sqlalchemy import select
        from app.core.database import AsyncSessionLocal
        from app.models.camera import Camera

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Camera))
            cameras = result.scalars().all()

        async with httpx.AsyncClient(timeout=3.0) as client:
            for cam in cameras:
                try:
                    await client.post(
                        f"{settings.MEDIAMTX_API_URL}/v3/config/paths/add/cam_{cam.id}",
                        json={"source": cam.rtsp_url}
                    )
                    print(f"✅ Synced camera {cam.id} ({cam.name}) to MediaMTX")
                except Exception as e:
                    print(f"⚠️  Could not sync camera {cam.id}: {e}")
    except Exception as e:
        print(f"⚠️  MediaMTX sync skipped: {e}")

    yield  # Server berjalan di sini
    # (cleanup jika diperlukan saat shutdown)


app = FastAPI(
    title=settings.APP_NAME,
    description="Intelligent Video Management System dengan AI Face Tracking",
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,  # Hubungkan startup sync
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/api/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}


@app.post("/api/v1/cameras/sync-mediamtx", tags=["Admin"])
async def sync_cameras_to_mediamtx():
    """Sinkronisasi ulang semua kamera dari database ke MediaMTX.
    Gunakan setelah Docker restart atau MediaMTX restart.
    """
    import httpx
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.models.camera import Camera
    from app.api.v1.endpoints.cameras import write_cameras_to_config

    synced, failed = [], []

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Camera))
        cameras = result.scalars().all()

    # 1. Tulis ke mediamtx.yml agar persist setelah restart
    write_cameras_to_config(cameras)

    # 2. Daftarkan ke MediaMTX via API agar langsung aktif sekarang
    async with httpx.AsyncClient(timeout=3.0) as client:
        for cam in cameras:
            try:
                await client.post(
                    f"{settings.MEDIAMTX_API_URL}/v3/config/paths/add/cam_{cam.id}",
                    json={"source": cam.rtsp_url}
                )
                synced.append({"id": cam.id, "name": cam.name})
            except Exception as e:
                failed.append({"id": cam.id, "name": cam.name, "error": str(e)})

    return {
        "message": f"Sync selesai: {len(synced)} berhasil, {len(failed)} gagal",
        "config_updated": True,
        "synced": synced,
        "failed": failed,
    }
