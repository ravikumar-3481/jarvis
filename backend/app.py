import os
import re
from html import unescape
from typing import Any
from urllib.parse import quote_plus, unquote, urlparse

import feedparser
import google.generativeai as genai
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from config import build_allowed_origins
except ModuleNotFoundError:
    from .config import build_allowed_origins

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "Jarvis Backend")
ALLOWED_ORIGINS = build_allowed_origins()
NEWS_REGION = os.getenv("NEWS_REGION", "US:en")
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "10"))
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

app = FastAPI(title=APP_NAME)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GeminiRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)


class SiteRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value or "")).strip()


def is_valid_http_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def normalize_direct_url(query: str) -> str | None:
    candidate = query.strip()

    if " " in candidate:
        return None

    if candidate.startswith(("http://", "https://")) and is_valid_http_url(candidate):
        return candidate

    if "." in candidate:
        return f"https://{candidate}"

    return None


def duckduckgo_redirect_to_url(href: str) -> str:
    if "uddg=" not in href:
        return href

    match = re.search(r"[?&]uddg=([^&]+)", href)
    return unquote(match.group(1)) if match else href


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "online", "service": APP_NAME}


@app.post("/api/gemini/generate")
def generate_with_gemini(
    payload: GeminiRequest,
    x_gemini_api_key: str | None = Header(default=None),
) -> dict[str, str]:
    if not x_gemini_api_key:
        raise HTTPException(status_code=400, detail="Missing X-Gemini-API-Key header")

    try:
        genai.configure(api_key=x_gemini_api_key)
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(
            (
                "You are JARVIS: concise, formal, technically sharp, and helpful. "
                "Answer in a polished voice assistant style.\n\n"
                f"User command: {payload.prompt}"
            )
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc

    text = clean_text(getattr(response, "text", ""))
    if not text:
        text = "Gemini returned an empty response."

    return {"text": text}


@app.get("/api/news")
def get_news(q: str = "technology") -> dict[str, Any]:
    query = clean_text(q) or "technology"
    rss_url = (
        "https://news.google.com/rss/search"
        f"?q={quote_plus(query)}&hl=en-US&gl=US&ceid={quote_plus(NEWS_REGION)}"
    )

    try:
        feed = feedparser.parse(rss_url)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"News search failed: {exc}") from exc

    items = []
    for entry in feed.entries[:8]:
        items.append(
            {
                "title": clean_text(entry.get("title", "")),
                "url": entry.get("link", ""),
                "published": entry.get("published", ""),
                "source": clean_text(entry.get("source", {}).get("title", "Google News")),
            }
        )

    return {"query": query, "items": items}


@app.post("/api/resolve-site")
def resolve_site(payload: SiteRequest) -> dict[str, str]:
    query = clean_text(payload.query)
    direct_url = normalize_direct_url(query)

    if direct_url:
        return {"title": query, "url": direct_url}

    search_url = f"https://duckduckgo.com/html/?q={quote_plus(query + ' official website')}"
    headers = {
        "User-Agent": "Mozilla/5.0 JarvisInterface/1.0",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        response = requests.get(search_url, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Website search failed: {exc}") from exc

    soup = BeautifulSoup(response.text, "html.parser")
    for link in soup.select("a.result__a"):
        href = link.get("href", "")
        url = duckduckgo_redirect_to_url(href)
        title = clean_text(link.get_text(" "))

        if is_valid_http_url(url):
            return {"title": title or query, "url": url}

    raise HTTPException(status_code=404, detail="No website result found")
