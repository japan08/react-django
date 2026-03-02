# SaaS Pricing Comparator v2 — Setup Instructions

## 0 · Prerequisites

```bash
psql -U postgres -c "CREATE DATABASE demo;"
```

Optional keys in `backend/.env`:

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

From the project root (the folder that contains `backend/` and `frontend/`):

```bash
./start.sh
```

This starts the backend at http://127.0.0.1:8000 and the frontend at http://localhost:5173. Press Ctrl+C to stop both. Ensure you’ve run backend and frontend setup at least once (venv, `pip install`, `npm install`) before using `start.sh`.

## 1 · Backend

**IMPORTANT:** You must run the backend from **this** project folder: `saas-pricing-comparator-v2/backend`.  
If you run from another copy (e.g. one in Trash), you will get `ImportError: cannot import name 'computed_field'` and/or `from app.routes import router` loading the wrong file. Always `cd` into the folder that contains this SETUP.md’s project before running any backend commands.

```bash
cd saas-pricing-comparator-v2/backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py
python -m uvicorn app.main:app --reload
```

Use **`python -m uvicorn`** (not `uvicorn` alone) so the same Python that has Pydantic v2 is used.

Backend runs at http://127.0.0.1:8000 — use http://127.0.0.1:8000/docs for Swagger.

## 2 · Frontend (new terminal)

```bash
cd saas-pricing-comparator-v2/frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

## Troubleshooting

- **Run from this project only**  
  Use the project folder (e.g. `.../react-django/saas-pricing-comparator-v2/backend`). Do not run from a copy in Trash or another path, or the app may import an old `routes.py` and fail.

- **`ImportError: cannot import name 'computed_field' from 'pydantic'`**  
  The app needs **Pydantic v2**. Install it in the same environment that runs uvicorn:
  ```bash
  cd saas-pricing-comparator-v2/backend
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
