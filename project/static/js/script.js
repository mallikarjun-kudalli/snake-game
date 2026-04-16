const form = document.getElementById("predict-form");
const symptomsInput = document.getElementById("symptoms");
const loader = document.getElementById("loader");
const resultBox = document.getElementById("result");
const errorBox = document.getElementById("error-box");
const charCount = document.getElementById("char-count");
const clearBtn = document.getElementById("clear-btn");
const copyBtn = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");
const voiceBtn = document.getElementById("voice-btn");
const sampleCase = document.getElementById("sample-case");
const applySampleBtn = document.getElementById("apply-sample");
const clearHistoryBtn = document.getElementById("clear-history");
const historyList = document.getElementById("history-list");
const themeSelect = document.getElementById("theme-select");
const symptomChips = document.querySelectorAll(".chip");

const diseaseEl = document.getElementById("disease");
const confidenceEl = document.getElementById("confidence");
const confidenceBar = document.getElementById("confidence-bar");
const severityEl = document.getElementById("severity");
const adviceEl = document.getElementById("advice");
const riskPill = document.getElementById("risk-pill");
const top3List = document.getElementById("top3-list");

const STORAGE_KEYS = {
  THEME: "medical_ai_theme",
  HISTORY: "medical_ai_history",
};

let lastResult = null;

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function hideResult() {
  resultBox.classList.add("hidden");
}

function updateCount() {
  charCount.textContent = `${symptomsInput.value.trim().length} chars`;
}

function setSeverityBadge(severity) {
  const normalized = (severity || "").toLowerCase();
  severityEl.className = "badge";
  riskPill.className = "risk-pill";

  if (normalized === "low") {
    severityEl.classList.add("low");
    riskPill.classList.add("low");
  }
  if (normalized === "medium") {
    severityEl.classList.add("medium");
    riskPill.classList.add("medium");
  }
  if (normalized === "high") {
    severityEl.classList.add("high");
    riskPill.classList.add("high");
  }
}

function addSymptomFromChip(value) {
  const current = symptomsInput.value.trim();
  if (!current) {
    symptomsInput.value = value;
  } else if (!current.toLowerCase().includes(value.toLowerCase())) {
    symptomsInput.value = `${current}, ${value}`;
  }
  updateCount();
  symptomsInput.focus();
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

function loadTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME) || "aurora";
  document.body.dataset.theme = saved;
  themeSelect.value = saved;
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || "[]");
  } catch (error) {
    return [];
  }
}

function saveHistory(list) {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(list));
}

function renderHistory() {
  const records = getHistory();
  historyList.innerHTML = "";

  if (!records.length) {
    historyList.innerHTML = "<li>No checks yet.</li>";
    return;
  }

  records.forEach((record) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${record.disease}</strong> (${record.confidence}%) - ${record.severity}<br><small>${record.time}</small>`;
    historyList.appendChild(item);
  });
}

function appendHistory(result) {
  const list = getHistory();
  const next = [
    {
      disease: result.disease,
      confidence: Number(result.confidence).toFixed(2),
      severity: result.severity,
      time: new Date().toLocaleString(),
    },
    ...list,
  ].slice(0, 6);
  saveHistory(next);
  renderHistory();
}

function renderTopPredictions(items = []) {
  top3List.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.disease}: ${Number(item.confidence).toFixed(2)}%`;
    top3List.appendChild(li);
  });
}

function buildResultText(result) {
  return [
    `Disease: ${result.disease}`,
    `Confidence: ${Number(result.confidence).toFixed(2)}%`,
    `Severity: ${result.severity}`,
    `Advice: ${result.advice}`,
    `Top predictions: ${(result.top_predictions || [])
      .map((item) => `${item.disease} (${Number(item.confidence).toFixed(2)}%)`)
      .join(", ")}`,
  ].join("\n");
}

function downloadResult(result) {
  const payload = {
    ...result,
    timestamp: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `medical-prediction-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function enableVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showError("Voice input is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  voiceBtn.textContent = "Listening...";
  voiceBtn.disabled = true;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const current = symptomsInput.value.trim();
    symptomsInput.value = current ? `${current}, ${transcript}` : transcript;
    updateCount();
  };

  recognition.onerror = () => {
    showError("Voice recognition failed. Please try again.");
  };

  recognition.onend = () => {
    voiceBtn.textContent = "Voice Input";
    voiceBtn.disabled = false;
  };

  recognition.start();
}

themeSelect.addEventListener("change", () => {
  document.body.dataset.theme = themeSelect.value;
  saveTheme(themeSelect.value);
});

symptomChips.forEach((chip) => {
  chip.addEventListener("click", () => addSymptomFromChip(chip.dataset.symptom));
});

applySampleBtn.addEventListener("click", () => {
  if (!sampleCase.value) {
    showError("Please select a sample case first.");
    return;
  }
  hideError();
  symptomsInput.value = sampleCase.value;
  updateCount();
});

voiceBtn.addEventListener("click", enableVoiceInput);

clearBtn.addEventListener("click", () => {
  symptomsInput.value = "";
  hideError();
  hideResult();
  updateCount();
  symptomsInput.focus();
});

copyBtn.addEventListener("click", async () => {
  if (!lastResult) {
    showError("Run a prediction first, then copy.");
    return;
  }
  hideError();
  try {
    await navigator.clipboard.writeText(buildResultText(lastResult));
    copyBtn.textContent = "Copied";
    setTimeout(() => {
      copyBtn.textContent = "Copy Result";
    }, 900);
  } catch (error) {
    showError("Clipboard access failed.");
  }
});

downloadBtn.addEventListener("click", () => {
  if (!lastResult) {
    showError("Run a prediction first, then download.");
    return;
  }
  hideError();
  downloadResult(lastResult);
});

clearHistoryBtn.addEventListener("click", () => {
  saveHistory([]);
  renderHistory();
});

symptomsInput.addEventListener("input", updateCount);
symptomsInput.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "Enter") {
    form.requestSubmit();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError();
  hideResult();

  const symptoms = symptomsInput.value.trim();
  if (!symptoms) {
    showError("Please enter symptoms first.");
    return;
  }

  loader.classList.remove("hidden");

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms }),
    });

    const data = await response.json();
    if (!response.ok) {
      showError(data.error || "Prediction failed.");
      return;
    }

    const confidence = Number(data.confidence).toFixed(2);
    diseaseEl.textContent = data.disease;
    confidenceEl.textContent = confidence;
    confidenceBar.style.width = `${Math.min(Math.max(Number(confidence), 0), 100)}%`;
    severityEl.textContent = data.severity;
    riskPill.textContent = `Risk: ${data.severity}`;
    adviceEl.textContent = data.advice;
    setSeverityBadge(data.severity);
    renderTopPredictions(data.top_predictions || []);

    lastResult = data;
    appendHistory(data);
    resultBox.classList.remove("hidden");
  } catch (error) {
    showError("Server error. Please try again.");
  } finally {
    loader.classList.add("hidden");
  }
});

loadTheme();
updateCount();
renderHistory();
