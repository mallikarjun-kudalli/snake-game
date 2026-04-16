# AI-Based Medical Pre-Diagnosis System

A Flask + Scikit-learn web app that predicts likely diseases from symptom text, then returns confidence, severity, advice, and top-3 alternatives.

## Features

- Symptom text input with NLP (TF-IDF).
- ML model comparison (Decision Tree vs Random Forest).
- Top disease + confidence + severity + advice.
- Top-3 predictions.
- Multi-theme frontend with voice input and local history.
- Health endpoint for deployment checks: `/health`.

## Local Setup

```powershell
cd "C:\Users\MALLU\Documents\New project\project"
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python model/train_model.py
python app.py
```

Open: `http://127.0.0.1:5000`

## Environment Variables

Use `.env.example` as reference:

- `PORT` (default: `5000`)
- `FLASK_DEBUG` (`true` or `false`)

## Deployment: Render

This repo includes:

- `Procfile`
- `render.yaml`
- `requirements.txt` (with `gunicorn`)

### Option A: Blueprint Deploy (recommended)

1. Push this `project` folder to a GitHub repo.
2. In Render, click **New +** -> **Blueprint**.
3. Select your repo.
4. Render reads `render.yaml` and creates the service automatically.

### Option B: Manual Web Service

1. In Render, click **New +** -> **Web Service**.
2. Connect your repo.
3. Build command:

```bash
pip install -r requirements.txt && python model/train_model.py
```

4. Start command:

```bash
gunicorn app:app --workers 2 --threads 4 --timeout 120
```

5. Health check path: `/health`

## Deployment: Railway

1. Create a new Railway project from your GitHub repo.
2. Railway auto-detects Python.
3. Set **Build Command**:

```bash
pip install -r requirements.txt && python model/train_model.py
```

4. Set **Start Command**:

```bash
gunicorn app:app --workers 2 --threads 4 --timeout 120
```

5. Add env var:
- `FLASK_DEBUG=false`

Railway injects `PORT` automatically.

## Notes

- If model pickle warnings appear due to version mismatch, retrain model:

```powershell
python model/train_model.py
```

- This application is educational and not a substitute for medical professionals.
