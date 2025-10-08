import ParameterCard from '../ParameterCard';
import { Zap, Thermometer, Droplets, Gauge } from 'lucide-react';

export default function ParameterCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      <ParameterCard
        title="Voltage"
        value={24.5}
        unit="V"
        trend="stable"
        status="normal"
        icon={<Zap className="h-4 w-4" />}
      />
      <ParameterCard
        title="Temperature"
        value={68.2}
        unit="°C"
        trend="up"
        status="warning"
        icon={<Thermometer className="h-4 w-4" />}
      />
      <ParameterCard
        title="pH Level"
        value={7.1}
        unit="pH"
        trend="down"
        status="normal"
        icon={<Droplets className="h-4 w-4" />}
      />
      <ParameterCard
        title="Pressure"
        value={2.8}
        unit="bar"
        trend="stable"
        status="critical"
        icon={<Gauge className="h-4 w-4" />}
      />
    </div>
  );
}