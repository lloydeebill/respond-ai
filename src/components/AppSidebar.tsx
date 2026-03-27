import { Upload, Mic, LayoutDashboard, Clock, FileText, Activity } from "lucide-react";
import { ViewMode } from "@/types";

interface AppSidebarProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  hasResults: boolean;
}

const navItems: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: "upload", label: "Upload Audio", icon: Upload },
  { id: "record", label: "Record Audio", icon: Mic },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "history", label: "History", icon: Clock },
  { id: "reports", label: "Reports", icon: FileText },
];

const AppSidebar = ({ activeView, onViewChange, hasResults }: AppSidebarProps) => {
  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-border">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground glow-text">CoughSense</h1>
            <p className="text-xs text-muted-foreground">AI Screening</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const isDisabled = (item.id === "dashboard" || item.id === "reports") && !hasResults;
          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onViewChange(item.id)}
              disabled={isDisabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/15 text-primary glow-border"
                  : isDisabled
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
          AI-assisted screening only.
          <br />
          Not a medical diagnosis.
        </p>
      </div>
    </aside>
  );
};

export default AppSidebar;
