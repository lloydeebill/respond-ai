import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { useState } from "react";

interface ProbabilityBarProps {
  label: string;
  value: number;
  rank: number;
  isTop: boolean;
  delay: number;
}

const conditionColors: Record<string, string> = {
  Asthma: "hsl(192, 100%, 50%)",
  COPD: "hsl(280, 70%, 55%)",
  Pneumonia: "hsl(0, 72%, 51%)",
  Bronchitis: "hsl(45, 93%, 47%)",
  Healthy: "hsl(142, 71%, 45%)",
};

const conditionDescriptions: Record<string, string> = {
  Asthma: "Characterized by wheezing and high-frequency cough patterns",
  COPD: "Chronic cough with low-frequency spectral signatures",
  Pneumonia: "Wet cough patterns with specific frequency distributions",
  Bronchitis: "Persistent dry cough with mid-range spectral features",
  Healthy: "Normal cough patterns without disease indicators",
};

const ProbabilityBar = ({ label, value, rank, isTop, delay }: ProbabilityBarProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const percentage = Math.round(value * 100);
  const color = conditionColors[label] || "hsl(192, 100%, 50%)";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay, duration: 0.4 }}
      className={`p-3 rounded-lg transition-all ${isTop ? "bg-primary/5 border border-primary/20" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground w-4">#{rank}</span>
          <span className={`text-sm font-medium ${isTop ? "text-primary glow-text" : "text-foreground"}`}>
            {label}
          </span>
          {isTop && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold"
            >
              TOP MATCH
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-semibold" style={{ color }}>
            {percentage}%
          </span>
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="relative text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            {showTooltip && (
              <div className="absolute right-0 top-6 z-50 w-56 p-3 rounded-lg bg-card border border-border shadow-xl text-xs text-muted-foreground">
                {conditionDescriptions[label]}
              </div>
            )}
          </button>
        </div>
      </div>
      <div className="probability-bar">
        <motion.div
          className="probability-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: "easeOut" }}
          style={{ backgroundColor: color, color }}
        />
      </div>
    </motion.div>
  );
};

export default ProbabilityBar;
