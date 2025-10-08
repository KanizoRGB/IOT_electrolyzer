import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, Info, X } from "lucide-react";
import { useState } from "react";

interface AlertBannerProps {
  type: "warning" | "error" | "info";
  title: string;
  message: string;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function AlertBanner({ type, title, message, dismissible = true, action }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const getAlertStyles = () => {
    switch (type) {
      case "warning":
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          className: "border-industrial-warning bg-industrial-warning/10 text-industrial-warning"
        };
      case "error":
        return {
          icon: <XCircle className="h-4 w-4" />,
          className: "border-industrial-critical bg-industrial-critical/10 text-industrial-critical"
        };
      case "info":
        return {
          icon: <Info className="h-4 w-4" />,
          className: "border-primary bg-primary/10 text-primary"
        };
    }
  };

  const { icon, className } = getAlertStyles();

  const handleDismiss = () => {
    console.log(`Alert dismissed: ${type} - ${title}`);
    setDismissed(true);
  };

  const handleAction = () => {
    if (action) {
      console.log(`Alert action triggered: ${action.label}`);
      action.onClick();
    }
  };

  return (
    <Alert className={className} data-testid={`alert-${type}`}>
      {icon}
      <div className="flex-1">
        <AlertTitle className="text-sm font-semibold">{title}</AlertTitle>
        <AlertDescription className="text-sm">{message}</AlertDescription>
      </div>
      <div className="flex items-center gap-2">
        {action && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAction}
            data-testid={`button-alert-action`}
          >
            {action.label}
          </Button>
        )}
        {dismissible && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={handleDismiss}
            data-testid={`button-dismiss-alert`}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
}