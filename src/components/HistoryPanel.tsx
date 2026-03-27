import { motion } from "framer-motion";
import { Clock, ChevronRight, Trash2 } from "lucide-react";
import { AnalysisRecord } from "@/types";
import { getHistory } from "@/lib/analysis";
import { useState, useEffect } from "react";

interface HistoryPanelProps {
  onSelect: (record: AnalysisRecord) => void;
}

const riskColors = {
  High: "text-destructive bg-destructive/10",
  Moderate: "text-warning bg-warning/10",
  Low: "text-success bg-success/10",
};

const HistoryPanel = ({ onSelect }: HistoryPanelProps) => {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("coughsense_history");
    setHistory([]);
  };

  if (history.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">No analysis history yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Your past analyses will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Analysis History</h3>
        <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      {history.map((record, idx) => (
        <motion.button
          key={record.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onSelect(record)}
          className="w-full glass-card-hover p-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{record.topCondition}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(record.timestamp).toLocaleString()} • {record.fileName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${riskColors[record.riskLevel]}`}>
              {record.riskLevel}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default HistoryPanel;
