export interface PredictionResult {
  Asthma: number;
  COPD: number;
  Pneumonia: number;
  Bronchitis: number;
  Healthy: number;
}

export interface PatientProfile {
  name: string;
  age: string;
  gender: string;
  smokingStatus: string;
  existingConditions: string[];
}

export interface AnalysisRecord {
  id: string;
  timestamp: string;
  fileName: string;
  predictions: PredictionResult;
  topCondition: string;
  riskLevel: "High" | "Moderate" | "Low";
  confidence: number;
  patient?: PatientProfile;
  adjusted: boolean;
}

export type ViewMode = "upload" | "record" | "dashboard" | "history" | "reports";
