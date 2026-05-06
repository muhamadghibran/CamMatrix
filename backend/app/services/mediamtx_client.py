import httpx
from app.core.config import settings

async def add_path(slug: str, rtsp_url: str):
    async with httpx.AsyncClient() as client:
        payload = {
            "sourceOnDemandCloseAfter": "60s",
        }
        # Mode pull: kamera CCTV yang punya RTSP URL
        # Mode push: Larix/app yang push ke MediaMTX (source = publisher)
        if rtsp_url == "publisher":
            payload["source"] = "publisher"
        else:
            payload["source"] = rtsp_url

        r = await client.post(
            f"{settings.MEDIAMTX_API_URL}/v3/config/paths/add/{slug}",
            json=payload,
            auth=("publisher", settings.MTX_PUBLISHER_PASS),
            timeout=5,
        )
        # Jika path sudah ada (409), lakukan patch (update) bukan error
        if r.status_code == 409:
            r2 = await client.patch(
                f"{settings.MEDIAMTX_API_URL}/v3/config/paths/patch/{slug}",
                json=payload,
                auth=("publisher", settings.MTX_PUBLISHER_PASS),
                timeout=5,
            )
            r2.raise_for_status()
        elif r.status_code not in (200, 201):
            r.raise_for_status()


async def remove_path(slug: str):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{settings.MEDIAMTX_API_URL}/v3/config/paths/delete/{slug}",
            auth=("publisher", settings.MTX_PUBLISHER_PASS),
            timeout=5,
        )
        r.raise_for_status()
