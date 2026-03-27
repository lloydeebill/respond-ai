import { FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { AnalysisRecord } from "@/types";
import jsPDF from "jspdf";

interface ReportGeneratorProps {
  record: AnalysisRecord;
}

const ReportGenerator = ({ record }: ReportGeneratorProps) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFillColor(10, 31, 68);
    doc.rect(0, 0, w, 45, "F");
    doc.setTextColor(0, 207, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Respond AI", 20, y + 5);
    doc.setFontSize(10);
    doc.setTextColor(180, 200, 220);
    doc.text("Respiratory Disease Screening Report", 20, y + 14);
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y + 22);

    y = 55;

    // Patient info
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Information", 20, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const patient = record.patient;
    const info = [
      ["Name", patient?.name || "Not provided"],
      ["Age", patient?.age || "N/A"],
      ["Gender", patient?.gender || "N/A"],
      ["Smoking Status", patient?.smokingStatus || "N/A"],
      ["Existing Conditions", patient?.existingConditions?.join(", ") || "None"],
    ];
    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 70, y);
      y += 6;
    });

    y += 5;

    // Analysis info
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Analysis Details", 20, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Audio File: ${record.fileName}`, 20, y); y += 6;
    doc.text(`Analysis Date: ${new Date(record.timestamp).toLocaleString()}`, 20, y); y += 6;
    doc.text(`AI Confidence: ${record.confidence}%`, 20, y); y += 6;
    doc.text(`Risk Level: ${record.riskLevel}`, 20, y); y += 6;
    if (record.adjusted) {
      doc.text("Note: Prediction adjusted based on patient profile data", 20, y); y += 6;
    }

    y += 5;

    // Results
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Prediction Results", 20, y);
    y += 10;

    const sorted = Object.entries(record.predictions).sort((a, b) => b[1] - a[1]);

    sorted.forEach(([label, value], idx) => {
      const pct = Math.round(value * 100);
      const isTop = idx === 0;

      if (isTop) {
        doc.setFillColor(0, 207, 255);
        doc.roundedRect(18, y - 5, w - 36, 14, 2, 2, "F");
        doc.setTextColor(10, 31, 68);
      } else {
        doc.setTextColor(40, 40, 40);
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", isTop ? "bold" : "normal");
      doc.text(`#${idx + 1}  ${label}`, 24, y + 3);
      doc.text(`${pct}%`, w - 40, y + 3);

      if (!isTop) {
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(24, y + 6, w - 60, 3, 1, 1, "F");
        doc.setFillColor(0, 207, 255);
        doc.roundedRect(24, y + 6, (w - 60) * (pct / 100), 3, 1, 1, "F");
      }

      y += isTop ? 18 : 16;
    });

    y += 10;

    // Disclaimer
    doc.setFillColor(255, 245, 230);
    doc.roundedRect(18, y - 3, w - 36, 20, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(180, 120, 0);
    doc.setFont("helvetica", "bold");
    doc.text("DISCLAIMER", 24, y + 3);
    doc.setFont("helvetica", "normal");
    doc.text(
      "This result is AI-generated and not a confirmed medical diagnosis. Please consult a healthcare",
      24, y + 9
    );
    doc.text("professional for proper evaluation and treatment.", 24, y + 13);

    doc.save(`Respond_Report_${record.id.slice(0, 8)}.pdf`);
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Generate Report</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Download a comprehensive PDF report with all analysis details
        </p>
      </div>

      <div className="glass-card p-4 space-y-2 text-xs text-muted-foreground">
        <p><span className="text-foreground font-medium">Patient:</span> {record.patient?.name || "Anonymous"}</p>
        <p><span className="text-foreground font-medium">File:</span> {record.fileName}</p>
        <p><span className="text-foreground font-medium">Top Result:</span> {record.topCondition} ({Math.round(record.predictions[record.topCondition as keyof typeof record.predictions] * 100)}%)</p>
        <p><span className="text-foreground font-medium">Risk:</span> {record.riskLevel}</p>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={generatePDF}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-shadow"
      >
        <FileDown className="w-4 h-4" />
        Download PDF Report
      </motion.button>
    </div>
  );
};

export default ReportGenerator;
