import dotenv from "dotenv";
import path from "path";

// Load .env from backend root if it exists
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Also fallback to default dotenv
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/govguide",
  MONGODB_TEST_URI:
    process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017/govguide_test",
  JWT_SECRET:
    process.env.JWT_SECRET || "govguide-super-secret-key-change-in-production-2026",
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
};

export default ENV;
