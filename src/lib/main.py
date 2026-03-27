import io
import os
import tempfile
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from contextlib import asynccontextmanager
from pydub import AudioSegment
import librosa

# -----------------------------------
# Configuration (Dynamic Paths)
# -----------------------------------
# Get the directory where main.py lives (src/lib)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# Build absolute paths to the models folder right next to main.py
MODEL_PATH = os.path.join(CURRENT_DIR, "models", "best_cough_cnn.pth")
LABELS_PATH = os.path.join(CURRENT_DIR, "models", "label_classes.npy")

SAMPLE_RATE = 16000
DURATION = 6
N_MELS = 128
N_FFT = 1024
HOP_LENGTH = 512

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# ... (Keep the rest of your main.py from the class CoughCNN down exactly the same)
# -----------------------------------
# Accurate Model Architecture
# -----------------------------------
class CoughCNN(nn.Module):
    def __init__(self, num_classes):
        super(CoughCNN, self).__init__()

        self.features = nn.Sequential(
            nn.Conv2d(1, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((4, 4))
        )

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

# -----------------------------------
# Accurate Preprocessing Logic
# -----------------------------------
def pad_or_trim(y, sr=SAMPLE_RATE, duration=DURATION):
    target_len = sr * duration
    if len(y) < target_len:
        y = np.pad(y, (0, target_len - len(y)))
    else:
        y = y[:target_len]
    return y

def preprocess_audio(audio_bytes: bytes):
    if not audio_bytes or len(audio_bytes) == 0:
        raise ValueError("Received empty audio data.")

    audio_buffer = io.BytesIO(audio_bytes)

    try:
        # 1. Decode WebM/MP3 to standard 16kHz Mono WAV using PyDub
        audio = AudioSegment.from_file(audio_buffer)
        audio = audio.set_frame_rate(SAMPLE_RATE).set_channels(1)
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
            audio.export(tmp_wav.name, format="wav")
            tmp_path = tmp_wav.name
            
        try:
            # 2. Apply EXACT trained Librosa logic
            y, sr = librosa.load(tmp_path, sr=SAMPLE_RATE)
            y = pad_or_trim(y, sr=sr, duration=DURATION)

            mel = librosa.feature.melspectrogram(
                y=y,
                sr=sr,
                n_fft=N_FFT,
                hop_length=HOP_LENGTH,
                n_mels=N_MELS
            )

            mel_db = librosa.power_to_db(mel, ref=np.max)
            mel_min = mel_db.min()
            mel_max = mel_db.max()
            
            # Exact normalization from trained code
            mel_norm = (mel_db - mel_min) / (mel_max - mel_min + 1e-8)

            tensor = torch.tensor(mel_norm, dtype=torch.float32).unsqueeze(0).unsqueeze(0)
            return tensor
            
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
    except Exception as e:
        print(f"PREPROCESS ERROR: {e}")
        raise ValueError(f"Could not decode or process audio: {e}")

# -----------------------------------
# FastAPI Setup
# -----------------------------------
model_container = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Load labels dynamically from the .npy file
    try:
        class_names = np.load(LABELS_PATH, allow_pickle=True)
        model_container["class_names"] = [str(c) for c in class_names]
        num_classes = len(class_names)
        print(f"Loaded {num_classes} classes: {model_container['class_names']}")
    except Exception as e:
        print(f"CRITICAL: Could not load labels from {LABELS_PATH}. Error: {e}")
        # Fallback just in case
        model_container["class_names"] = ["Asthma", "COPD", "Pneumonia", "Bronchitis", "Healthy"]
        num_classes = 5

    # 2. Load the actual trained model weights
    try:
        model = CoughCNN(num_classes=num_classes).to(DEVICE)
        model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        model.eval()
        model_container["model"] = model
        print("Model weights loaded successfully.")
    except Exception as e:
        print(f"CRITICAL: Could not load model weights from {MODEL_PATH}. Error: {e}")
        model_container["model"] = None

    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# -----------------------------------
# Endpoints
# -----------------------------------
@app.post("/validate")
async def validate_audio(file: UploadFile = File(...)):
    try:
        audio_data = await file.read()
        preprocess_audio(audio_data)
        return {"isValidCough": True}
    except Exception as e:
        print(f"VALIDATION ERROR: {e}")
        return {"isValidCough": False}

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    age: Optional[str] = Form(None), 
    gender: Optional[str] = Form(None),
    smoking_status: Optional[str] = Form(None)
):
    model = model_container.get("model")
    class_names = model_container.get("class_names")

    if not model:
        raise HTTPException(status_code=503, detail="Model weights not loaded correctly. Check backend console.")

    try:
        audio_data = await file.read()
        print(f"DEBUG: Received {file.filename}, size: {len(audio_data)} bytes")

        if len(audio_data) == 0:
            raise HTTPException(status_code=400, detail="Frontend sent an empty file.")

        input_tensor = preprocess_audio(audio_data).to(DEVICE)
        
        with torch.no_grad():
            outputs = model(input_tensor)
            # Exact probability logic from trained code
            probs = torch.softmax(outputs, dim=1).cpu().numpy()[0]
            
            pred_idx = int(np.argmax(probs))
            pred_label = class_names[pred_idx]

        # Map probabilities back to class names for the JSON response
        prob_dict = {label: float(round(p, 4)) for label, p in zip(class_names, probs)}

        return {
            "probabilities": prob_dict,
            "predicted_label": pred_label
        }
        
    except ValueError as ve:
        print(f"API VALUE ERROR: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"API ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))