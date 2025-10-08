import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertSystemSchema, 
  insertSensorReadingSchema,
  insertAlertThresholdSchema,
  type LiveSensorData 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // System management routes
  app.get("/api/systems", async (req, res) => {
    try {
      const systems = await storage.getAllSystems();
      res.json(systems);
    } catch (error) {
      console.error("Error fetching systems:", error);
      res.status(500).json({ error: "Failed to fetch systems" });
    }
  });

  app.get("/api/systems/:id", async (req, res) => {
    try {
      const system = await storage.getSystem(req.params.id);
      if (!system) {
        return res.status(404).json({ error: "System not found" });
      }
      res.json(system);
    } catch (error) {
      console.error("Error fetching system:", error);
      res.status(500).json({ error: "Failed to fetch system" });
    }
  });

  app.post("/api/systems", async (req, res) => {
    try {
      const validatedData = insertSystemSchema.parse(req.body);
      const system = await storage.createSystem(validatedData);
      res.status(201).json(system);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid system data", details: error.errors });
      }
      console.error("Error creating system:", error);
      res.status(500).json({ error: "Failed to create system" });
    }
  });

  // Sensor readings routes
  app.get("/api/systems/:systemId/readings/latest", async (req, res) => {
    try {
      const reading = await storage.getLatestSensorReading(req.params.systemId);
      if (!reading) {
        return res.status(404).json({ error: "No readings found for system" });
      }
      res.json(reading);
    } catch (error) {
      console.error("Error fetching latest reading:", error);
      res.status(500).json({ error: "Failed to fetch latest reading" });
    }
  });

  app.get("/api/systems/:systemId/readings", async (req, res) => {
    try {
      const { startTime, endTime, limit, timeRange } = req.query;
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let limitNum = limit ? parseInt(limit as string, 10) : 100;

      // Handle predefined time ranges
      if (timeRange) {
        const now = new Date();
        switch (timeRange) {
          case '1h':
            startDate = new Date(now.getTime() - 60 * 60 * 1000);
            limitNum = 20; // 1 hour with 3s intervals = ~1200 points, sample to 20
            break;
          case '6h':
            startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
            limitNum = 50; // Sample to 50 points
            break;
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            limitNum = 100; // Sample to 100 points
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            limitNum = 150; // Sample to 150 points
            break;
          default:
            startDate = new Date(now.getTime() - 60 * 60 * 1000); // Default to 1 hour
        }
        endDate = now;
      } else {
        startDate = startTime ? new Date(startTime as string) : undefined;
        endDate = endTime ? new Date(endTime as string) : undefined;
      }

      const readings = await storage.getSensorReadings(
        req.params.systemId,
        startDate,
        endDate,
        limitNum
      );

      // If we have too many readings, sample them to reduce data transfer
      let sampledReadings = readings;
      if (readings.length > limitNum) {
        const step = Math.floor(readings.length / limitNum);
        sampledReadings = readings.filter((_, index) => index % step === 0).slice(0, limitNum);
      }

      res.json(sampledReadings);
    } catch (error) {
      console.error("Error fetching readings:", error);
      res.status(500).json({ error: "Failed to fetch readings" });
    }
  });

  app.post("/api/systems/:systemId/readings", async (req, res) => {
    try {
      const readingData = {
        ...req.body,
        systemId: req.params.systemId
      };
      const validatedData = insertSensorReadingSchema.parse(readingData);
      const reading = await storage.createSensorReading(validatedData);
      res.status(201).json(reading);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid reading data", details: error.errors });
      }
      console.error("Error creating reading:", error);
      res.status(500).json({ error: "Failed to create reading" });
    }
  });

  // Alert thresholds routes
  app.get("/api/systems/:systemId/thresholds", async (req, res) => {
    try {
      const thresholds = await storage.getAlertThresholds(req.params.systemId);
      res.json(thresholds);
    } catch (error) {
      console.error("Error fetching thresholds:", error);
      res.status(500).json({ error: "Failed to fetch thresholds" });
    }
  });

  app.post("/api/systems/:systemId/thresholds", async (req, res) => {
    try {
      const thresholdData = {
        ...req.body,
        systemId: req.params.systemId
      };
      const validatedData = insertAlertThresholdSchema.parse(thresholdData);
      const threshold = await storage.createAlertThreshold(validatedData);
      res.status(201).json(threshold);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid threshold data", details: error.errors });
      }
      console.error("Error creating threshold:", error);
      res.status(500).json({ error: "Failed to create threshold" });
    }
  });

  // Alerts routes
  app.get("/api/alerts", async (req, res) => {
    try {
      const { systemId } = req.query;
      const alerts = await storage.getActiveAlerts(systemId as string);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts/:id/resolve", async (req, res) => {
    try {
      await storage.resolveAlert(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time sensor data
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients for broadcasting
  const connectedClients = new Set<WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    connectedClients.add(ws);

    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to IoT Dashboard WebSocket'
    }));

    // Handle client messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received WebSocket message:', message);
        
        // Handle different message types
        switch (message.type) {
          case 'subscribe':
            // Client wants to subscribe to a specific system
            ws.send(JSON.stringify({
              type: 'subscribed',
              systemId: message.systemId,
              message: `Subscribed to system ${message.systemId}`
            }));
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      connectedClients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectedClients.delete(ws);
    });
  });

  // Function to broadcast sensor data to all connected clients
  const broadcastSensorData = (data: LiveSensorData) => {
    const message = JSON.stringify({
      type: 'sensorData',
      data: data
    });

    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      } else {
        // Remove disconnected clients
        connectedClients.delete(client);
      }
    });
  };

  // Function to broadcast alerts to all connected clients
  const broadcastAlert = (alert: any) => {
    const message = JSON.stringify({
      type: 'alert',
      data: alert
    });

    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      } else {
        connectedClients.delete(client);
      }
    });
  };

  // Make broadcast functions available for other modules
  (httpServer as any).broadcastSensorData = broadcastSensorData;
  (httpServer as any).broadcastAlert = broadcastAlert;

  return httpServer;
}