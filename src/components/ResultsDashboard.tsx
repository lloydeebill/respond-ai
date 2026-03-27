import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, Brain } from "lucide-react";
import ProbabilityBar from "./ProbabilityBar";
import { AnalysisRecord } from "@/types";

interface ResultsDashboardProps {
  record: AnalysisRecord;
}

const riskConfig = {
  High: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: AlertTriangle, label: "High Risk" },
  Moderate: { color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", icon: Shield, label: "Moderate Risk" },
  Low: { color: "text-success", bg: "bg-success/10", border: "border-success/30", icon: CheckCircle, label: "Low Risk" },
} as const;

const formatCondition = (name: string) => {
  if (!name) return "";
  // Special case for COPD acronym
  if (name.toLowerCase() === "copd") return "COPD";
  // Capitalize first letter, lowercase the rest
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const calculateRiskLevel = (topCondition: string, predictions: Record<string, number>): "High" | "Moderate" | "Low" => {
  // If the top prediction is healthy, it is ALWAYS Low Risk
  if (topCondition.toLowerCase() === "healthy") {
    return "Low";
  }

  // Get the actual probability of the top predicted disease
  const topProb = predictions[topCondition] || 0;

  // Set ranges for risk (You can adjust these decimals as needed)
  if (topProb >= 0.70) {
    return "High";      // 70% or higher confidence in a disease
  } else if (topProb >= 0.40) {
    return "Moderate";  // 40% to 69% confidence in a disease
  } else {
    return "Low";       // Less than 40% confidence
  }
};

const ResultsDashboard = ({ record }: ResultsDashboardProps) => {
  const sorted = Object.entries(record.predictions).sort((a, b) => b[1] - a[1]);
  
  const dynamicRiskLevel = calculateRiskLevel(record.topCondition, record.predictions);
  const risk = riskConfig[dynamicRiskLevel];
  const RiskIcon = risk.icon;

  return (
    <div className="space-y-5">
      {/* Top row cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Top Prediction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 text-center"
        >
          <p className="text-xs text-muted-foreground mb-2">Top Prediction</p>
          {/* 🔥 UPDATED: Applied the formatter here */}
          <p className="text-2xl font-bold text-primary glow-text">
            {formatCondition(record.topCondition)}
          </p>
          <p className="text-sm font-mono text-primary/70 mt-1">
            {Math.round(record.predictions[record.topCondition as keyof typeof record.predictions] * 100)}%
          </p>
          {record.adjusted && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
              Adjusted Prediction
            </span>
          )}
        </motion.div>

        {/* Risk Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`glass-card p-5 text-center border ${risk.border}`}
        >
          <p className="text-xs text-muted-foreground mb-2">Risk Level</p>
          <RiskIcon className={`w-8 h-8 mx-auto ${risk.color}`} />
          <p className={`text-lg font-bold mt-2 ${risk.color}`}>{risk.label}</p>
        </motion.div>

        {/* Confidence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 text-center"
        >
          <p className="text-xs text-muted-foreground mb-2">AI Confidence</p>
          <div className="flex items-center justify-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{record.confidence}%</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            Based on cough frequency, intensity, and spectral patterns
          </p>
        </motion.div>
      </div>

      {/* Probability Bars */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Disease Probability Distribution</h3>
        <div className="space-y-2">
          {sorted.map(([label, value], idx) => (
            <ProbabilityBar
              key={label}
              // 🔥 UPDATED: Applied the formatter to the probability bars list
              label={formatCondition(label)}
              value={value}
              rank={idx + 1}
              isTop={idx === 0}
              delay={idx * 0.1}
            />
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-lg bg-warning/5 border border-warning/20 text-warning text-xs flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          This result is AI-generated and not a confirmed medical diagnosis. Please consult a healthcare professional for proper evaluation.
        </p>
      </div>
    </div>
  );
};

export default ResultsDashboard;