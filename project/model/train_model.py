import json
import pickle
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "dataset" / "symptoms_disease.csv"
MODEL_PATH = BASE_DIR / "model" / "medical_model.pkl"
METRICS_PATH = BASE_DIR / "model" / "model_metrics.json"


def clean_text(text: str) -> str:
    return " ".join(str(text).strip().lower().split())


def load_data() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    df = df.dropna(subset=["symptoms", "disease"]).copy()
    df["symptoms"] = df["symptoms"].apply(clean_text)
    df["disease"] = df["disease"].str.strip()
    return df


def build_models() -> dict:
    return {
        "decision_tree": Pipeline(
            steps=[
                ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
                ("model", DecisionTreeClassifier(random_state=42, max_depth=15)),
            ]
        ),
        "random_forest": Pipeline(
            steps=[
                ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
                ("model", RandomForestClassifier(n_estimators=250, random_state=42)),
            ]
        ),
    }


def train_and_select_best(df: pd.DataFrame):
    X = df["symptoms"]
    y = df["disease"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    models = build_models()
    best_name = None
    best_model = None
    best_accuracy = -1.0
    metrics = {}

    for name, pipeline in models.items():
        pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_test)
        accuracy = accuracy_score(y_test, preds)
        report = classification_report(y_test, preds, output_dict=True, zero_division=0)
        metrics[name] = {
            "accuracy": round(float(accuracy), 4),
            "macro_avg_f1": round(float(report["macro avg"]["f1-score"]), 4),
        }

        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_name = name
            best_model = pipeline

    return best_name, best_model, metrics


def save_artifacts(best_name, best_model, metrics):
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(best_model, f)

    payload = {
        "best_model": best_name,
        "models": metrics,
        "dataset_path": str(DATA_PATH),
    }
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    return payload


def main():
    df = load_data()
    best_name, best_model, metrics = train_and_select_best(df)
    payload = save_artifacts(best_name, best_model, metrics)

    print("Training complete.")
    print(f"Best model: {payload['best_model']}")
    print("Model metrics:")
    for name, values in payload["models"].items():
        print(f"  - {name}: accuracy={values['accuracy']}, macro_f1={values['macro_avg_f1']}")
    print(f"Saved model to: {MODEL_PATH}")
    print(f"Saved metrics to: {METRICS_PATH}")


if __name__ == "__main__":
    main()
