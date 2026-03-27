import { motion } from "framer-motion";
import { Activity } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
  subMessage?: string;
}

const LoadingOverlay = ({
  message = "Analyzing Audio",
  subMessage = "Processing cough patterns and spectral features...",
}: LoadingOverlayProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
  >
    <motion.div
      className="glass-card p-8 flex flex-col items-center gap-4"
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary flex items-center justify-center"
      >
        <Activity className="w-6 h-6 text-primary animate-pulse-glow" />
      </motion.div>
      <div className="text-center">
        <p className="text-foreground font-semibold">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">{subMessage}</p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-6 rounded-full bg-primary/40"
            animate={{ scaleY: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  </motion.div>
);

export default LoadingOverlay;
