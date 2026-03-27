import { useEffect, useRef } from "react";

const FloatingWaves = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.003;

      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `hsla(192, 100%, 50%, ${0.03 + i * 0.015})`;
        ctx.lineWidth = 1.5;

        for (let x = 0; x < canvas.width; x += 3) {
          const y =
            canvas.height * (0.3 + i * 0.1) +
            Math.sin(x * 0.003 + time + i * 0.8) * 40 +
            Math.sin(x * 0.007 + time * 1.5 + i) * 20 +
            Math.cos(x * 0.001 + time * 0.5) * 30;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

export default FloatingWaves;
