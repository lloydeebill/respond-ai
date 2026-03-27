import { useState, useRef, useCallback } from "react";
import { Mic, Square, AlertCircle, RotateCcw, Play, Pause, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MicRecorderProps {
  // 🔥 UPDATED: Now accepts the actual audio Blob as the third argument
  onAudioLoaded: (buffer: AudioBuffer, fileName: string, blob?: Blob) => void;
  onAnalyserReady: (analyser: AnalyserNode | null) => void;
  onAnalyze: () => void;
  isProcessing: boolean;
}

/**
 * Encode an AudioBuffer into a proper WAV Blob (PCM 16-bit).
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

type RecorderState = "idle" | "recording" | "review";

const MicRecorder = ({
  onAudioLoaded,
  onAnalyserReady,
  onAnalyze,
  isProcessing,
}: MicRecorderProps) => {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [wavBlob, setWavBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const cleanup = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setWavBlob(null);
    setIsPlaying(false);
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    setError(null);
    cleanup();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      onAnalyserReady(analyser);

      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (e) => chunks.current.push(e.data);

      recorder.onstop = async () => {
        const rawBlob = new Blob(chunks.current, { type: "audio/webm" });
        const ab = await rawBlob.arrayBuffer();
        const ctx = new AudioContext();

        try {
          const decodedBuffer = await ctx.decodeAudioData(ab);
          const generatedWavBlob = audioBufferToWav(decodedBuffer);
          const url = URL.createObjectURL(generatedWavBlob);

          setWavBlob(generatedWavBlob);
          setAudioUrl(url);
          
          // 🔥 THE CRITICAL FIX: Pass generatedWavBlob to the parent!
          onAudioLoaded(decodedBuffer, `recording_${Date.now()}.wav`, generatedWavBlob);
          
          setState("review");
        } catch {
          setError("Failed to process recording.");
          setState("idle");
        }

        onAnalyserReady(null);
      };

      recorder.start();
      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  }, [onAudioLoaded, onAnalyserReady, cleanup]);

  const stopRecording = useCallback(() => {
    mediaRecorder.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    clearInterval(timerRef.current);
  }, []);

  const handleRetake = useCallback(() => {
    cleanup();
    setState("idle");
  }, [cleanup]);

  const handleDownload = useCallback(() => {
    if (!wavBlob || !audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `recording_${Date.now()}.wav`;
    a.click();
  }, [wavBlob, audioUrl]);

  const togglePlayback = useCallback(() => {
    const el = audioElRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      el.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* ─── IDLE / RECORDING ─── */}
        {(state === "idle" || state === "recording") && (
          <motion.div
            key="rec"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-8 flex flex-col items-center gap-6"
          >
            <motion.button
              onClick={state === "recording" ? stopRecording : startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                state === "recording"
                  ? "bg-destructive/20 border-2 border-destructive shadow-lg shadow-destructive/20"
                  : "bg-primary/15 border-2 border-primary/40 hover:border-primary hover:shadow-lg hover:shadow-primary/20"
              }`}
              whileTap={{ scale: 0.95 }}
              animate={state === "recording" ? { scale: [1, 1.05, 1] } : {}}
              transition={state === "recording" ? { repeat: Infinity, duration: 1.5 } : {}}
            >
              {state === "recording" ? (
                <Square className="w-8 h-8 text-destructive" />
              ) : (
                <Mic className="w-8 h-8 text-primary" />
              )}
            </motion.button>

            {state === "recording" ? (
              <div className="text-center">
                <p className="text-lg font-mono text-destructive font-semibold">{formatTime(duration)}</p>
                <p className="text-sm text-muted-foreground mt-1">Recording… Tap to stop</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tap to start recording</p>
            )}
          </motion.div>
        )}

        {/* ─── REVIEW ─── */}
        {state === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-8 flex flex-col items-center gap-6"
          >
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Review Recording</p>

            {/* Playback controls */}
            {audioUrl && (
              <div className="w-full flex flex-col items-center gap-4">
                <audio
                  ref={audioElRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
                <motion.button
                  onClick={togglePlayback}
                  whileTap={{ scale: 0.93 }}
                  className="w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-primary" />
                  ) : (
                    <Play className="w-6 h-6 text-primary ml-0.5" />
                  )}
                </motion.button>
                <p className="text-xs text-muted-foreground">
                  {isPlaying ? "Playing…" : "Tap to listen"}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="w-full flex gap-3">
              <button
                onClick={handleRetake}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl border border-border text-muted-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent/10 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={handleDownload}
                disabled={isProcessing || !wavBlob}
                className="py-3 px-4 rounded-xl border border-primary/30 text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors disabled:opacity-50"
                title="Download .wav file"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onAnalyze}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Analyzing…
                  </span>
                ) : (
                  "Analyze Recording"
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};

export default MicRecorder;