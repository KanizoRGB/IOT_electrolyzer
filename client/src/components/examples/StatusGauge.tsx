import StatusGauge from '../StatusGauge';
import { Thermometer, Gauge } from 'lucide-react';

export default function StatusGaugeExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <StatusGauge
        title="Temperature"
        value={68.2}
        min={0}
        max={100}
        unit="°C"
        icon={<Thermometer className="h-4 w-4" />}
        thresholds={{
          normal: [20, 70],
          warning: [70, 85],
          critical: [85, 100]
        }}
      />
      <StatusGauge
        title="Pressure"
        value={2.8}
        min={0}
        max={5}
        unit="bar"
        icon={<Gauge className="h-4 w-4" />}
        thresholds={{
          normal: [0.5, 3],
          warning: [3, 4],
          critical: [4, 5]
        }}
      />
    </div>
  );
}