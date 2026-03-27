const API_BASE_URL = "http://localhost:8000";

export interface PredictionResult {
  Asthma: number;
  COPD: number;
  Pneumonia: number;
  Bronchitis: number;
  Healthy: number;
}

export interface AnalysisResponse {
  predictions: PredictionResult;
  predicted_label: string;
}

export interface PatientMetadata {
  age?: number | string;
  gender?: string;
  smoking_status?: boolean;
}

/**
 * Validates audio before the full analysis starts
 */
export async function validateAudio(audioBlob: Blob): Promise<boolean> {
  try {
    const formData = new FormData();
    const ext = getAudioExtension(audioBlob);
    
    // Use a standard key 'file' to match backend UploadFile
    formData.append("file", audioBlob, `check.${ext}`);

    const response = await fetch(`${API_BASE_URL}/validate`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data.isValidCough === true;
  } catch (error) {
    console.error("Validation Network Error:", error);
    return false;
  }
}

/**
 * Performs full AI prediction with robust metadata handling
 */
export async function analyzeAudioWithAI(
  audioBlob: Blob,
  metadata?: PatientMetadata
): Promise<AnalysisResponse> {
  const formData = new FormData();
  const ext = getAudioExtension(audioBlob);
  
  // 1. Attach Audio
  formData.append("file", audioBlob, `recording.${ext}`);

  // 2. Attach Metadata (ONLY if they have actual values)
  // This prevents sending empty strings that trigger 400/422 errors
  if (metadata) {
    if (metadata.age && metadata.age !== "") {
      formData.append("age", String(metadata.age));
    }
    if (metadata.gender && metadata.gender !== "Select") {
      formData.append("gender", metadata.gender);
    }
    if (metadata.smoking_status !== undefined) {
      formData.append("smoking_status", String(metadata.smoking_status));
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      body: formData,
    });

    // --- CRITICAL DEBUGGING LAYER ---
    if (!response.ok) {
      const errorDetail = await response.text();
      console.error("BACKEND REJECTED REQUEST:", errorDetail);
      throw new Error(`Server Error (${response.status}): ${errorDetail}`);
    }

    const data = await response.json();

    return {
      predictions: data.probabilities,
      predicted_label: data.predicted_label,
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

/**
 * Helper to download the audio blob (useful for Review State)
 */
export function downloadAudio(blob: Blob, filename: string = "cough_capture.wav") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Robust format detection
 */
function getAudioExtension(blob: Blob): string {
  const type = blob.type.toLowerCase();
  if (type.includes("webm")) return "webm";
  if (type.includes("wav") || type.includes("x-wav")) return "wav";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  return "webm"; // Default for most browser recorders
}