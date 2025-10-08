import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ParameterCard from "./ParameterCard";
import StatusGauge from "./StatusGauge";
import StatusIndicator from "./StatusIndicator";
import AlertBanner from "./AlertBanner";
import TrendChart from "./TrendChart";
import ThemeToggle from "./ThemeToggle";
import { websocketService } from "@/services/websocketService";
import { type LiveSensorData, type System } from "@shared/schema";
import { 
  Zap, 
  Thermometer, 
  Droplets, 
  Gauge, 
  Activity, 
  Power, 
  RefreshCcw,
  Settings,
  Download,
  Wifi,
  WifiOff
} from "lucide-react";

type TrendDirection = "up" | "down" | "stable";
type ParameterStatus = "normal" | "warning" | "critical";

interface ParameterData {
  value: number;
  trend: TrendDirection;
  status: ParameterStatus;
}

export default function Dashboard() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [currentData, setCurrentData] = useState<LiveSensorData | null>(null);
  const [historicalData, setHistoricalData] = useState<Map<string, LiveSensorData[]>>(new Map());
  const [alerts, setAlerts] = useState<any[]>([]);

  // Fetch systems list
  const { data: systems = [], isLoading: systemsLoading } = useQuery<System[]>({
    queryKey: ['/api/systems'],
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Set default system when systems load
  useEffect(() => {
    if (systems.length > 0 && !selectedSystemId) {
      setSelectedSystemId(systems[0].id);
    }
  }, [systems, selectedSystemId]);

  // WebSocket connection management
  useEffect(() => {
    const connectionUnsubscribe = websocketService.on('connection', (data: { connected: boolean }) => {
      setIsConnected(data.connected);
      console.log('WebSocket connection status:', data.connected);
    });

    const sensorDataUnsubscribe = websocketService.on('sensorData', (data: LiveSensorData) => {
      console.log('Received sensor data:', data);
      
      // Update current data if it matches selected system
      if (data.systemId === selectedSystemId) {
        setCurrentData(data);
        setLastUpdate(new Date());
      }

      // Store historical data
      setHistoricalData(prev => {
        const systemHistory = prev.get(data.systemId) || [];
        const newHistory = [...systemHistory, data].slice(-50); // Keep last 50 readings
        const newMap = new Map(prev);
        newMap.set(data.systemId, newHistory);
        return newMap;
      });
    });

    const alertUnsubscribe = websocketService.on('alert', (alertData: any) => {
      console.log('Received alert:', alertData);
      setAlerts(prev => [alertData, ...prev].slice(0, 10)); // Keep last 10 alerts
    });

    // Subscribe to current system
    if (selectedSystemId) {
      websocketService.subscribeToSystem(selectedSystemId);
    }

    return () => {
      connectionUnsubscribe();
      sensorDataUnsubscribe();
      alertUnsubscribe();
    };
  }, [selectedSystemId]);

  // Calculate parameter status based on thresholds
  const getParameterStatus = (value: number, parameter: string): ParameterStatus => {
    const thresholds: Record<string, { warning: [number, number], critical: [number, number] }> = {
      voltage: { warning: [10, 15], critical: [0, 16] },
      current: { warning: [20, 120], critical: [0, 140] },
      temperature: { warning: [70, 85], critical: [85, 100] },
      pressure: { warning: [3, 4], critical: [4, 5] },
      pH: { warning: [12, 15], critical: [10, 16] },
      efficiency: { warning: [70, 100], critical: [0, 70] }
    };

    const threshold = thresholds[parameter];
    if (!threshold) return "normal";

    if (value < threshold.critical[0] || value > threshold.critical[1]) return "critical";
    if (value < threshold.warning[0] || value > threshold.warning[1]) return "warning";
    return "normal";
  };

  // Calculate trend based on historical data
  const getTrend = (parameter: string): TrendDirection => {
    const history = historicalData.get(selectedSystemId) || [];
    if (history.length < 3) return "stable";

    const recent = history.slice(-3);
    const values = recent.map(reading => {
      switch (parameter) {
        case 'voltage': return reading.voltage;
        case 'current': return reading.current;
        case 'temperature': return reading.temperature;
        case 'pressure': return reading.pressure;
        case 'pH': return reading.pH;
        case 'efficiency': return reading.efficiency;
        default: return 0;
      }
    });

    const trend = values[2] - values[0];
    const threshold = Math.abs(values[0]) * 0.05; // 5% threshold

    if (trend > threshold) return "up";
    if (trend < -threshold) return "down";
    return "stable";
  };

  // Get current parameters with real data
  const getCurrentParameters = (): Record<string, ParameterData> => {
    if (!currentData) {
      return {
        voltage: { value: 0, trend: "stable", status: "normal" },
        current: { value: 0, trend: "stable", status: "normal" },
        temperature: { value: 0, trend: "stable", status: "normal" },
        pressure: { value: 0, trend: "stable", status: "normal" },
        pH: { value: 0, trend: "stable", status: "normal" },
        efficiency: { value: 0, trend: "stable", status: "normal" }
      };
    }

    return {
      voltage: {
        value: currentData.voltage,
        trend: getTrend('voltage'),
        status: getParameterStatus(currentData.voltage, 'voltage')
      },
      current: {
        value: currentData.current,
        trend: getTrend('current'),
        status: getParameterStatus(currentData.current, 'current')
      },
      temperature: {
        value: currentData.temperature,
        trend: getTrend('temperature'),
        status: getParameterStatus(currentData.temperature, 'temperature')
      },
      pressure: {
        value: currentData.pressure,
        trend: getTrend('pressure'),
        status: getParameterStatus(currentData.pressure, 'pressure')
      },
      pH: {
        value: currentData.pH,
        trend: getTrend('pH'),
        status: getParameterStatus(currentData.pH, 'pH')
      },
      efficiency: {
        value: currentData.efficiency,
        trend: getTrend('efficiency'),
        status: getParameterStatus(currentData.efficiency, 'efficiency')
      }
    };
  };

  // Get system status from current data
  const getSystemStatus = () => {
    type SystemStatusType = "operational" | "standby" | "fault" | "maintenance";
    
    if (!currentData) {
      return {
        electrolyzer: "fault" as SystemStatusType,
        cooling: "fault" as SystemStatusType,
        pressure: "fault" as SystemStatusType,
        sensors: "fault" as SystemStatusType
      };
    }

    const tempStatus: SystemStatusType = currentData.temperature > 85 ? "fault" : currentData.temperature > 70 ? "standby" : "operational";
    const pressureStatus: SystemStatusType = currentData.pressure > 4 ? "fault" : currentData.pressure > 3 ? "standby" : "operational";
    
    const electStatus: SystemStatusType = currentData.systemStatus === "running" ? "operational" : 
                                         currentData.systemStatus === "fault" ? "fault" : 
                                         currentData.systemStatus === "maintenance" ? "maintenance" : "standby";
    
    return {
      electrolyzer: electStatus,
      cooling: tempStatus,
      pressure: pressureStatus,
      sensors: isConnected ? "operational" as SystemStatusType : "fault" as SystemStatusType
    };
  };

  // Time range state for charts
  const [timeRange, setTimeRange] = useState('1h');

  // Fetch historical data for charts
  const { data: historicalChartData = [], isLoading: chartDataLoading } = useQuery({
    queryKey: ['/api/systems', selectedSystemId, 'readings', timeRange],
    enabled: !!selectedSystemId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
    queryFn: () => 
      fetch(`/api/systems/${selectedSystemId}/readings?timeRange=${timeRange}`)
        .then(res => res.json())
  });

  // Generate chart data from historical readings
  const generateChartData = (parameter: string) => {
    if (!historicalChartData.length) {
      // Fallback to real-time data if no historical data
      const history = historicalData.get(selectedSystemId) || [];
      return history.slice(-20).map(reading => ({
        time: new Date(reading.timestamp).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }),
        value: (() => {
          switch (parameter) {
            case 'voltage': return reading.voltage;
            case 'current': return reading.current;
            case 'temperature': return reading.temperature;
            case 'pressure': return reading.pressure;
            case 'pH': return reading.pH;
            case 'efficiency': return reading.efficiency;
            default: return 0;
          }
        })()
      }));
    }

    return historicalChartData.map((reading: any) => ({
      time: new Date(reading.timestamp).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit'
      }),
      value: (() => {
        switch (parameter) {
          case 'voltage': return reading.voltage;
          case 'current': return reading.current;
          case 'temperature': return reading.temperature;
          case 'pressure': return reading.pressure;
          case 'pH': return reading.pH;
          case 'efficiency': return reading.efficiency;
          default: return 0;
        }
      })()
    }));
  };

  const handleRefresh = () => {
    console.log('Dashboard refresh triggered');
    if (selectedSystemId) {
      websocketService.subscribeToSystem(selectedSystemId);
    }
    setLastUpdate(new Date());
  };

  const handleSystemToggle = () => {
    console.log(`System ${currentData?.systemStatus === 'running' ? 'stopped' : 'started'}`);
    // In a real implementation, this would send a command to the backend
  };

  const handleExportData = () => {
    console.log('Data export triggered');
    // In a real implementation, this would export historical data
  };

  const currentParameters = getCurrentParameters();
  const systemStatus = getSystemStatus();
  const selectedSystem = systems.find((s) => s.id === selectedSystemId);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2" data-testid="text-dashboard-title">
            <Activity className="h-8 w-8 text-primary" />
            IoT Electrolyzer Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring system • Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isConnected ? "default" : "secondary"} className="text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Disconnected
              </>
            )}
          </Badge>
          <Badge variant={currentData?.systemStatus === "running" ? "default" : "secondary"} className="text-sm">
            {currentData?.systemStatus === "running" ? "System Online" : 
             currentData?.systemStatus === "fault" ? "System Fault" :
             currentData?.systemStatus === "maintenance" ? "Maintenance" : "System Offline"}
          </Badge>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            data-testid="button-refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* System Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>System Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedSystemId} onValueChange={setSelectedSystemId}>
              <SelectTrigger className="w-[300px]" data-testid="select-system">
                <SelectValue placeholder="Select a system" />
              </SelectTrigger>
              <SelectContent>
                {systems.map((system) => (
                  <SelectItem key={system.id} value={system.id}>
                    {system.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSystem && (
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {selectedSystem.description}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-4 mb-8">
          {alerts.slice(0, 3).map((alert, index) => (
            <AlertBanner
              key={index}
              type={alert.severity === "critical" ? "error" : "warning"}
              title={`${alert.parameter.toUpperCase()} Alert`}
              message={alert.message}
              action={{
                label: "Acknowledge",
                onClick: () => setAlerts(prev => prev.filter((_, i) => i !== index))
              }}
            />
          ))}
        </div>
      )}

      {/* System Status Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatusIndicator 
              status={systemStatus.electrolyzer} 
              label="Electrolyzer" 
              onClick={() => console.log('Electrolyzer clicked')}
            />
            <StatusIndicator 
              status={systemStatus.cooling} 
              label="Cooling System" 
              onClick={() => console.log('Cooling clicked')}
            />
            <StatusIndicator 
              status={systemStatus.pressure} 
              label="Pressure System" 
              onClick={() => console.log('Pressure clicked')}
            />
            <StatusIndicator 
              status={systemStatus.sensors} 
              label="Sensors" 
              onClick={() => console.log('Sensors clicked')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ParameterCard
          title="Voltage"
          value={currentParameters.voltage.value}
          unit="V"
          trend={currentParameters.voltage.trend}
          status={currentParameters.voltage.status}
          icon={<Zap className="h-4 w-4" />}
        />
        <ParameterCard
          title="Current"
          value={currentParameters.current.value}
          unit="A"
          trend={currentParameters.current.trend}
          status={currentParameters.current.status}
          icon={<Activity className="h-4 w-4" />}
        />
        <ParameterCard
          title="Temperature"
          value={currentParameters.temperature.value}
          unit="°C"
          trend={currentParameters.temperature.trend}
          status={currentParameters.temperature.status}
          icon={<Thermometer className="h-4 w-4" />}
        />
        <ParameterCard
          title="Pressure"
          value={currentParameters.pressure.value}
          unit="bar"
          trend={currentParameters.pressure.trend}
          status={currentParameters.pressure.status}
          icon={<Gauge className="h-4 w-4" />}
        />
        <ParameterCard
          title="pH Level"
          value={currentParameters.pH.value}
          unit="pH"
          trend={currentParameters.pH.trend}
          status={currentParameters.pH.status}
          icon={<Droplets className="h-4 w-4" />}
        />
        <ParameterCard
          title="Efficiency"
          value={currentParameters.efficiency.value}
          unit="%"
          trend={currentParameters.efficiency.trend}
          status={currentParameters.efficiency.status}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Gauges Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatusGauge
          title="Temperature"
          value={currentParameters.temperature.value}
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
          value={currentParameters.pressure.value}
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
        <StatusGauge
          title="pH Level"
          value={currentParameters.pH.value}
          min={0}
          max={16}
          unit="pH"
          icon={<Droplets className="h-4 w-4" />}
          thresholds={{
            normal: [12, 15],
            warning: [10, 16],
            critical: [0, 10]
          }}
        />
        <StatusGauge
          title="Efficiency"
          value={currentParameters.efficiency.value}
          min={0}
          max={100}
          unit="%"
          icon={<Activity className="h-4 w-4" />}
          thresholds={{
            normal: [80, 100],
            warning: [70, 80],
            critical: [0, 70]
          }}
        />
      </div>

      {/* Historical Trends */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Historical Trends</h2>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]" data-testid="select-time-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="6h">Last 6 Hours</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportData}
              data-testid="button-export-data"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart
            title="Voltage Trend"
            data={generateChartData('voltage')}
            unit="V"
            color="hsl(var(--chart-1))"
            icon={<Zap className="h-4 w-4" />}
          />
          <TrendChart
            title="Temperature Trend"
            data={generateChartData('temperature')}
            unit="°C"
            color="hsl(var(--chart-3))"
            icon={<Thermometer className="h-4 w-4" />}
          />
          <TrendChart
            title="Pressure Trend"
            data={generateChartData('pressure')}
            unit="bar"
            color="hsl(var(--chart-4))"
            icon={<Gauge className="h-4 w-4" />}
          />
          <TrendChart
            title="Efficiency Trend"
            data={generateChartData('efficiency')}
            unit="%"
            color="hsl(var(--chart-2))"
            icon={<Activity className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Control Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant={currentData?.systemStatus === "running" ? "destructive" : "default"}
              onClick={handleSystemToggle}
              data-testid="button-system-toggle"
            >
              <Power className="h-4 w-4 mr-2" />
              {currentData?.systemStatus === "running" ? "Stop System" : "Start System"}
            </Button>
            <Button variant="outline" data-testid="button-calibrate">
              <Settings className="h-4 w-4 mr-2" />
              Calibrate Sensors
            </Button>
            <Button variant="outline" data-testid="button-maintenance">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Maintenance Mode
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}