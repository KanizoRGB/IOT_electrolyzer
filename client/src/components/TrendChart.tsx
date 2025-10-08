import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from "react";

interface TrendChartProps {
  title: string;
  data: Array<{
    time: string;
    value: number;
  }>;
  unit: string;
  color: string;
  icon: React.ReactNode;
}

export default function TrendChart({ title, data, unit, color, icon }: TrendChartProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');

  const handleTimeRangeChange = (range: '1h' | '6h' | '24h') => {
    console.log(`Time range changed to: ${range}`);
    setTimeRange(range);
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-md p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">
            <span style={{ color }} className="font-mono">
              {payload[0].value.toFixed(2)} {unit}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="hover-elevate" data-testid={`chart-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <div className="flex gap-1">
          {(['1h', '6h', '24h'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleTimeRangeChange(range)}
              data-testid={`button-timerange-${range}`}
            >
              {range}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}${unit}`}
              />
              <Tooltip content={customTooltip} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: color, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}