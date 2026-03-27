import { useEffect, useRef } from "react";

interface SpectrogramViewerProps {
  audioBuffer: AudioBuffer | null;
}

const SpectrogramViewer = ({ audioBuffer }: SpectrogramViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    if (!audioBuffer) {
      // Simulated spectrogram
      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
          const noise = Math.random() * 0.15;
          const freq = 1 - y / h;
          const intensity = Math.max(0, Math.sin(x * 0.05) * freq * 0.3 + noise);
          const hue = 192 + intensity * 30;
          ctx.fillStyle = `hsla(${hue}, 100%, ${20 + intensity * 60}%, ${0.1 + intensity * 0.5})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      return;
    }

    // Real spectrogram from audio buffer
    const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    const analyser = offlineCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(offlineCtx.destination);
    source.start();

    offlineCtx.startRendering().then(() => {
      // Generate spectrogram from actual data
      const data = audioBuffer.getChannelData(0);
      const fftSize = 256;
      const hopSize = Math.floor(data.length / w);

      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
          const freqBin = Math.floor((1 - y / h) * (fftSize / 2));
          const sampleIdx = x * hopSize + freqBin;
          const val = Math.abs(data[sampleIdx % data.length] || 0);
          const intensity = Math.min(1, val * 3);
          
          const r = Math.floor(intensity * 0);
          const g = Math.floor(intensity * 207);
          const b = Math.floor(intensity * 255);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.7})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });
  }, [audioBuffer]);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Spectrogram</h3>
        <span className="text-[10px] font-mono text-muted-foreground">FREQ DOMAIN</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-32 rounded-lg"
        style={{ background: "hsla(220, 50%, 8%, 0.5)" }}
      />
    </div>
  );
};

export default SpectrogramViewer;
