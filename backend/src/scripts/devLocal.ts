/**
 * `npm run dev:local`
 * Starts a private MongoDB on your own computer (no install needed - the
 * binary is downloaded once), keeps its data in backend/.local-db, seeds the
 * demo accounts, then starts the API on PORT.
 * Your .env MONGODB_URI is ignored here, so nobody else's database is touched.
 */
import path from "path";
import fs from "fs";
import { MongoMemoryServer } from "mongodb-memory-server";

const main = async () => {
  const dbPath = path.resolve(__dirname, "../../.local-db");
  fs.mkdirSync(dbPath, { recursive: true });

  const mongod = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: "wiredTiger", port: 27018 },
  });
  const uri = `${mongod.getUri()}school_management_local`;

  // Must be set before ../config/env runs dotenv (dotenv never overrides it).
  process.env.MONGODB_URI = uri;
  console.log(`Local MongoDB running at ${uri}`);

  const mongoose = (await import("mongoose")).default;
  await mongoose.connect(uri);
  const { seedDemo } = await import("./seed");
  await seedDemo();

  const stop = async () => {
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  await import("../server");
};

main().catch((err) => {
  console.error("dev:local failed:", err);
  process.exit(1);
});
