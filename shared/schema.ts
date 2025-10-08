import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Electrolysis systems table
export const systems = pgTable("systems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sensor readings table for real-time and historical data
export const sensorReadings = pgTable("sensor_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  systemId: varchar("system_id").notNull().references(() => systems.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  
  // Electrical parameters
  voltage: real("voltage").notNull(), // Volts
  current: real("current").notNull(), // Amperes
  power: real("power").notNull(), // Watts
  
  // Physical parameters
  temperature: real("temperature").notNull(), // Celsius
  pressure: real("pressure").notNull(), // Bar
  pH: real("ph").notNull(), // pH units
  
  // Flow rates
  hydrogenFlow: real("hydrogen_flow").notNull(), // L/min
  oxygenFlow: real("oxygen_flow").notNull(), // L/min
  electrolyteFlow: real("electrolyte_flow").notNull(), // L/min
  
  // System status
  efficiency: real("efficiency").notNull(), // Percentage
  systemStatus: text("system_status").notNull().default("running"), // running, idle, fault, maintenance
});

// Alert thresholds configuration
export const alertThresholds = pgTable("alert_thresholds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  systemId: varchar("system_id").notNull().references(() => systems.id),
  parameter: text("parameter").notNull(), // voltage, current, temperature, etc.
  minValue: real("min_value"),
  maxValue: real("max_value"),
  isEnabled: boolean("is_enabled").notNull().default(true),
});


// Active alerts
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  systemId: varchar("system_id").notNull().references(() => systems.id),
  parameter: text("parameter").notNull(),
  severity: text("severity").notNull(), // low, medium, high, critical
  message: text("message").notNull(),
  value: real("value").notNull(),
  threshold: real("threshold").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});
export interface LiveSensorData {
  systemId: string;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  pressure: number;
  pH: number;
  hydrogenFlow: number;
  oxygenFlow: number;
  electrolyteFlow: number;
  efficiency: number;
  systemStatus: 'running' | 'idle' | 'fault' | 'maintenance';
  timestamp: string;

  // New controller information fields
  controllerTemperature?: number;
  signalStrength?: number; // dBm
  batteryLevel?: number; // percentage
  rtcStatus?: "ok" | "error";
  gsmStatus?: "ok" | "error";
  wifiAvailable?: boolean;
  wifiConnected?: boolean;
  creditBalance?: number;
  controllerStatus?: "normal" | "abnormal"|"stable" ;



  status: "on" | "off";
  mode: "manual" | "automatic";
  waterLevel: number; // percentage
  chamberTemperature: number; // °C
  oxygenRate: number; // L/min
  hydrogenRate: number; // L/min
  setProductionRate: number; // percentage
  electrolyzerStatus: "normal" | "abnormal";
}


// Relations
export const systemsRelations = relations(systems, ({ many }) => ({
  sensorReadings: many(sensorReadings),
  alertThresholds: many(alertThresholds),
  alerts: many(alerts),
}));

export const sensorReadingsRelations = relations(sensorReadings, ({ one }) => ({
  system: one(systems, {
    fields: [sensorReadings.systemId],
    references: [systems.id],
  }),
}));

export const alertThresholdsRelations = relations(alertThresholds, ({ one }) => ({
  system: one(systems, {
    fields: [alertThresholds.systemId],
    references: [systems.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  system: one(systems, {
    fields: [alerts.systemId],
    references: [systems.id],
  }),
}));

// Zod schemas for validation
export const insertSystemSchema = createInsertSchema(systems).omit({ id: true, createdAt: true });
export const insertSensorReadingSchema = createInsertSchema(sensorReadings).omit({ id: true, timestamp: true });
export const insertAlertThresholdSchema = createInsertSchema(alertThresholds).omit({ id: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true, resolvedAt: true });

// TypeScript types
export type System = typeof systems.$inferSelect;
export type InsertSystem = z.infer<typeof insertSystemSchema>;
export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;
export type AlertThreshold = typeof alertThresholds.$inferSelect;
export type InsertAlertThreshold = z.infer<typeof insertAlertThresholdSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// Real-time sensor data interface for WebSocket
export interface LiveSensorData {
  systemId: string;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  pressure: number;
  pH: number;
  hydrogenFlow: number;
  oxygenFlow: number;
  electrolyteFlow: number;
  efficiency: number;
  systemStatus: 'running' | 'idle' | 'fault' | 'maintenance';
  timestamp: string;
}
