import { storage } from "./storage";
import { type LiveSensorData, type InsertSensorReading } from "@shared/schema";

interface SimulationParams {
  systemId: string;
  baseVoltage: number;
  baseCurrent: number;
  baseTemperature: number;
  basePressure: number;
  basePH: number;
  baseHydrogenFlow: number;
  baseOxygenFlow: number;
  baseElectrolyteFlow: number;
  baseEfficiency: number;
  variability: number; // 0-1 scale for how much parameters can vary
  trendDirection: 'stable' | 'increasing' | 'decreasing' | 'cyclic';
  faultProbability: number; // 0-1 probability of fault conditions
}

export class DataSimulator {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private simulationState: Map<string, SimulationParams> = new Map();
  private lastReadings: Map<string, LiveSensorData> = new Map();
  private cyclePosition: Map<string, number> = new Map();

  constructor(
    private broadcastCallback?: (data: LiveSensorData) => void,
    private alertCallback?: (alert: any) => void
  ) {}

  // Start simulation for a system
  async startSimulation(systemId: string, intervalMs: number = 2000): Promise<void> {
    // Stop existing simulation if running
    this.stopSimulation(systemId);

    // Initialize simulation parameters for electrolysis system
    const simParams: SimulationParams = {
      systemId,
      baseVoltage: 12.5, // Typical electrolysis voltage
      baseCurrent: 85.0, // Amperes
      baseTemperature: 65.0, // Celsius - operating temperature
      basePressure: 2.1, // Bar - hydrogen pressure
      basePH: 14.0, // Alkaline electrolyte
      baseHydrogenFlow: 15.2, // L/min
      baseOxygenFlow: 7.6, // L/min (half of hydrogen due to stoichiometry)
      baseElectrolyteFlow: 125.0, // L/min circulation
      baseEfficiency: 82.5, // Percentage
      variability: 0.15, // 15% variability
      trendDirection: Math.random() > 0.7 ? 'cyclic' : 'stable',
      faultProbability: 0.02 // 2% chance of fault per reading
    };

    this.simulationState.set(systemId, simParams);
    this.cyclePosition.set(systemId, 0);

    // Generate initial reading
    const initialReading = this.generateReading(simParams);
    this.lastReadings.set(systemId, initialReading);

    // Start the simulation timer
    const timer = setInterval(async () => {
      try {
        const reading = this.generateReading(simParams);
        this.lastReadings.set(systemId, reading);

        // Store in database
        await this.storeReading(reading);

        // Check for alerts
        await this.checkAlerts(reading);

        // Broadcast to WebSocket clients
        if (this.broadcastCallback) {
          this.broadcastCallback(reading);
        }

        console.log(`Generated sensor reading for system ${systemId}:`, {
          voltage: reading.voltage,
          current: reading.current,
          temperature: reading.temperature,
          efficiency: reading.efficiency,
          status: reading.systemStatus
        });
      } catch (error) {
        console.error(`Error in simulation for system ${systemId}:`, error);
      }
    }, intervalMs);

    this.timers.set(systemId, timer);
    console.log(`Started data simulation for system ${systemId} with ${intervalMs}ms interval`);
  }

  // Stop simulation for a system
  stopSimulation(systemId: string): void {
    const timer = this.timers.get(systemId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(systemId);
      this.simulationState.delete(systemId);
      this.lastReadings.delete(systemId);
      this.cyclePosition.delete(systemId);
      console.log(`Stopped data simulation for system ${systemId}`);
    }
  }

  // Stop all simulations
  stopAllSimulations(): void {
    this.timers.forEach((timer, systemId) => {
      clearInterval(timer);
      console.log(`Stopped simulation for system ${systemId}`);
    });
    this.timers.clear();
    this.simulationState.clear();
    this.lastReadings.clear();
    this.cyclePosition.clear();
  }

  // Generate a realistic sensor reading
  private generateReading(params: SimulationParams): LiveSensorData {
    const cyclePos = this.cyclePosition.get(params.systemId) || 0;
    this.cyclePosition.set(params.systemId, (cyclePos + 1) % 360);

    // Introduce random fault condition
    const isFault = Math.random() < params.faultProbability;
    
    // Base values with trend and cycle effects
    const trendFactor = this.getTrendFactor(params.trendDirection, cyclePos);
    const cycleFactor = Math.sin((cyclePos * Math.PI) / 180) * 0.1; // 10% cyclic variation

    // Generate correlated parameters
    const voltage = this.addVariation(
      params.baseVoltage * (1 + trendFactor + cycleFactor),
      params.variability,
      isFault ? 0.3 : 0.05
    );

    const current = this.addVariation(
      params.baseCurrent * (voltage / params.baseVoltage) * 0.95, // Current correlates with voltage
      params.variability,
      isFault ? 0.4 : 0.08
    );

    const power = voltage * current; // Power = V * I

    const temperature = this.addVariation(
      params.baseTemperature + (current - params.baseCurrent) * 0.2, // Temperature rises with current
      params.variability,
      isFault ? 0.25 : 0.06
    );

    const pressure = this.addVariation(
      params.basePressure + (current - params.baseCurrent) * 0.01, // Pressure correlates with production
      params.variability,
      isFault ? 0.2 : 0.04
    );

    const pH = this.addVariation(
      params.basePH,
      params.variability * 0.5, // pH more stable
      isFault ? 0.1 : 0.02
    );

    // Flow rates correlate with current (gas production rate)
    const currentRatio = current / params.baseCurrent;
    const hydrogenFlow = this.addVariation(
      params.baseHydrogenFlow * currentRatio,
      params.variability,
      isFault ? 0.3 : 0.1
    );

    const oxygenFlow = this.addVariation(
      params.baseOxygenFlow * currentRatio,
      params.variability,
      isFault ? 0.3 : 0.1
    );

    const electrolyteFlow = this.addVariation(
      params.baseElectrolyteFlow,
      params.variability * 0.3, // Flow more stable
      isFault ? 0.2 : 0.05
    );

    // Efficiency decreases with temperature and improves with optimal conditions
    const tempEfficiencyFactor = Math.max(0.7, 1 - Math.abs(temperature - 65) * 0.005);
    const efficiency = this.addVariation(
      params.baseEfficiency * tempEfficiencyFactor,
      params.variability * 0.5,
      isFault ? 0.3 : 0.08
    );

    // Determine system status based on conditions
    let systemStatus: 'running' | 'idle' | 'fault' | 'maintenance' = 'running';
    
    if (isFault || efficiency < 70 || temperature > 85 || voltage < 10) {
      systemStatus = 'fault';
    } else if (current < 20) {
      systemStatus = 'idle';
    } else if (Math.random() < 0.01) { // 1% chance of maintenance
      systemStatus = 'maintenance';
    }

    return {
      systemId: params.systemId,
      voltage: Math.round(voltage * 100) / 100,
      current: Math.round(current * 100) / 100,
      power: Math.round(power * 100) / 100,
      temperature: Math.round(temperature * 10) / 10,
      pressure: Math.round(pressure * 100) / 100,
      pH: Math.round(pH * 100) / 100,
      hydrogenFlow: Math.round(hydrogenFlow * 10) / 10,
      oxygenFlow: Math.round(oxygenFlow * 10) / 10,
      electrolyteFlow: Math.round(electrolyteFlow * 10) / 10,
      efficiency: Math.round(efficiency * 10) / 10,
      systemStatus,
      timestamp: new Date().toISOString()
    };
  }

  // Add realistic variation to a parameter
  private addVariation(baseValue: number, normalVariability: number, faultVariability: number): number {
    const variation = (Math.random() - 0.5) * 2; // -1 to 1
    const variabilityAmount = Math.random() < 0.05 ? faultVariability : normalVariability;
    return Math.max(0, baseValue * (1 + variation * variabilityAmount));
  }

  // Get trend factor based on trend direction
  private getTrendFactor(direction: string, cyclePos: number): number {
    switch (direction) {
      case 'increasing':
        return 0.05; // 5% increase trend
      case 'decreasing':
        return -0.05; // 5% decrease trend
      case 'cyclic':
        return Math.sin((cyclePos * Math.PI) / 180) * 0.08; // 8% cyclic variation
      default:
        return 0; // stable
    }
  }

  // Store reading in database
  private async storeReading(data: LiveSensorData): Promise<void> {
    try {
      const reading: InsertSensorReading = {
        systemId: data.systemId,
        voltage: data.voltage,
        current: data.current,
        power: data.power,
        temperature: data.temperature,
        pressure: data.pressure,
        pH: data.pH,
        hydrogenFlow: data.hydrogenFlow,
        oxygenFlow: data.oxygenFlow,
        electrolyteFlow: data.electrolyteFlow,
        efficiency: data.efficiency,
        systemStatus: data.systemStatus
      };

      await storage.createSensorReading(reading);
    } catch (error) {
      console.error("Error storing sensor reading:", error);
    }
  }

  // Check for alerts based on thresholds
  private async checkAlerts(data: LiveSensorData): Promise<void> {
    try {
      // Get alert thresholds for this system
      const thresholds = await storage.getAlertThresholds(data.systemId);
      
      const alertsToCreate = [];
      
      for (const threshold of thresholds) {
        if (!threshold.isEnabled) continue;
        
        const parameterValue = this.getParameterValue(data, threshold.parameter);
        if (parameterValue === null) continue;
        
        let isViolation = false;
        let violationType = '';
        let thresholdValue = 0;
        
        // Check min threshold
        if (threshold.minValue !== null && parameterValue < threshold.minValue) {
          isViolation = true;
          violationType = 'below minimum';
          thresholdValue = threshold.minValue;
        }
        
        // Check max threshold
        if (threshold.maxValue !== null && parameterValue > threshold.maxValue) {
          isViolation = true;
          violationType = 'above maximum';
          thresholdValue = threshold.maxValue;
        }
        
        if (isViolation) {
          // Determine severity based on how far outside threshold
          const deviationPercent = Math.abs((parameterValue - thresholdValue) / thresholdValue) * 100;
          let severity = 'low';
          
          if (deviationPercent > 50) {
            severity = 'critical';
          } else if (deviationPercent > 25) {
            severity = 'high';
          } else if (deviationPercent > 10) {
            severity = 'medium';
          }
          
          const alert = {
            systemId: data.systemId,
            parameter: threshold.parameter,
            severity,
            message: `${threshold.parameter.toUpperCase()} is ${violationType}: ${parameterValue.toFixed(2)} (threshold: ${thresholdValue.toFixed(2)})`,
            value: parameterValue,
            threshold: thresholdValue
          };
          
          alertsToCreate.push(alert);
          
          // Log the alert
          console.log(`🚨 ALERT: System ${data.systemId} - ${alert.message}`);
        }
      }
      
      // Create alerts in database and broadcast them
      for (const alertData of alertsToCreate) {
        try {
          const createdAlert = await storage.createAlert(alertData);
          
          // Broadcast alert via WebSocket
          if (this.alertCallback) {
            this.alertCallback(createdAlert);
          }
        } catch (error) {
          console.error('Error creating alert:', error);
        }
      }
      
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }
  
  // Helper to get parameter value from sensor data
  private getParameterValue(data: LiveSensorData, parameter: string): number | null {
    switch (parameter) {
      case 'voltage': return data.voltage;
      case 'current': return data.current;
      case 'temperature': return data.temperature;
      case 'pressure': return data.pressure;
      case 'pH': return data.pH;
      case 'efficiency': return data.efficiency;
      default: return null;
    }
  }

  // Get latest reading for a system
  getLatestReading(systemId: string): LiveSensorData | undefined {
    return this.lastReadings.get(systemId);
  }

  // Check if simulation is running for a system
  isSimulationRunning(systemId: string): boolean {
    return this.timers.has(systemId);
  }
}

// Export singleton instance
export const dataSimulator = new DataSimulator();