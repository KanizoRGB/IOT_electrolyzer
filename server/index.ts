import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import dotenv from "dotenv";
dotenv.config();
import { setupVite, serveStatic, log } from "./vite";
import { dataSimulator } from "./dataSimulator";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize demo systems and start simulation
async function initializeDemoSystems() {
  try {
    log("Initializing demo electrolysis systems...");
    
    // Check if systems already exist
    const existingSystems = await storage.getAllSystems();
    
    if (existingSystems.length === 0) {
      // Create demo systems
      const demoSystems = [
        {
          name: "Electrolyzer Unit A-1",
          description: "Primary hydrogen production unit for industrial process"
        },
        {
          name: "Electrolyzer Unit B-2", 
          description: "Secondary hydrogen production unit for backup operations"
        },
        {
          name: "Research Electrolyzer R-3",
          description: "Experimental unit for testing new electrolyte compositions"
        }
      ];

      for (const systemData of demoSystems) {
        const system = await storage.createSystem(systemData);
        log(`Created system: ${system.name} (ID: ${system.id})`);
        
        // Create default alert thresholds for each system
        const defaultThresholds = [
          { parameter: "voltage", minValue: 10.0, maxValue: 15.0 },
          { parameter: "current", minValue: 20.0, maxValue: 120.0 },
          { parameter: "temperature", minValue: 45.0, maxValue: 85.0 },
          { parameter: "pressure", minValue: 1.5, maxValue: 3.0 },
          { parameter: "pH", minValue: 12.0, maxValue: 15.0 },
          { parameter: "efficiency", minValue: 70.0, maxValue: null }
        ];

        for (const threshold of defaultThresholds) {
          await storage.createAlertThreshold({
            systemId: system.id,
            ...threshold
          });
        }
        
        log(`Created alert thresholds for system ${system.name}`);
      }
    } else {
      log(`Found ${existingSystems.length} existing systems`);
    }

    // Start data simulation for all active systems
    const allSystems = await storage.getAllSystems();
    for (const system of allSystems) {
      if (system.isActive) {
        log(`Starting data simulation for system: ${system.name}`);
        await dataSimulator.startSimulation(system.id, 3000); // 3 second intervals
      }
    }
    
    log("Demo systems initialization completed");
  } catch (error) {
    console.error("Error initializing demo systems:", error);
  }
}

(async () => {
  const server = await registerRoutes(app);

  // Set up the data simulator with WebSocket broadcasting
  const broadcastSensorData = (server as any).broadcastSensorData;
  const broadcastAlert = (server as any).broadcastAlert;
  if (broadcastSensorData) {
    (dataSimulator as any).broadcastCallback = broadcastSensorData;
  }
  if (broadcastAlert) {
    (dataSimulator as any).alertCallback = broadcastAlert;
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    
    // Initialize demo systems after server starts
    await initializeDemoSystems();
  });
})();
