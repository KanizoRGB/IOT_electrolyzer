import TrendChart from '../TrendChart';
import { Zap, Thermometer } from 'lucide-react';

// Mock data generation
const generateMockData = (baseValue: number, variance: number, points: number = 20) => {
  return Array.from({ length: points }, (_, i) => {
    const time = new Date(Date.now() - (points - i) * 3 * 60000); // 3 minute intervals
    const value = baseValue + (Math.random() - 0.5) * variance;
    return {
      time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      value: Math.max(0, value)
    };
  });
};

export default function TrendChartExample() {
  // Mock data for different parameters
  const voltageData = generateMockData(24.5, 2);
  const temperatureData = generateMockData(68, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      <TrendChart
        title="Voltage Trend"
        data={voltageData}
        unit="V"
        color="hsl(var(--chart-1))"
        icon={<Zap className="h-4 w-4" />}
      />
      <TrendChart
        title="Temperature Trend"
        data={temperatureData}
        unit="°C"
        color="hsl(var(--chart-3))"
        icon={<Thermometer className="h-4 w-4" />}
      />
    </div>
  );
}