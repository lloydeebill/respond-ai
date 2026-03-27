import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AppSidebar from "@/components/AppSidebar";
import FloatingWaves from "@/components/FloatingWaves";
import AudioUploader from "@/components/AudioUploader";
import LoadingOverlay from "@/components/LoadingOverlay";
import MicRecorder from "@/components/MicRecorder";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import SpectrogramViewer from "@/components/SpectrogramViewer";
import PatientForm from "@/components/PatientForm";
import ResultsDashboard from "@/components/ResultsDashboard";
import HistoryPanel from "@/components/HistoryPanel";
import ReportGenerator from "@/components/ReportGenerator";
import { ViewMode, PatientProfile, AnalysisRecord } from "@/types";
import { createRecord, saveRecord } from "@/lib/analysis";
import { analyzeAudioWithAI } from "@/lib/api";

const emptyPatient: PatientProfile = {
  name: "",
  age: "",
  gender: "",
  smokingStatus: "",
  existingConditions: [],
};

const Index = () => {
  const [activeView, setActiveView] = useState<ViewMode>("upload");
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [fileName, setFileName] = useState("");
  const [patient, setPatient] = useState<PatientProfile>(emptyPatient);
  const [currentRecord, setCurrentRecord] = useState<AnalysisRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 🔥 NEW: Store the actual file blob to send to the backend
  const [audioFileBlob, setAudioFileBlob] = useState<Blob | null>(null);

  // 🔥 UPDATED: Added the optional blob parameter
  const handleAudioLoaded = useCallback((buffer: AudioBuffer, name: string, blob?: Blob) => {
    setAudioBuffer(buffer);
    setFileName(name);
    if (blob) {
      setAudioFileBlob(blob);
    }
  }, []);

  const handleAnalyserReady = useCallback((analyser: AnalyserNode | null) => {
    setAnalyserNode(analyser);
    setIsRecording(!!analyser);
  }, []);

  const handleAnalyze = useCallback(async () => {
    // Prevent analysis if there is no audio file
    if (!audioFileBlob) {
      console.error("No audio file available for analysis.");
      alert("Please record or upload an audio file first.");
      return;
    }

    setIsProcessing(true);

    try {
      // Map frontend patient state to backend PatientMetadata format safely
      let smoking_status: boolean | undefined = undefined;
      if (patient.smokingStatus === "Yes") smoking_status = true;
      if (patient.smokingStatus === "No") smoking_status = false;

      // 🔥 UPDATED: Pass the real audioFileBlob instead of new Blob()
      const { predictions } = await analyzeAudioWithAI(audioFileBlob, {
        age: patient.age ? Number(patient.age) : undefined,
        gender: patient.gender,
        smoking_status: smoking_status,
      });

      const record = createRecord(fileName, predictions, patient.age ? patient : undefined);
      saveRecord(record);
      setCurrentRecord(record);
      setActiveView("dashboard");
    } catch (err) {
      console.error("Analysis failed:", err);
      alert("Failed to analyze the audio. Check the console for details.");
    } finally {
      setIsProcessing(false);
    }
  }, [fileName, patient, audioFileBlob]); // Added audioFileBlob to dependencies

  const handleHistorySelect = useCallback((record: AnalysisRecord) => {
    setCurrentRecord(record);
    setActiveView("dashboard");
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case "upload":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Upload Audio</h2>
              <p className="text-sm text-muted-foreground mt-1">Upload a cough audio sample for AI analysis</p>
            </div>
            <AudioUploader
              onAudioLoaded={handleAudioLoaded}
              onAnalyze={handleAnalyze}
              isProcessing={isProcessing}
            />
            <div className="grid grid-cols-2 gap-4">
              <WaveformVisualizer audioBuffer={audioBuffer} />
              <SpectrogramViewer audioBuffer={audioBuffer} />
            </div>
            <PatientForm patient={patient} onChange={setPatient} />
          </div>
        );
      case "record":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Record Audio</h2>
              <p className="text-sm text-muted-foreground mt-1">Record your cough directly using your microphone</p>
            </div>
            <MicRecorder
              onAudioLoaded={handleAudioLoaded}
              onAnalyserReady={handleAnalyserReady}
              onAnalyze={handleAnalyze}
              isProcessing={isProcessing}
            />
            <div className="grid grid-cols-2 gap-4">
              <WaveformVisualizer audioBuffer={audioBuffer} isRecording={isRecording} analyserNode={analyserNode} />
              <SpectrogramViewer audioBuffer={audioBuffer} />
            </div>
            <PatientForm patient={patient} onChange={setPatient} />
          </div>
        );
      case "dashboard":
        return currentRecord ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Analysis Results</h2>
              <p className="text-sm text-muted-foreground mt-1">
                AI prediction for <span className="text-primary">{currentRecord.fileName}</span>
              </p>
            </div>
            <ResultsDashboard record={currentRecord} />
          </div>
        ) : null;
      case "history":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">History</h2>
              <p className="text-sm text-muted-foreground mt-1">View your past analyses</p>
            </div>
            <HistoryPanel onSelect={handleHistorySelect} />
          </div>
        );
      case "reports":
        return currentRecord ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Reports</h2>
              <p className="text-sm text-muted-foreground mt-1">Generate and download screening reports</p>
            </div>
            <ReportGenerator record={currentRecord} />
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <FloatingWaves />
      <AppSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        hasResults={!!currentRecord}
      />
      <main className="flex-1 overflow-y-auto relative z-10 scrollbar-thin">
        <div className="max-w-4xl mx-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <AnimatePresence>
        {isProcessing && <LoadingOverlay />}
      </AnimatePresence>
    </div>
  );
};

export default Index;