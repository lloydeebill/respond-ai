import { useCallback, useRef, useState } from "react";
import { Upload, FileAudio, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AudioUploaderProps {
  // 🔥 UPDATED: Added the optional Blob/File parameter so it matches MicRecorder
  onAudioLoaded: (buffer: AudioBuffer, fileName: string, file?: File) => void;
  onAnalyze: () => void;
  isProcessing: boolean;
}

const AudioUploader = ({ onAudioLoaded, onAnalyze, isProcessing }: AudioUploaderProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.name.match(/\.(wav|mp3)$/i)) {
      setError("Invalid format. Please upload .wav or .mp3 files only.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum 50MB allowed.");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setFileName(file.name);
      
      // 🔥 THE CRITICAL FIX: Pass the actual 'file' object up to Index.tsx!
      onAudioLoaded(audioBuffer, file.name, file);
      
    } catch {
      setError("Failed to decode audio file. Please try another file.");
    }
  }, [onAudioLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`glass-card-hover cursor-pointer p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
          dragOver ? "border-primary/60 bg-primary/5" : ""
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".wav,.mp3"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
        />
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Upload className="w-7 h-7 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-foreground font-medium">Drop cough audio here</p>
          <p className="text-sm text-muted-foreground mt-1">
            Supports .wav and .mp3 files up to 50MB
          </p>
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File loaded */}
      <AnimatePresence>
        {fileName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <FileAudio className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{fileName}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFileName(null);
                // Also clear it out of the parent component's state just to be safe
                onAudioLoaded({} as AudioBuffer, "", undefined);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyze button */}
      {fileName && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onAnalyze}
          disabled={isProcessing}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            "Analyze Cough Audio"
          )}
        </motion.button>
      )}
    </div>
  );
};

export default AudioUploader;