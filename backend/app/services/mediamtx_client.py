import httpx
from app.core.config import settings

async def add_path(slug: str, rtsp_url: str):
    async with httpx.AsyncClient() as client:
        payload = {
            "sourceOnDemandCloseAfter": "60s",
            # Aktifkan recording — tanpa ini, path via API mengabaikan setting all_others
            "record": True,
            "recordPath": "/var/www/CamMatrix/recordings/%path/%Y-%m-%d_%H-%M-%S.mp4",
            "recordPartDuration": "1s",
            "recordSegmentDuration": "3600s",
        }
        # Mode pull: kamera CCTV yang punya RTSP URL
        # Mode push: Larix/app yang push ke MediaMTX (source = publisher)
        if rtsp_url == "publisher":
            payload["source"] = "publisher"
        else:
            payload["source"] = rtsp_url
        auth = ("publisher", settings.MTX_PUBLISHER_PASS)

        # Coba PATCH dulu — untuk update path yang sudah ada di config MediaMTX
        r = await client.patch(
            f"{settings.MEDIAMTX_API_URL}/v3/config/paths/patch/{slug}",
            json=payload,
            auth=auth,
            timeout=5,
        )

        # Jika path belum ada (404), baru gunakan ADD
        if r.status_code == 404:
            r = await client.post(
                f"{settings.MEDIAMTX_API_URL}/v3/config/paths/add/{slug}",
                json=payload,
                auth=auth,
                timeout=5,
            )

        if r.status_code not in (200, 201, 204):
            r.raise_for_status()



async def remove_path(slug: str):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{settings.MEDIAMTX_API_URL}/v3/config/paths/delete/{slug}",
            auth=("publisher", settings.MTX_PUBLISHER_PASS),
            timeout=5,
        )
        r.raise_for_status()
