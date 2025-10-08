import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ParameterCardProps {
  title: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "normal" | "warning" | "critical";
  icon: React.ReactNode;
}

export default function ParameterCard({ title, value, unit, trend, status, icon }: ParameterCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "normal": return "text-industrial-operational";
      case "warning": return "text-industrial-warning";
      case "critical": return "text-industrial-critical";
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-industrial-operational" />;
      case "down": return <TrendingDown className="h-4 w-4 text-industrial-critical" />;
      case "stable": return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "normal": return <Badge variant="outline" className="text-industrial-operational border-industrial-operational">Normal</Badge>;
      case "warning": return <Badge variant="outline" className="text-industrial-warning border-industrial-warning">Warning</Badge>;
      case "critical": return <Badge variant="outline" className="text-industrial-critical border-industrial-critical">Critical</Badge>;
    }
  };

  return (
    <Card className="hover-elevate" data-testid={`card-parameter-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        {getStatusBadge()}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <div className={`text-2xl font-mono font-bold ${getStatusColor()}`} data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value.toFixed(1)}
            </div>
            <span className="text-sm font-medium text-muted-foreground">{unit}</span>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}