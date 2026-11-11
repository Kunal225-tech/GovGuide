import http from "http";

interface TestResponse {
  statusCode: number;
  body: any;
  headers: http.IncomingHttpHeaders;
}

function request(options: {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
}): Promise<TestResponse> {
  return new Promise((resolve, reject) => {
    const payload = options.body ? JSON.stringify(options.body) : null;
    const reqHeaders: Record<string, string> = {
      ...(options.headers || {}),
    };
    if (payload) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path: options.path,
        method: options.method,
        headers: reqHeaders,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed: any;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({
            statusCode: res.statusCode || 0,
            body: parsed,
            headers: res.headers,
          });
        });
      }
    );

    req.on("error", (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, name: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${name}${details ? ` -> ${details}` : ""}`);
  }
}

async function run() {
  console.log("==================================================");
  console.log("GovGuide Complete API Endpoints Verification Suite");
  console.log("Testing live server at http://localhost:5000");
  console.log("==================================================");

  try {
    // 1. Health Check
    console.log("\n🔷 1. Health Check Endpoint");
    const health = await request({ method: "GET", path: "/" });
    assert(health.statusCode === 200, "GET / returns 200 OK");
    assert(health.body.success === true && health.body.message.includes("running"), "Health check payload indicates running status");
    assert(health.headers["x-content-type-options"] === "nosniff", "Security header nosniff present");
    assert(health.headers["x-frame-options"] === "DENY", "Security header DENY present");

    // 2. Authentication Rejection on Protected Endpoints
    console.log("\n🔷 2. Protected Routes - Unauthenticated Rejection (401)");
    const noAuthProfile = await request({ method: "GET", path: "/api/profile" });
    assert(noAuthProfile.statusCode === 401, "GET /api/profile rejects missing token with 401");

    const noAuthEligibility = await request({ method: "GET", path: "/api/eligibility" });
    assert(noAuthEligibility.statusCode === 401, "GET /api/eligibility rejects missing token with 401");

    const noAuthSaved = await request({ method: "GET", path: "/api/saved" });
    assert(noAuthSaved.statusCode === 401, "GET /api/saved rejects missing token with 401");

    const noAuthApps = await request({ method: "GET", path: "/api/applications" });
    assert(noAuthApps.statusCode === 401, "GET /api/applications rejects missing token with 401");

    const badToken = await request({
      method: "GET",
      path: "/api/profile",
      headers: { Authorization: "Bearer bad.token.here" },
    });
    assert(badToken.statusCode === 401, "GET /api/profile rejects invalid token with 401");

    // 3. User Registration & Login
    console.log("\n🔷 3. Auth Endpoints: Registration & Login");
    const testEmail = `audit_${Date.now()}@example.com`;
    const regRes = await request({
      method: "POST",
      path: "/api/auth/register",
      body: { name: "Audit User", email: testEmail, password: "password123" },
    });
    assert(regRes.statusCode === 201, "POST /api/auth/register succeeds with 201");
    assert(regRes.body.user && regRes.body.user.email === testEmail, "Registered user returned with id and email");

    // Duplicate registration rejection
    const dupRes = await request({
      method: "POST",
      path: "/api/auth/register",
      body: { name: "Audit User", email: testEmail, password: "password123" },
    });
    assert(dupRes.statusCode === 400, "POST /api/auth/register rejects duplicate email with 400");

    // Login with invalid credentials
    const badLogin = await request({
      method: "POST",
      path: "/api/auth/login",
      body: { email: testEmail, password: "wrongpassword" },
    });
    assert(badLogin.statusCode === 401, "POST /api/auth/login rejects wrong password with 401");

    // Successful login
    const loginRes = await request({
      method: "POST",
      path: "/api/auth/login",
      body: { email: testEmail, password: "password123" },
    });
    assert(loginRes.statusCode === 200, "POST /api/auth/login succeeds with 200");
    const token = loginRes.body.token;
    assert(typeof token === "string" && token.length > 20, "JWT token received on login");
    const authHeader = { Authorization: `Bearer ${token}` };

    // 4. Profile Management
    console.log("\n🔷 4. Profile Endpoints (GET / PUT /api/profile)");
    const getProf = await request({ method: "GET", path: "/api/profile", headers: authHeader });
    assert(getProf.statusCode === 200, "GET /api/profile returns 200");
    assert(getProf.body.user.email === testEmail, "Profile matches authenticated user");

    const putProf = await request({
      method: "PUT",
      path: "/api/profile",
      headers: authHeader,
      body: {
        age: 28,
        state: "Maharashtra",
        district: "Pune",
        annualIncome: 250000,
        occupation: "Self-Employed",
        education: "Graduate",
        category: "General",
      },
    });
    assert(putProf.statusCode === 200, "PUT /api/profile returns 200");
    assert(putProf.body.user.profile.age === 28, "Profile age updated to 28");
    assert(putProf.body.user.profile.state === "Maharashtra", "Profile state updated to Maharashtra");

    // 5. Schemes Listing & Retrieval
    console.log("\n🔷 5. Scheme Discovery (GET /api/schemes, GET /api/schemes/:id)");
    const schemesRes = await request({ method: "GET", path: "/api/schemes" });
    assert(schemesRes.statusCode === 200, "GET /api/schemes returns 200");
    assert(Array.isArray(schemesRes.body.data) && schemesRes.body.count > 0, "Schemes list returned with count > 0");

    const targetScheme = schemesRes.body.data[0];
    const schemeId = targetScheme._id;

    const singleScheme = await request({ method: "GET", path: `/api/schemes/${schemeId}` });
    assert(singleScheme.statusCode === 200, `GET /api/schemes/${schemeId} returns 200`);
    assert(singleScheme.body.data.name === targetScheme.name, "Single scheme name matches");

    const notFoundScheme = await request({ method: "GET", path: "/api/schemes/000000000000000000000000" });
    assert(notFoundScheme.statusCode === 404, "GET /api/schemes/:id with non-existent ID returns 404");

    const malformedScheme = await request({ method: "GET", path: "/api/schemes/not-an-id" });
    assert(malformedScheme.statusCode === 404, "GET /api/schemes/:id with malformed ID returns 404");

    // 6. Admin Route Protection for Schemes Mutation
    console.log("\n🔷 6. Scheme Mutation Authorization (POST/PUT/DELETE /api/schemes)");
    const forbiddenCreate = await request({
      method: "POST",
      path: "/api/schemes",
      headers: authHeader, // Citizen user
      body: {
        name: "Citizen Unauthorized Scheme",
        description: "Test description exceeding 10 chars",
        category: "Agriculture",
        level: "central",
        officialUrl: "https://example.gov.in",
        source: "Gov",
      },
    });
    assert(forbiddenCreate.statusCode === 403, "POST /api/schemes rejects non-admin with 403 Forbidden");

    const forbiddenUpdate = await request({
      method: "PUT",
      path: `/api/schemes/${schemeId}`,
      headers: authHeader,
      body: { description: "Citizen update attempt" },
    });
    assert(forbiddenUpdate.statusCode === 403, "PUT /api/schemes/:id rejects non-admin with 403 Forbidden");

    const forbiddenDelete = await request({
      method: "DELETE",
      path: `/api/schemes/${schemeId}`,
      headers: authHeader,
    });
    assert(forbiddenDelete.statusCode === 403, "DELETE /api/schemes/:id rejects non-admin with 403 Forbidden");

    // 7. Eligibility Evaluation
    console.log("\n🔷 7. Eligibility Check (GET /api/eligibility)");
    const eligRes = await request({ method: "GET", path: "/api/eligibility", headers: authHeader });
    assert(eligRes.statusCode === 200, "GET /api/eligibility returns 200");
    assert(Array.isArray(eligRes.body.results), "Eligibility results is an array");
    assert(eligRes.body.results.length === schemesRes.body.count, "Evaluated all schemes in database");

    // 8. Saved Schemes Operations
    console.log("\n🔷 8. Saved Schemes (GET, POST, DELETE /api/saved)");
    const saveRes = await request({
      method: "POST",
      path: "/api/saved",
      headers: authHeader,
      body: { schemeId },
    });
    assert(saveRes.statusCode === 201 || saveRes.statusCode === 200, "POST /api/saved successfully saves scheme");

    const getSaved = await request({ method: "GET", path: "/api/saved", headers: authHeader });
    assert(getSaved.statusCode === 200, "GET /api/saved returns 200");
    assert(
      getSaved.body.data.some((s: any) => s.schemeId === schemeId || s.scheme?._id === schemeId),
      "Saved scheme present in user's saved list"
    );

    const unsaveRes = await request({
      method: "DELETE",
      path: `/api/saved/${schemeId}`,
      headers: authHeader,
    });
    assert(unsaveRes.statusCode === 200, "DELETE /api/saved/:id returns 200");

    const getSavedAfter = await request({ method: "GET", path: "/api/saved", headers: authHeader });
    assert(
      !getSavedAfter.body.data.some((s: any) => s.schemeId === schemeId || s.scheme?._id === schemeId),
      "Scheme removed from user's saved list"
    );

    // 9. Applications Tracker Operations
    console.log("\n🔷 9. Application Tracking (GET, POST, PUT, DELETE /api/applications)");
    const trackRes = await request({
      method: "POST",
      path: "/api/applications",
      headers: authHeader,
      body: {
        schemeId,
        status: "in-progress",
        notes: "Gathering income certificate",
      },
    });
    assert(trackRes.statusCode === 200, "POST /api/applications creates tracking record (200)");
    const appId = trackRes.body.data._id;

    const getApps = await request({ method: "GET", path: "/api/applications", headers: authHeader });
    assert(getApps.statusCode === 200, "GET /api/applications returns 200");
    assert(getApps.body.data.some((a: any) => a._id === appId), "Tracked application present in user applications");

    const updateApp = await request({
      method: "PUT",
      path: `/api/applications/${appId}`,
      headers: authHeader,
      body: {
        status: "submitted",
        notes: "Application submitted at CSC center",
      },
    });
    assert(updateApp.statusCode === 200, "PUT /api/applications/:id returns 200");
    assert(updateApp.body.data.status === "submitted", "Application status updated to 'submitted'");
    assert(updateApp.body.data.notes === "Application submitted at CSC center", "Application notes updated");

    const deleteApp = await request({
      method: "DELETE",
      path: `/api/applications/${appId}`,
      headers: authHeader,
    });
    assert(deleteApp.statusCode === 200, "DELETE /api/applications/:id returns 200");

    const getAppsAfter = await request({ method: "GET", path: "/api/applications", headers: authHeader });
    assert(!getAppsAfter.body.data.some((a: any) => a._id === appId), "Application tracking record removed");

    // 10. Backward Compatibility Routes (/api/applications/saved)
    console.log("\n🔷 10. Backward Compatibility Routes (/api/applications/saved)");
    const compatSave = await request({
      method: "POST",
      path: "/api/applications/saved",
      headers: authHeader,
      body: { schemeId },
    });
    assert(compatSave.statusCode === 201 || compatSave.statusCode === 200, "POST /api/applications/saved succeeds");

    const compatGet = await request({
      method: "GET",
      path: "/api/applications/saved",
      headers: authHeader,
    });
    assert(compatGet.statusCode === 200, "GET /api/applications/saved succeeds");

    const compatUnsave = await request({
      method: "DELETE",
      path: `/api/applications/saved/${schemeId}`,
      headers: authHeader,
    });
    assert(compatUnsave.statusCode === 200, "DELETE /api/applications/saved/:id succeeds");

    // 11. Malformed Requests & 404 Handler
    console.log("\n🔷 11. Error Handling & 404 Route");
    const notFoundRoute = await request({ method: "GET", path: "/api/unknown-endpoint" });
    assert(notFoundRoute.statusCode === 404, "Unregistered route returns 404 with standard error format");
    assert(notFoundRoute.body.success === false, "404 response body has success: false");

    console.log("\n==================================================");
    console.log(`Endpoint Verification Summary: ${totalTests} total | ${passedTests} passed | ${failedTests} failed`);
    console.log("==================================================");

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed with error:", err);
    process.exit(1);
  }
}

run();
