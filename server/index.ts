import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { seed } from "./seed";
import { storage } from "./storage";

const app = express();
const httpServer = createServer(app);

// SECURITY: the production reverse proxy (Plesk nginx + Passenger) has been
// observed forwarding internal Passenger env vars (including secrets like
// SESSION_SECRET and the DB connection string) to this app
// as literal HTTP request headers named "!~passenger-envvars" and similar.
// This
// is a hosting-level nginx/Passenger misconfiguration outside this app's
// control. As defense-in-depth, strip any such header on every request
// before it reaches route handlers, logging, or storage, and warn server-side
// (console only — never persisted) so we can tell when the hosting
// misconfiguration has been fixed.
app.use((req, _res, next) => {
  let leakDetected = false;
  for (const key of Object.keys(req.headers)) {
    if (key.startsWith("!~") || key.toLowerCase().includes("passenger-envvars")) {
      leakDetected = true;
      delete (req.headers as Record<string, unknown>)[key];
    }
  }
  if (leakDetected) {
    console.error(
      `[SECURITY] Stripped a leaked internal Passenger env-var header on ${req.method} ${req.path}. ` +
        `The hosting nginx/Passenger config is still leaking secrets into request headers — this needs to be fixed at the Plesk/nginx level.`,
    );
  }
  next();
});

// Security headers — applied before any route handler.
// CSP is intentionally permissive for the inline scripts/styles used by the
// React SPA and the Vite dev server; tighten nonces/hashes once the front-end
// build is locked down.
app.use(
  helmet({
    contentSecurityPolicy: false, // SPA relies on inline scripts; harden separately
    crossOriginEmbedderPolicy: false, // needed for external payment iframes
  }),
);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "15mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "15mb" }));


export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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

      log(logLine);
    }
  });

  next();
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection — server will continue:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

(async () => {
  try {
  // Seed database with initial data
  await seed().catch(console.error);
  
  await registerRoutes(httpServer, app);

  // Process daily earnings and staking releases
  const processEarningsInterval = async () => {
    try {
      await storage.processEarnings();
      log("Daily earnings processed successfully", "earnings");
    } catch (error) {
      console.error("Error processing daily earnings:", error);
    }
    try {
      await storage.releaseMaturedStakings();
    } catch (error) {
      console.error("Error releasing stakings:", error);
    }
  };
  
  // Run immediately on startup
  setTimeout(processEarningsInterval, 5000);
  
  // Then run every 5 minutes to ensure timely earnings processing
  setInterval(processEarningsInterval, 5 * 60 * 1000);

  // Clean up deposit screenshots: approved/rejected deposits lose their image after 24h
  const cleanupScreenshots = async () => {
    try {
      await storage.cleanupDepositScreenshots();
      log("Deposit screenshots cleanup done", "cleanup");
    } catch (error) {
      console.error("Error cleaning up deposit screenshots:", error);
    }
  };
  setTimeout(cleanupScreenshots, 10000);
  setInterval(cleanupScreenshots, 60 * 60 * 1000); // every hour

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  // In production (Plesk), bind only to loopback so the app is reachable
  // exclusively through the Plesk nginx reverse proxy — direct external
  // access to this port is blocked at the network level.
  const host = process.env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0";
  httpServer.listen(port, host, () => {
    log(`serving on port ${port} (${host})`);
  });
  } catch (err) {
    console.error("Fatal startup error:", err);
    process.exit(1);
  }
})();
