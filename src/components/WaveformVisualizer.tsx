import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  isRecording?: boolean;
  analyserNode?: AnalyserNode | null;
}

const WaveformVisualizer = ({ audioBuffer, isRecording, analyserNode }: WaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

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

    if (isRecording && analyserNode) {
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const drawLive = () => {
        analyserNode.getByteTimeDomainData(dataArray);
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "hsla(220, 50%, 12%, 0.3)";
        ctx.fillRect(0, 0, w, h);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "hsl(192, 100%, 50%)";
        ctx.shadowColor = "hsl(192, 100%, 50%)";
        ctx.shadowBlur = 10;
        ctx.beginPath();

        const sliceWidth = w / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        animRef.current = requestAnimationFrame(drawLive);
      };
      drawLive();
      return () => cancelAnimationFrame(animRef.current);
    }

    if (audioBuffer) {
      const data = audioBuffer.getChannelData(0);
      ctx.clearRect(0, 0, w, h);

      const step = Math.ceil(data.length / w);
      const amp = h / 2;

      // Draw gradient fill
      for (let i = 0; i < w; i++) {
        let min = 1.0, max = -1.0;
        for (let j = 0; j < step; j++) {
          const datum = data[i * step + j] || 0;
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }

        const gradient = ctx.createLinearGradient(0, amp + min * amp, 0, amp + max * amp);
        gradient.addColorStop(0, "hsla(192, 100%, 50%, 0.8)");
        gradient.addColorStop(0.5, "hsla(192, 100%, 50%, 0.3)");
        gradient.addColorStop(1, "hsla(192, 100%, 50%, 0.8)");

        ctx.fillStyle = gradient;
        ctx.fillRect(i, amp + min * amp, 1, (max - min) * amp);
      }

      // Center line
      ctx.strokeStyle = "hsla(192, 100%, 50%, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, amp);
      ctx.lineTo(w, amp);
      ctx.stroke();
    } else {
      // Idle animation
      let t = 0;
      const drawIdle = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = "hsla(192, 100%, 50%, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * 0.02 + t) * 8 + Math.sin(x * 0.01 + t * 0.7) * 5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        t += 0.02;
        animRef.current = requestAnimationFrame(drawIdle);
      };
      drawIdle();
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [audioBuffer, isRecording, analyserNode]);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Waveform Analysis</h3>
        <span className="text-[10px] font-mono text-muted-foreground">TIME DOMAIN</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-32 rounded-lg"
        style={{ background: "hsla(220, 50%, 8%, 0.5)" }}
      />
    </div>
  );
};

export default WaveformVisualizer;
