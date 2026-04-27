import httpx
from app.core.config import settings

async def add_path(slug: str, rtsp_url: str):
    async with httpx.AsyncClient() as client:
        payload = {"source": rtsp_url, "sourceOnDemandCloseAfter": "60s"}
        if rtsp_url == "publisher":
            payload = {"sourceOnDemandCloseAfter": "60s"} # Kosongkan source agar MediaMTX menerima PUSH
            
        r = await client.post(
            f"{settings.MEDIAMTX_API_URL}/v3/config/paths/add/{slug}",
            json=payload,
            auth=("publisher", settings.MTX_PUBLISHER_PASS),
            timeout=5,
        )
        r.raise_for_status()

async def remove_path(slug: str):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{settings.MEDIAMTX_API_URL}/v3/config/paths/delete/{slug}",
            auth=("publisher", settings.MTX_PUBLISHER_PASS),
            timeout=5,
        )
        r.raise_for_status()
