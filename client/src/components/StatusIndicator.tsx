import { Badge } from "@/components/ui/badge";

interface StatusIndicatorProps {
  status: "operational" | "standby" | "fault" | "maintenance";
  label: string;
  onClick?: () => void;
}

export default function StatusIndicator({ status, label, onClick }: StatusIndicatorProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "operational":
        return {
          dot: "bg-industrial-operational shadow-[0_0_8px_rgba(34,197,94,0.6)]",
          badge: "text-industrial-operational border-industrial-operational",
          animation: "animate-pulse"
        };
      case "standby":
        return {
          dot: "bg-industrial-warning shadow-[0_0_8px_rgba(245,158,11,0.6)]",
          badge: "text-industrial-warning border-industrial-warning",
          animation: ""
        };
      case "fault":
        return {
          dot: "bg-industrial-critical shadow-[0_0_8px_rgba(239,68,68,0.6)]",
          badge: "text-industrial-critical border-industrial-critical",
          animation: "animate-pulse"
        };
      case "maintenance":
        return {
          dot: "bg-muted-foreground",
          badge: "text-muted-foreground border-muted-foreground",
          animation: ""
        };
    }
  };

  const styles = getStatusStyles();

  const handleClick = () => {
    if (onClick) {
      console.log(`Status indicator clicked: ${status} - ${label}`);
      onClick();
    }
  };

  return (
    <div 
      className={`flex items-center gap-3 ${onClick ? 'cursor-pointer hover-elevate p-2 rounded-md' : ''}`}
      onClick={handleClick}
      data-testid={`status-indicator-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="relative">
        <div 
          className={`h-3 w-3 rounded-full ${styles.dot} ${styles.animation}`}
          data-testid={`dot-${status}`}
        />
        {status === "operational" && (
          <div className="absolute inset-0 h-3 w-3 rounded-full bg-industrial-operational opacity-75 animate-ping" />
        )}
      </div>
      <Badge variant="outline" className={`${styles.badge} text-xs`}>
        {label}
      </Badge>
    </div>
  );
}