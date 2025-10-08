import { 
  systems, 
  sensorReadings, 
  alertThresholds, 
  alerts,
  type System, 
  type InsertSystem,
  type SensorReading,
  type InsertSensorReading,
  type AlertThreshold,
  type InsertAlertThreshold,
  type Alert,
  type InsertAlert,
  type LiveSensorData
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // System management
  getSystem(id: string): Promise<System | undefined>;
  getAllSystems(): Promise<System[]>;
  createSystem(system: InsertSystem): Promise<System>;
  updateSystemStatus(id: string, isActive: boolean): Promise<void>;

  // Sensor readings
  createSensorReading(reading: InsertSensorReading): Promise<SensorReading>;
  getLatestSensorReading(systemId: string): Promise<SensorReading | undefined>;
  getSensorReadings(systemId: string, startTime?: Date, endTime?: Date, limit?: number): Promise<SensorReading[]>;
  
  // Alert thresholds
  getAlertThresholds(systemId: string): Promise<AlertThreshold[]>;
  createAlertThreshold(threshold: InsertAlertThreshold): Promise<AlertThreshold>;
  updateAlertThreshold(id: string, threshold: Partial<InsertAlertThreshold>): Promise<void>;
  
  // Alerts
  getActiveAlerts(systemId?: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  resolveAlert(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // System management
  async getSystem(id: string): Promise<System | undefined> {
    const [system] = await db.select().from(systems).where(eq(systems.id, id));
    return system || undefined;
  }

  async getAllSystems(): Promise<System[]> {
    return await db.select().from(systems).orderBy(systems.name);
  }

  async createSystem(insertSystem: InsertSystem): Promise<System> {
    const [system] = await db
      .insert(systems)
      .values(insertSystem)
      .returning();
    return system;
  }

  async updateSystemStatus(id: string, isActive: boolean): Promise<void> {
    await db
      .update(systems)
      .set({ isActive })
      .where(eq(systems.id, id));
  }

  // Sensor readings
  async createSensorReading(insertReading: InsertSensorReading): Promise<SensorReading> {
    const [reading] = await db
      .insert(sensorReadings)
      .values(insertReading)
      .returning();
    return reading;
  }

  async getLatestSensorReading(systemId: string): Promise<SensorReading | undefined> {
    const [reading] = await db
      .select()
      .from(sensorReadings)
      .where(eq(sensorReadings.systemId, systemId))
      .orderBy(desc(sensorReadings.timestamp))
      .limit(1);
    return reading || undefined;
  }

  async getSensorReadings(
    systemId: string, 
    startTime?: Date, 
    endTime?: Date, 
    limit: number = 1000
  ): Promise<SensorReading[]> {
    if (startTime && endTime) {
      return await db
        .select()
        .from(sensorReadings)
        .where(
          and(
            eq(sensorReadings.systemId, systemId),
            gte(sensorReadings.timestamp, startTime),
            lte(sensorReadings.timestamp, endTime)
          )
        )
        .orderBy(desc(sensorReadings.timestamp))
        .limit(limit);
    }

    return await db
      .select()
      .from(sensorReadings)
      .where(eq(sensorReadings.systemId, systemId))
      .orderBy(desc(sensorReadings.timestamp))
      .limit(limit);
  }

  // Alert thresholds
  async getAlertThresholds(systemId: string): Promise<AlertThreshold[]> {
    return await db
      .select()
      .from(alertThresholds)
      .where(eq(alertThresholds.systemId, systemId));
  }

  async createAlertThreshold(insertThreshold: InsertAlertThreshold): Promise<AlertThreshold> {
    const [threshold] = await db
      .insert(alertThresholds)
      .values(insertThreshold)
      .returning();
    return threshold;
  }

  async updateAlertThreshold(id: string, threshold: Partial<InsertAlertThreshold>): Promise<void> {
    await db
      .update(alertThresholds)
      .set(threshold)
      .where(eq(alertThresholds.id, id));
  }

  // Alerts
  async getActiveAlerts(systemId?: string): Promise<Alert[]> {
    if (systemId) {
      return await db
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.isActive, true),
            eq(alerts.systemId, systemId)
          )
        )
        .orderBy(desc(alerts.createdAt));
    }

    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.isActive, true))
      .orderBy(desc(alerts.createdAt));
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db
      .insert(alerts)
      .values(insertAlert)
      .returning();
    return alert;
  }

  async resolveAlert(id: string): Promise<void> {
    await db
      .update(alerts)
      .set({ 
        isActive: false, 
        resolvedAt: new Date() 
      })
      .where(eq(alerts.id, id));
  }
}

export const storage = new DatabaseStorage();