# SaaS Pricing Comparator v2 — Setup Instructions

## 0 · Prerequisites

```bash
psql -U postgres -c "CREATE DATABASE demo;"
```

Optional keys in `.env` (project root):

```
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-...     # for AI Advisor / Recommender (https://openrouter.ai/keys)
```

## Real pricing data (optional)

By default, **Azure** uses **live data** from the [Azure Retail Prices API](https://prices.azure.com/api/retail/prices) (no key required). Other providers use built-in fallback data unless you add API tokens:

| Provider       | Real data source              | Env variable           | Required? |
|----------------|-------------------------------|------------------------|-----------|
| **Azure**      | Retail Prices API             | —                      | No        |
| **Hetzner**    | Hetzner Cloud API             | `HETZNER_API_TOKEN`    | Yes       |
| **DigitalOcean** | DigitalOcean API (sizes)    | `DO_API_TOKEN`         | Yes       |
| AWS, GCP, etc. | —                             | —                      | Fallback only |

- **Hetzner:** Create a read-only token at [Hetzner Cloud Console](https://console.hetzner.cloud/) → Project → Security → API Tokens. Add to `.env`: `HETZNER_API_TOKEN=...`
- **DigitalOcean:** Create a token at [DigitalOcean API](https://cloud.digitalocean.com/account/api/tokens). Add: `DO_API_TOKEN=...`

Sync runs on startup and every 6 hours; use **Dashboard → Sync all** or `POST /admin/scrape` to refresh.

## Start both (single command)

From the project root:

```bash
./start.sh
```

Starts the backend at http://127.0.0.1:8000 and the frontend at http://localhost:5173. Press Ctrl+C to stop both. Run the one-time setup below first.

## One-time setup (project root)

**IMPORTANT:** Run all commands from the project root (the folder that contains `app/`, `src/`, `package.json`, `requirements.txt`).

```bash
# Backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py

# Frontend
npm install
```

Then start the app with `./start.sh`, or run backend and frontend separately:

- Backend: `python -m uvicorn app.main:app --reload` (from root, with venv activated)
- Frontend: `npm run dev` (from root)

Backend runs at http://127.0.0.1:8000 — use http://127.0.0.1:8000/docs for Swagger.  
Frontend runs at http://localhost:5173.

## Troubleshooting

- **Run from this project only**  
  Use the project folder that contains `app/` and `src/`. Running from another copy can cause import errors.

- **`ImportError: cannot import name 'computed_field' from 'pydantic'`**  
  The app needs **Pydantic v2**. Install it in the same environment that runs uvicorn:
  ```bash
  source venv/bin/activate
  pip install "pydantic>=2.0,<3"
  pip install -r requirements.txt
  python -m uvicorn app.main:app --reload
  ```
  If your venv has a broken interpreter (e.g. "bad interpreter: ... python3.13: no such file or directory"), recreate the venv:
  ```bash
  rm -rf venv
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  ```
