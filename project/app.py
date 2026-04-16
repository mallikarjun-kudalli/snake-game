import json
import os
import pickle
from pathlib import Path

from flask import Flask, jsonify, render_template, request


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "medical_model.pkl"
METRICS_PATH = BASE_DIR / "model" / "model_metrics.json"

app = Flask(__name__)


SEVERITY_ADVICE = {
    "Heart Attack": ("High", "Emergency: seek immediate medical care now."),
    "Meningitis": ("High", "Emergency: go to the nearest hospital immediately."),
    "Pneumonia": ("High", "Consult a doctor urgently for proper diagnosis and treatment."),
    "Appendicitis": ("High", "Emergency: get immediate medical evaluation."),
    "Tuberculosis": ("High", "Consult a doctor soon and get diagnostic tests."),
    "COVID-19": ("Medium", "Isolate, monitor symptoms, and consult a doctor if symptoms worsen."),
    "Diabetes": ("Medium", "Consult a doctor for blood sugar tests and long-term management."),
    "Urinary Tract Infection": ("Medium", "Consult a doctor for proper medication."),
    "Migraine": ("Medium", "Rest in a dark room; consult a doctor if severe or frequent."),
    "Asthma": ("Medium", "Use prescribed inhaler and consult a doctor if breathing worsens."),
    "Jaundice": ("Medium", "Consult a doctor for liver function assessment."),
    "Food Poisoning": ("Medium", "Hydrate well; consult a doctor if severe dehydration occurs."),
    "Flu": ("Low", "Rest, hydrate, and monitor fever. Consult a doctor if symptoms persist."),
    "Allergy": ("Low", "Avoid triggers and consider antihistamines after medical advice."),
    "Common Cold": ("Low", "Rest, drink fluids, and monitor symptoms."),
    "Arthritis": ("Low", "Plan a non-urgent consultation for long-term joint care."),
    "Depression": ("Medium", "Please consult a mental health professional for support."),
    "Anxiety": ("Medium", "Practice breathing exercises and consult a professional if persistent."),
}


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run: python model/train_model.py"
        )
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


def load_metrics():
    if not METRICS_PATH.exists():
        return {}
    with open(METRICS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


model = load_model()
model_metrics = load_metrics()


def normalize_text(text: str) -> str:
    return " ".join(text.strip().lower().split())


def enrich_prediction(disease: str, confidence: float):
    severity, advice = SEVERITY_ADVICE.get(
        disease, ("Medium", "Consult a healthcare professional for proper guidance.")
    )
    return {
        "disease": disease,
        "confidence": round(confidence * 100, 2),
        "severity": severity,
        "advice": advice,
    }


@app.route("/", methods=["GET"])
def home():
    best_model = model_metrics.get("best_model", "unknown")
    return render_template("index.html", best_model=best_model)


@app.route("/predict", methods=["POST"])
def predict():
    payload = request.get_json(silent=True) or {}
    symptoms = payload.get("symptoms", "")
    symptoms = normalize_text(symptoms)

    if not symptoms:
        return jsonify({"error": "Please enter symptoms before submitting."}), 400

    try:
        probabilities = model.predict_proba([symptoms])[0]
        classes = model.classes_
        best_idx = int(probabilities.argmax())
        disease = str(classes[best_idx])
        confidence = float(probabilities[best_idx])
        ranked = sorted(
            [
                {
                    "disease": str(classes[idx]),
                    "confidence": round(float(probabilities[idx]) * 100, 2),
                }
                for idx in range(len(classes))
            ],
            key=lambda item: item["confidence"],
            reverse=True,
        )

        result = enrich_prediction(disease, confidence)
        result["top_predictions"] = ranked[:3]
        result["normalized_input"] = symptoms
        return jsonify(result), 200
    except Exception as exc:
        return jsonify({"error": f"Prediction failed: {str(exc)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
