import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/profileRoutes";
import schemeRoutes from "./routes/schemeRoutes";
import eligibilityRoutes from "./routes/eligibilityRoute";
import applicationRoutes from "./routes/applicationRoutes";
import savedRoutes from "./routes/savedRoutes";
import ingestionRoutes from "./routes/ingestionRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { ENV } from "./config/env";

const app = express();

// Trust reverse proxy (Render, Railway, Nginx) so req.ip and rate limiters reflect true client IP
app.set("trust proxy", 1);

// Basic Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// Configure CORS with multi-origin and wildcard support
const allowedOrigins = (ENV.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed === "*" || allowed === origin) return true;
        if (allowed.includes("*")) {
          const regex = new RegExp("^" + allowed.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
          return regex.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: Origin '${origin}' is not allowed`));
    },
    credentials: true,
  })
);

// Body parser with 1MB limit to prevent payload flooding
app.use(express.json({ limit: "1mb" }));

// Health Check Endpoint
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "GovGuide API is running",
    timestamp: new Date().toISOString(),
  });
});

// Primary API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/schemes", schemeRoutes);
app.use("/api/eligibility", eligibilityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/admin/ingest", ingestionRoutes);

// Fallback & Global Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;