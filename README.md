🚀 Getting StartedTo run RESPOND locally, you need to have two separate processes running: the FastAPI Backend and the React Frontend.1. Backend Setup (The "Brain")The backend handles audio processing via FFmpeg and AI inference.Bash# Navigate to the project root
cd response-ai

# Activate the Python virtual environment
cough_python\Scripts\activate

# Navigate to the library directory
cd src/lib

# Start the FastAPI server
uvicorn main:app --reload --port 8000
Note: Ensure FFmpeg is installed on your system path for audio standardization to work correctly.2. Frontend Setup (The "Face")The frontend provides the user interface for recording and analysis.Bash# Open a NEW terminal and navigate to the project root
cd response-ai

# Install dependencies (only needed once)
npm install

# Start the Vite development server
npm run dev
The app should now be running at http://localhost:8080 (or the port specified in your terminal).🛠️ Technical SpecificationsComponentTechnologyFrontendReact, Vite, Tailwind CSS, Framer MotionBackendFastAPI (Python)Audio ProcessingFFmpeg, Librosa, PyDubAI Model2D Convolutional Neural Network (CoughCNN)Environmentcough_python (Venv)🧪 Model Filters & FeaturesDuring the Convolutional process, our filters learn to identify specific respiratory textures:Sharp Spikes: Represent dry cough bursts.Low-frequency Energy: Indicates deep chest coughs (common in Pneumonia).Repetitive Patterns: Associated with wheezing or Bronchitis.High-frequency Noise: Detects mucus or "crackles" in the lungs.