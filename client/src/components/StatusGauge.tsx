import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatusGaugeProps {
  title: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  icon: React.ReactNode;
  thresholds: {
    normal: [number, number];
    warning: [number, number];
    critical: [number, number];
  };
}

export default function StatusGauge({ title, value, min, max, unit, icon, thresholds }: StatusGaugeProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  const getStatus = () => {
    if (value >= thresholds.normal[0] && value <= thresholds.normal[1]) return "normal";
    if (value >= thresholds.warning[0] && value <= thresholds.warning[1]) return "warning";
    return "critical";
  };

  const getProgressColor = () => {
    const status = getStatus();
    switch (status) {
      case "normal": return "bg-industrial-operational";
      case "warning": return "bg-industrial-warning";
      case "critical": return "bg-industrial-critical";
    }
  };

  const getTextColor = () => {
    const status = getStatus();
    switch (status) {
      case "normal": return "text-industrial-operational";
      case "warning": return "text-industrial-warning";
      case "critical": return "text-industrial-critical";
    }
  };

  return (
    <Card className="hover-elevate" data-testid={`gauge-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-3xl font-mono font-bold ${getTextColor()}`} data-testid={`text-gauge-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">{unit}</div>
        </div>
        <div className="space-y-2">
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}