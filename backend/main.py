from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1.router import api_router
from app.api import deps
from app.models.user import User


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
                    path = f"cam_{cam.owner_id}_{cam.id}"
                    await client.post(
                        f"{settings.MEDIAMTX_API_URL}/v3/config/paths/add/{path}",
                        json={"source": cam.rtsp_url}
                    )
                    print(f"✅ Synced camera {cam.id} ({cam.name}) as {path} to MediaMTX")
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
    # Sembunyikan docs di production (DEBUG=False)
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
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
async def sync_cameras_to_mediamtx(
    current_user: User = Depends(deps.get_current_admin)  # C4: wajib admin
):
    """Sinkronisasi ulang semua kamera dari database ke MediaMTX.
    Hanya dapat diakses oleh Administrator.
    """
    import httpx
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.models.camera import Camera
    from app.api.v1.endpoints.cameras import write_cameras_to_config, _build_rtsp_with_auth

    synced, failed = [], []

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Camera))
        cameras = result.scalars().all()

    write_cameras_to_config(cameras)

    async with httpx.AsyncClient(timeout=3.0) as client:
        for cam in cameras:
            try:
                authenticated_url = _build_rtsp_with_auth(
                    cam.rtsp_url, cam.username, cam.password
                )
                await client.post(
                    f"{settings.MEDIAMTX_API_URL}/v3/config/paths/add/cam_{cam.owner_id}_{cam.id}",
                    json={"source": authenticated_url}
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
