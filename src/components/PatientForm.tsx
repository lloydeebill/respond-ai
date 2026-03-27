import { PatientProfile } from "@/types";

interface PatientFormProps {
  patient: PatientProfile;
  onChange: (patient: PatientProfile) => void;
}

const conditions = ["Asthma", "COPD", "Diabetes", "Hypertension", "Heart Disease", "None"];

const PatientForm = ({ patient, onChange }: PatientFormProps) => {
  const update = (key: keyof PatientProfile, value: string | string[]) =>
    onChange({ ...patient, [key]: value });

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Patient Profile <span className="text-muted-foreground font-normal">(Optional)</span></h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name</label>
          <input
            value={patient.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Patient name"
            className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Age</label>
          <input
            type="number"
            value={patient.age}
            onChange={(e) => update("age", e.target.value)}
            placeholder="Age"
            className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Gender</label>
          <select
            value={patient.gender}
            onChange={(e) => update("gender", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Smoking Status</label>
          <select
            value={patient.smokingStatus}
            onChange={(e) => update("smokingStatus", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">Select</option>
            <option value="never">Never</option>
            <option value="former">Former</option>
            <option value="current">Current</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Existing Conditions</label>
        <div className="flex flex-wrap gap-2">
          {conditions.map((c) => {
            const active = patient.existingConditions.includes(c);
            return (
              <button
                key={c}
                onClick={() => {
                  const updated = active
                    ? patient.existingConditions.filter((x) => x !== c)
                    : [...patient.existingConditions, c];
                  update("existingConditions", updated);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-muted/50 text-muted-foreground border border-border hover:border-primary/30"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PatientForm;
