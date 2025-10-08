import StatusIndicator from '../StatusIndicator';

export default function StatusIndicatorExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      <StatusIndicator 
        status="operational" 
        label="Electrolyzer" 
        onClick={() => console.log('Electrolyzer status clicked')}
      />
      <StatusIndicator 
        status="standby" 
        label="Cooling System" 
        onClick={() => console.log('Cooling system clicked')}
      />
      <StatusIndicator 
        status="fault" 
        label="Pressure Valve" 
        onClick={() => console.log('Pressure valve clicked')}
      />
      <StatusIndicator 
        status="maintenance" 
        label="Sensors" 
      />
    </div>
  );
}