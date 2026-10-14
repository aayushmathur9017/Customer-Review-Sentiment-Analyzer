import pandas as pd
import pickle

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report


# 1. Load dataset
data = pd.read_csv("data/reviews.csv")

print("Dataset loaded successfully!")
print("Total reviews:", len(data))
print("\nSentiment distribution:")
print(data["sentiment"].value_counts())


# 2. Input and output
X = data["review"]
y = data["sentiment"]


# 3. Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# 4. Create ML pipeline
model = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2)
        )
    ),
    (
        "classifier",
        LogisticRegression(
            max_iter=1000
        )
    )
])


# 5. Train model
print("\nTraining model...")
model.fit(X_train, y_train)

print("Training completed!")


# 6. Test model
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\nModel Accuracy:", round(accuracy * 100, 2), "%")

print("\nClassification Report:")
print(classification_report(y_test, predictions))


# 7. Save trained model
with open("models/sentiment_model.pkl", "wb") as file:
    pickle.dump(model, file)

print("\nModel saved successfully!")
print("Location: models/sentiment_model.pkl")