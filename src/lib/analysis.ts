import { PredictionResult, AnalysisRecord, PatientProfile } from "@/types";

export function mockPredict(): PredictionResult {
  const raw = {
    Asthma: Math.random() * 0.5 + 0.1,
    COPD: Math.random() * 0.4 + 0.05,
    Pneumonia: Math.random() * 0.45 + 0.05,
    Bronchitis: Math.random() * 0.35 + 0.05,
    Healthy: Math.random() * 0.3 + 0.05,
  };
  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  return {
    Asthma: +(raw.Asthma / total).toFixed(4),
    COPD: +(raw.COPD / total).toFixed(4),
    Pneumonia: +(raw.Pneumonia / total).toFixed(4),
    Bronchitis: +(raw.Bronchitis / total).toFixed(4),
    Healthy: +(raw.Healthy / total).toFixed(4),
  };
}

export function getTopCondition(predictions: PredictionResult): string {
  return Object.entries(predictions).sort((a, b) => b[1] - a[1])[0][0];
}

export function getRiskLevel(predictions: PredictionResult): "High" | "Moderate" | "Low" {
  const top = Math.max(...Object.values(predictions));
  const healthy = predictions.Healthy;
  if (healthy > 0.5) return "Low";
  if (top > 0.4) return "High";
  if (top > 0.25) return "Moderate";
  return "Low";
}

export function getConfidence(predictions: PredictionResult): number {
  const values = Object.values(predictions).sort((a, b) => b - a);
  const margin = values[0] - values[1];
  return Math.min(95, Math.round(60 + margin * 100));
}

export function createRecord(
  fileName: string,
  predictions: PredictionResult,
  patient?: PatientProfile
): AnalysisRecord {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    fileName,
    predictions,
    topCondition: getTopCondition(predictions),
    riskLevel: getRiskLevel(predictions),
    confidence: getConfidence(predictions),
    patient,
    adjusted: !!patient?.age,
  };
}

export function saveRecord(record: AnalysisRecord) {
  const history = getHistory();
  history.unshift(record);
  localStorage.setItem("coughsense_history", JSON.stringify(history.slice(0, 50)));
}

export function getHistory(): AnalysisRecord[] {
  try {
    return JSON.parse(localStorage.getItem("coughsense_history") || "[]");
  } catch {
    return [];
  }
}
