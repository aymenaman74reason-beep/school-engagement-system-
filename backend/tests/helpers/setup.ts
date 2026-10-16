import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env";
import { User } from "../../src/models/User";

let mongoServer: MongoMemoryServer;

/**
 * Connect to in-memory MongoDB before all tests.
 */
export const setupTestDB = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
};

/**
 * Create a test user and return JWT token.
 */
export const createTestUser = async (overrides: Partial<any> = {}) => {
  const userData = {
    email: `test-${Date.now()}@school.com`,
    password: "Test@123456",
    firstName: "Test",
    lastName: "User",
    role: "admin",
    ...overrides,
  };

  const user = await User.create(userData);
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  return { user, token };
};

/**
 * Generate a JWT for a given user.
 */
export const generateToken = (user: any): string => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "1h" },
  );
};
