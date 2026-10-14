# Bank Muscat Customer Review Sentiment Analyzer

A full-stack academic project inspired by the requested UI. It includes a responsive dashboard, customer-review analysis screen, FastAPI backend, SQLite persistence, sentiment prediction, KPIs, service-wise analytics, recent reviews, and charts.

## Run

### 1. Install dependencies
```bash
pip install fastapi uvicorn pydantic scikit-learn
```

### 2. Seed demo data
From the project root:
```bash
python data/seed.py
```

### 3. Start backend
```bash
uvicorn backend.main:app --reload
```
Backend: http://127.0.0.1:8000
Swagger API docs: http://127.0.0.1:8000/docs

### 4. Open frontend
Open `frontend/index.html` in your browser. If your browser blocks local fetches, serve it with:
```bash
python -m http.server 5500 --directory frontend
```
Then open http://127.0.0.1:5500

## Main API
- `GET /api/health`
- `POST /api/predict` with `{ "text": "...", "service": "Mobile Banking" }`
- `GET /api/summary`
- `GET /api/reviews`

## Next upgrade
Replace the built-in fallback classifier with a trained TF-IDF + Logistic Regression model using a real labeled banking-review dataset. The backend already supports loading `models/sentiment_model.pkl` if present.
