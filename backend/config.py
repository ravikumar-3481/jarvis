import os
from urllib.parse import urlparse


DEFAULT_ALLOWED_ORIGINS = "https://jarvisss.vercel.app,null"


def normalize_allowed_origin(value: str) -> str | None:
    origin = value.strip()

    if not origin:
        return None

    if origin == "null":
        return origin

    parsed = urlparse(origin)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"

    return origin.rstrip("/")


def build_allowed_origins(raw_origins: str | None = None) -> list[str]:
    origins = raw_origins
    if origins is None:
        origins = os.getenv("ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS)

    normalized = [
        origin
        for origin in (normalize_allowed_origin(value) for value in origins.split(","))
        if origin
    ]

    return list(dict.fromkeys(normalized))
