from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import sqlite3
import re
import pickle
from datetime import datetime


# ==========================================
# PATHS
# ==========================================

BASE = Path(__file__).resolve().parent.parent

DB = BASE / 'data' / 'reviews.db'

MODEL = (
    Path(__file__).resolve().parent
    / 'models'
    / 'sentiment_model.pkl'
)

clf = None


# ==========================================
# LOAD ML MODEL
# ==========================================

if MODEL.exists():

    try:

        with open(MODEL, "rb") as f:
            clf = pickle.load(f)

    except Exception:

        clf = None


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(
    title='Bank Muscat Customer Review Sentiment Analyzer',
    version='1.0.0'
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)


# ==========================================
# REQUEST MODEL
# ==========================================

class ReviewIn(BaseModel):

    text: str

    service: str = 'General'


# ==========================================
# DATABASE CONNECTION
# ==========================================

def conn():

    DB.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    c = sqlite3.connect(DB)

    c.row_factory = sqlite3.Row

    return c


# ==========================================
# INITIALIZE DATABASE
# ==========================================

def init_db():

    c = conn()

    c.execute('''
        CREATE TABLE IF NOT EXISTS reviews (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            text TEXT NOT NULL,

            service TEXT,

            sentiment TEXT,

            confidence REAL,

            created_at TEXT NOT NULL

        )
    ''')

    c.commit()

    c.close()


init_db()


# ==========================================
# LOAD MODEL AGAIN SAFELY
# ==========================================

try:

    with open(MODEL, 'rb') as f:
        clf = pickle.load(f)

except Exception:

    clf = None


# ==========================================
# FALLBACK SENTIMENT WORDS
# ==========================================

POS = {
    'amazing',
    'excellent',
    'great',
    'good',
    'easy',
    'fast',
    'helpful',
    'friendly',
    'secure',
    'convenient',
    'love',
    'satisfied',
    'smooth',
    'awesome',
    'best',
    'quick',
    'perfect'
}


NEG = {
    'bad',
    'poor',
    'terrible',
    'slow',
    'failed',
    'failure',
    'problem',
    'issue',
    'issues',
    'late',
    'delay',
    'delayed',
    'waiting',
    'unresponsive',
    'error',
    'difficult',
    'worst',
    'complaint',
    'charge',
    'blocked',
    'down'
}


# ==========================================
# FALLBACK PREDICTION
# ==========================================

def fallback_predict(text):

    words = set(
        re.findall(
            r"[a-zA-Z']+",
            text.lower()
        )
    )

    p = len(words & POS)

    n = len(words & NEG)


    if p == n == 0:

        return 'Neutral', 0.62


    if p > n:

        return (
            'Positive',
            min(
                0.96,
                0.70 + 0.06 * (p - n)
            )
        )


    return (
        'Negative',
        min(
            0.96,
            0.70 + 0.06 * (n - p)
        )
    )


# ==========================================
# ML PREDICTION
# ==========================================

def predict(text):

    text_lower = text.lower()

    # Handle common negative phrases with "not"
    negative_phrases = [
        "not good",
        "not great",
        "not helpful",
        "not satisfied",
        "not happy",
        "not friendly",
        "not reliable",
        "not convenient",
        "not working",
        "not working properly",
        "not useful",
        "not acceptable",
        "not professional",
        "not clear"
    ]

    for phrase in negative_phrases:
        if phrase in text_lower:
            return "Negative", 0.90

    # Use trained ML model for other reviews
    if clf:
        pred = clf.predict([text])[0]

        try:
            probs = clf.predict_proba([text])[0]
            conf = float(max(probs))
        except Exception:
            conf = 0.85

        return str(pred).title(), conf

    return fallback_predict(text)

# ==========================================
# HEALTH CHECK
# ==========================================

@app.get('/api/health')
def health():

    return {
        'status': 'ok',
        'service': 'Bank Muscat Sentiment API'
    }


# ==========================================
# PREDICT REVIEW
# ==========================================

@app.post('/api/predict')
def predict_review(payload: ReviewIn):

    text = payload.text.strip()


    if len(text) < 3:

        raise HTTPException(
            400,
            'Please enter a longer review.'
        )


    sentiment, confidence = predict(text)
    c = conn()

    existing = c.execute(
        '''
        SELECT id
        FROM reviews
        WHERE LOWER(text) = LOWER(?)
        LIMIT 1
        ''',
        (text,)
    ).fetchone()
    print("CHECKING TEXT:", repr(text))
    print("EXISTING REVIEW:", existing)

    if existing:
        c.close()

        raise HTTPException(
            409,
            'This review has already been analyzed.'
        )


  

    cur = c.execute(
        '''
        INSERT INTO reviews(
            text,
            service,
            sentiment,
            confidence,
            created_at
        )

        VALUES (?, ?, ?, ?, ?)
        ''',

        (
            text,
            payload.service,
            sentiment,
            confidence,
            datetime.utcnow().isoformat()
        )
    )


    c.commit()


    rid = cur.lastrowid


    c.close()


    if sentiment == 'Positive':

        message = (
            'The customer is satisfied '
            'with the service.'
        )

    elif sentiment == 'Negative':

        message = (
            'The customer may need support.'
        )

    else:

        message = (
            'The feedback is balanced '
            'or unclear.'
        )


    return {

        'id': rid,

        'text': text,

        'service': payload.service,

        'sentiment': sentiment,

        'confidence': round(
            confidence * 100,
            1
        ),

        'message': message

    }


# ==========================================
# DASHBOARD SUMMARY
# ==========================================

@app.get('/api/summary')
def summary():

    c = conn()


    # --------------------------------------
    # Overall sentiment counts
    # --------------------------------------

    rows = c.execute(
        '''
        SELECT
            sentiment,
            COUNT(*) n

        FROM reviews

        GROUP BY sentiment
        '''
    ).fetchall()


    total = sum(
        r['n']
        for r in rows
    )


    dist = {

        r['sentiment']: r['n']

        for r in rows

    }


    # --------------------------------------
    # Service-wise sentiment
    # --------------------------------------

    services = c.execute(
        '''
        SELECT

            service,

            AVG(
                CASE

                    WHEN sentiment = "Positive"
                        THEN 100

                    WHEN sentiment = "Neutral"
                        THEN 50

                    ELSE 0

                END
            ) score,

            COUNT(*) n

        FROM reviews

        GROUP BY service

        ORDER BY score DESC
        '''
    ).fetchall()


    # --------------------------------------
    # Recent reviews
    # --------------------------------------

    recent = c.execute(
        '''
        SELECT

            id,

            text,

            service,

            sentiment,

            confidence,

            created_at

        FROM reviews

        ORDER BY id DESC

        LIMIT 6
        '''
    ).fetchall()


    # --------------------------------------
    # Monthly sentiment trend
    # --------------------------------------

    monthly_rows = c.execute(
        '''
        SELECT

            strftime(
                '%Y-%m',
                created_at
            ) AS month,

            SUM(
                CASE
                    WHEN sentiment = "Positive"
                    THEN 1
                    ELSE 0
                END
            ) AS positive,

            SUM(
                CASE
                    WHEN sentiment = "Neutral"
                    THEN 1
                    ELSE 0
                END
            ) AS neutral,

            SUM(
                CASE
                    WHEN sentiment = "Negative"
                    THEN 1
                    ELSE 0
                END
            ) AS negative

        FROM reviews

        GROUP BY strftime(
            '%Y-%m',
            created_at
        )

        ORDER BY month
        '''
    ).fetchall()


    c.close()


    return {

        'total': total,

        'positive':
            dist.get(
                'Positive',
                0
            ),

        'neutral':
            dist.get(
                'Neutral',
                0
            ),

        'negative':
            dist.get(
                'Negative',
                0
            ),

        'services': [

            dict(r)

            for r in services

        ],

        'recent': [

            dict(r)

            for r in recent

        ],

        'monthly': [

            dict(r)

            for r in monthly_rows

        ]

    }


# ==========================================
# REVIEW HISTORY
# ==========================================

@app.get('/api/reviews')
def reviews(limit: int = 100):

    c = conn()


    rows = c.execute(
        '''
        SELECT *

        FROM reviews

        ORDER BY id DESC

        LIMIT ?
        ''',

        (
            min(
                limit,
                500
            ),
        )
    ).fetchall()


    c.close()


    return [
        dict(r)
        for r in rows
    ]


# ==========================================
# ANALYTICS & INSIGHTS API
# ==========================================

@app.get('/api/analytics')
def analytics():

    c = conn()


    # ======================================
    # OVERALL STATISTICS
    # ======================================

    stats = c.execute(
        '''
        SELECT

            COUNT(*) AS total,

            AVG(confidence)
                AS avg_confidence

        FROM reviews
        '''
    ).fetchone()


    total = (
        stats['total']
        or 0
    )


    avg_confidence = (
        stats['avg_confidence']
        or 0
    )


    # ======================================
    # OVERALL SENTIMENT
    # ======================================

    sentiment_rows = c.execute(
        '''
        SELECT

            sentiment,

            COUNT(*) AS count

        FROM reviews

        GROUP BY sentiment
        '''
    ).fetchall()


    sentiment_counts = {

        row['sentiment']:
            row['count']

        for row in sentiment_rows

    }


    positive = sentiment_counts.get(
        'Positive',
        0
    )


    neutral = sentiment_counts.get(
        'Neutral',
        0
    )


    negative = sentiment_counts.get(
        'Negative',
        0
    )


    # ======================================
    # SERVICE-WISE ANALYTICS
    # ======================================

    service_rows = c.execute(
        '''
        SELECT

            service,

            COUNT(*) AS reviews,

            SUM(
                CASE

                    WHEN sentiment = "Positive"
                    THEN 1

                    ELSE 0

                END
            ) AS positive,

            SUM(
                CASE

                    WHEN sentiment = "Neutral"
                    THEN 1

                    ELSE 0

                END
            ) AS neutral,

            SUM(
                CASE

                    WHEN sentiment = "Negative"
                    THEN 1

                    ELSE 0

                END
            ) AS negative,

            AVG(
                CASE

                    WHEN sentiment = "Positive"
                    THEN 100

                    WHEN sentiment = "Neutral"
                    THEN 50

                    ELSE 0

                END
            ) AS score,

            AVG(confidence)
                AS confidence

        FROM reviews

        GROUP BY service

        ORDER BY score DESC
        '''
    ).fetchall()


    # ======================================
    # PREPARE SERVICE DATA
    # ======================================

    service_data = []


    for row in service_rows:

        reviews_count = (
            row['reviews']
            or 0
        )


        positive_count = (
            row['positive']
            or 0
        )


        neutral_count = (
            row['neutral']
            or 0
        )


        negative_count = (
            row['negative']
            or 0
        )


        if reviews_count > 0:

            positive_percentage = round(
                (
                    positive_count
                    / reviews_count
                ) * 100,
                1
            )


            neutral_percentage = round(
                (
                    neutral_count
                    / reviews_count
                ) * 100,
                1
            )


            negative_percentage = round(
                (
                    negative_count
                    / reviews_count
                ) * 100,
                1
            )

        else:

            positive_percentage = 0

            neutral_percentage = 0

            negative_percentage = 0


        service_data.append({

            'service':
                row['service'],

            'reviews':
                reviews_count,

            'positive':
                positive_count,

            'neutral':
                neutral_count,

            'negative':
                negative_count,

            'positive_percentage':
                positive_percentage,

            'neutral_percentage':
                neutral_percentage,

            'negative_percentage':
                negative_percentage,

            'score':
                round(
                    row['score']
                    or 0,
                    1
                ),

            'confidence':
                round(
                    (
                        row['confidence']
                        or 0
                    ) * 100,
                    1
                )

        })


    # ======================================
    # BEST / WORST SERVICE
    # ======================================

    best_service = None

    worst_service = None


    if service_data:

        best_service = max(
            service_data,
            key=lambda x: x['score']
        )


        worst_service = min(
            service_data,
            key=lambda x: x['score']
        )


    # ======================================
    # OVERALL PERCENTAGES
    # ======================================

    if total > 0:

        positive_percentage = round(
            (
                positive
                / total
            ) * 100,
            1
        )


        neutral_percentage = round(
            (
                neutral
                / total
            ) * 100,
            1
        )


        negative_percentage = round(
            (
                negative
                / total
            ) * 100,
            1
        )

    else:

        positive_percentage = 0

        neutral_percentage = 0

        negative_percentage = 0


    # ======================================
    # BUSINESS INSIGHTS
    # ======================================

    insights = []


    if positive_percentage >= 60:

        insights.append(
            "Overall customer sentiment is positive, indicating good customer satisfaction."
        )

    elif negative_percentage >= 40:

        insights.append(
            "Negative feedback is relatively high and may require immediate attention."
        )

    else:

        insights.append(
            "Customer sentiment is mixed and should be monitored regularly."
        )


    if best_service:

        insights.append(
            f"{best_service['service']} is currently "
            f"the best-performing service with a "
            f"sentiment score of "
            f"{best_service['score']}%."
        )


    if worst_service:

        insights.append(
            f"{worst_service['service']} has the "
            f"lowest sentiment score at "
            f"{worst_service['score']}% and may need improvement."
        )


    if avg_confidence >= 0.75:

        insights.append(
            "The sentiment model is showing a strong average prediction confidence."
        )

    else:

        insights.append(
            "Some predictions have lower confidence and may require manual review."
        )


    # ======================================
    # CLOSE DATABASE
    # ======================================

    c.close()


    # ======================================
    # FINAL RESPONSE
    # ======================================

    return {

        'total_reviews':
            total,


        'sentiment': {

            'positive':
                positive,

            'neutral':
                neutral,

            'negative':
                negative,

            'positive_percentage':
                positive_percentage,

            'neutral_percentage':
                neutral_percentage,

            'negative_percentage':
                negative_percentage

        },


        'average_confidence':
            round(
                avg_confidence * 100,
                1
            ),


        'services':
            service_data,


        'best_service':
            best_service,


        'worst_service':
            worst_service,


        'insights':
            insights

    }