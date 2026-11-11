/**
 * testDb.ts
 *
 * Centralized, isolated test database connection utility and production safety guard.
 *
 * Enforces:
 * 1. Strict production isolation: Blocks test execution if NODE_ENV=production.
 * 2. Strict Host Allowlist: Permits ONLY explicitly approved local loopback hosts
 *    (127.0.0.1, localhost, ::1). Rejects MongoDB Atlas, remote domains, and remote IPs
 *    regardless of database name.
 * 3. Dedicated test database: Connects strictly to `govguide_test` (or MONGODB_TEST_URI).
 *    Never falls back silently to the development database (`govguide`).
 * 4. Targeted cleanup: Restricts record removal to explicit ID arrays.
 *    Collection-wide deletion (`deleteMany({})`) and database drops are strictly prohibited.
 */

import mongoose from "mongoose";
import { ENV } from "./env";

export const DEFAULT_TEST_MONGODB_URI = "mongodb://127.0.0.1:27017/govguide_test";

/**
 * Strict allowlist of permitted hostnames/IPs for automated test database execution.
 * Only local loopback endpoints are permitted.
 */
export const ALLOWED_TEST_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

export interface TestEnvironmentValidationResult {
  isValid: boolean;
  testUri: string;
  databaseName: string;
}

export interface ParsedMongoUri {
  scheme: string;
  hosts: string[];
  databaseName: string;
}

const MONGO_URI_REGEX =
  /^(mongodb(?:\+srv)?):\/\/(?:([^:]+)(?::([^@]+))?@)?([^/?#]+)(?:\/([^?#]*))?(?:\?(.*))?$/i;

/**
 * Robustly parses a MongoDB connection string into its scheme, individual hosts, and database name.
 * Strips credentials safely without logging or exposing secrets.
 */
export function parseMongoUri(uri: string): ParsedMongoUri {
  const match = uri.trim().match(MONGO_URI_REGEX);
  if (!match) {
    throw new Error(
      "SAFETY VIOLATION: Malformed database URI format. Unable to safely parse connection string."
    );
  }

  const scheme = match[1].toLowerCase();
  const rawHostsSegment = match[4];
  const databaseName = match[5] || "";

  // Split comma-separated hosts for replica sets / multi-host setups
  const rawHostList = rawHostsSegment.split(",");
  const hosts: string[] = [];

  for (const item of rawHostList) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    // Handle IPv6 literal [::1]:port or [::1]
    if (trimmed.startsWith("[")) {
      const closingBracket = trimmed.indexOf("]");
      if (closingBracket === -1) {
        throw new Error("SAFETY VIOLATION: Malformed IPv6 address in database URI.");
      }
      const ipv6Host = trimmed.slice(1, closingBracket);
      hosts.push(ipv6Host.toLowerCase());
    } else {
      // Standard hostname or IPv4: host:port or host
      const hostOnly = trimmed.split(":")[0];
      hosts.push(hostOnly.toLowerCase());
    }
  }

  return {
    scheme,
    hosts,
    databaseName,
  };
}

/**
 * Validates the test execution environment and database URI against production exposure
 * and accidental development database leakage.
 *
 * Throws a descriptive Error immediately if a safety boundary is violated.
 */
export function validateTestEnvironment(overrideUri?: string): TestEnvironmentValidationResult {
  // 1. Environment Guard: Check NODE_ENV and configuration flags
  const isProductionEnv =
    process.env.NODE_ENV?.toLowerCase() === "production" ||
    ENV.NODE_ENV?.toLowerCase() === "production" ||
    ENV.IS_PRODUCTION === true;

  if (isProductionEnv) {
    throw new Error(
      "SAFETY VIOLATION: Automated test suites cannot execute in a production environment " +
      "(NODE_ENV=production). Execution permanently blocked."
    );
  }

  // 2. Resolve Test URI:
  // If overrideUri is explicitly provided (even if empty string), respect it.
  // Otherwise check MONGODB_TEST_URI, or fall back to DEFAULT_TEST_MONGODB_URI.
  let candidateUri: string;
  if (overrideUri !== undefined) {
    candidateUri = overrideUri;
  } else if (process.env.MONGODB_TEST_URI !== undefined) {
    candidateUri = process.env.MONGODB_TEST_URI;
  } else {
    candidateUri = DEFAULT_TEST_MONGODB_URI;
  }

  if (!candidateUri || typeof candidateUri !== "string" || candidateUri.trim().length === 0) {
    throw new Error(
      "SAFETY VIOLATION: Test database URI is missing or empty. " +
      "Refusing to execute tests without an explicit dedicated test database."
    );
  }

  const trimmedUri = candidateUri.trim();

  // 3. Robust URI Parsing
  const parsed = parseMongoUri(trimmedUri);

  // 4. Scheme Validation: Reject mongodb+srv (used for cloud Atlas clusters)
  if (parsed.scheme === "mongodb+srv") {
    throw new Error(
      "SAFETY VIOLATION: Scheme 'mongodb+srv' designates remote cloud or cluster endpoints. " +
      "Only local 'mongodb://' scheme is permitted for tests."
    );
  }

  // 5. Strict Host Allowlist Guard:
  // ONLY explicitly approved local loopback hosts are allowed.
  // Applies regardless of database name (a database ending in '_test' does not authorize a remote host).
  if (parsed.hosts.length === 0) {
    throw new Error("SAFETY VIOLATION: No valid host found in test database URI.");
  }

  for (const host of parsed.hosts) {
    if (!ALLOWED_TEST_HOSTS.has(host)) {
      throw new Error(
        `SAFETY VIOLATION: Host '${host}' is not in the approved local test host allowlist (127.0.0.1, localhost, ::1). ` +
        "Remote, cloud, private network, or non-local database execution is strictly prohibited."
      );
    }
  }

  // 6. Development Database Leakage Guard:
  // Must NOT point to the development database ("govguide" without _test)
  const devDbUri = ENV.MONGODB_URI.toLowerCase();
  const devDbParts = devDbUri.split("?")[0].split("/");
  const devDbName = devDbParts[devDbParts.length - 1];

  const databaseName = parsed.databaseName;

  if (!databaseName || databaseName.trim().length === 0) {
    throw new Error(
      "SAFETY VIOLATION: Test database URI does not specify a target database name. " +
      "Must explicitly point to a dedicated test database (e.g. 'govguide_test')."
    );
  }

  // Check if database name matches dev database exactly
  if (databaseName.toLowerCase() === devDbName.toLowerCase()) {
    throw new Error(
      `SAFETY VIOLATION: Test database URI points directly to the development database ('${databaseName}'). ` +
      "Automated tests must run against a dedicated test database (e.g. 'govguide_test') to prevent data pollution."
    );
  }

  // Enforce that the test database name explicitly contains or ends with 'test'
  if (!databaseName.toLowerCase().includes("test")) {
    throw new Error(
      `SAFETY VIOLATION: Target database name '${databaseName}' does not designate a test database. ` +
      "Test database names must contain 'test' (e.g. 'govguide_test')."
    );
  }

  return {
    isValid: true,
    testUri: trimmedUri,
    databaseName,
  };
}

/**
 * Connects to the dedicated, isolated test database after verifying all safety guards.
 * Disconnects from any existing connection if it was connected to another database.
 */
export async function connectTestDB(overrideUri?: string): Promise<typeof mongoose> {
  const validation = validateTestEnvironment(overrideUri);

  // If already connected to the correct test database, reuse connection
  if (mongoose.connection.readyState === 1) {
    if (mongoose.connection.name.toLowerCase() === validation.databaseName.toLowerCase()) {
      return mongoose;
    }
    // Disconnect from mismatched database
    await mongoose.disconnect();
  }

  await mongoose.connect(validation.testUri);

  // Post-connect assertion: Verify active database name
  const activeDbName = mongoose.connection.name;
  if (activeDbName.toLowerCase() !== validation.databaseName.toLowerCase()) {
    await mongoose.disconnect();
    throw new Error(
      `SAFETY VIOLATION: Connected database name '${activeDbName}' does not match expected test database '${validation.databaseName}'. Disconnected.`
    );
  }

  return mongoose;
}

/**
 * Safely disconnects the test database connection.
 */
export async function disconnectTestDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

/**
 * Artifact IDs tracked by an individual test for clean removal.
 */
export interface TestArtifacts {
  userIds?: (mongoose.Types.ObjectId | string)[];
  schemeIds?: (mongoose.Types.ObjectId | string)[];
  ruleIds?: (mongoose.Types.ObjectId | string)[];
  applicationIds?: (mongoose.Types.ObjectId | string)[];
}

/**
 * Targeted cleanup utility: Deletes ONLY records explicitly recorded by ID.
 * Collection-wide deletion (`deleteMany({})`) or dropping database collections is strictly rejected.
 */
export async function cleanTestRecords(
  artifacts: TestArtifacts,
  models: {
    User?: mongoose.Model<any>;
    Scheme?: mongoose.Model<any>;
    EligibilityRule?: mongoose.Model<any>;
    Application?: mongoose.Model<any>;
  }
): Promise<{ deletedCounts: Record<string, number> }> {
  const deletedCounts: Record<string, number> = {};

  if (artifacts.userIds && artifacts.userIds.length > 0 && models.User) {
    const res = await models.User.deleteMany({ _id: { $in: artifacts.userIds } });
    deletedCounts.users = res.deletedCount || 0;
  }

  if (artifacts.schemeIds && artifacts.schemeIds.length > 0 && models.Scheme) {
    const res = await models.Scheme.deleteMany({ _id: { $in: artifacts.schemeIds } });
    deletedCounts.schemes = res.deletedCount || 0;
  }

  if (artifacts.ruleIds && artifacts.ruleIds.length > 0 && models.EligibilityRule) {
    const res = await models.EligibilityRule.deleteMany({ _id: { $in: artifacts.ruleIds } });
    deletedCounts.rules = res.deletedCount || 0;
  }

  if (artifacts.applicationIds && artifacts.applicationIds.length > 0 && models.Application) {
    const res = await models.Application.deleteMany({ _id: { $in: artifacts.applicationIds } });
    deletedCounts.applications = res.deletedCount || 0;
  }

  return { deletedCounts };
}
