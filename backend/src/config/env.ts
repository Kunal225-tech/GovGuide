import dotenv from "dotenv";
import path from "path";

// Load .env from backend root if it exists
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Also fallback to default dotenv
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET;

// Fail fast in production if JWT_SECRET is unset or using default development fallback
if (isProduction && (!jwtSecret || jwtSecret === "govguide-super-secret-key-change-in-production-2026")) {
  throw new Error("FATAL: JWT_SECRET environment variable must be explicitly defined and secure in production mode.");
}

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/govguide",
  MONGODB_TEST_URI:
    process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017/govguide_test",
  JWT_SECRET:
    jwtSecret || "govguide-super-secret-key-change-in-production-2026",
  CORS_ORIGIN:
    process.env.CORS_ORIGIN || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: isProduction,
};

export default ENV;
