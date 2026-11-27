import mongoose from "mongoose";

const DEFAULT_TEST_URI = "mongodb://127.0.0.1:27017/govguide_test?directConnection=true";

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-jwt-secret-for-jest-suite";
  process.env.AI_SERVICE_URL = "http://127.0.0.1:8000";

  const uri = process.env.MONGODB_TEST_URI || DEFAULT_TEST_URI;

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}, 30000);

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}, 30000);
