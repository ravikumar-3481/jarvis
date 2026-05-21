# Jarvis Backend

FastAPI backend for the Jarvis interface.

## Setup

```powershell
cd C:\Users\raviv\profileravi\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

## Frontend

Open `C:\Users\raviv\profileravi\index.html` in Chrome or Edge. Paste your Gemini API key in the popup. The key is stored in browser local storage, not in `.env`.

## Commands

- `Hey Jarvis`
- `Ask Gemini explain quantum computing`
- `Latest AI news`
- `Open YouTube`
- `Open my portfolio`
- `Status report`
- `Run scan`
