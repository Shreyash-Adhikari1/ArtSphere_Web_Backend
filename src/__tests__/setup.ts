// src/__tests__/setup.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

// Safety guard
if (!process.env.NODE_ENV || process.env.NODE_ENV !== "test") {
  throw new Error(
    "🚨 Tests are trying to run outside of the test environment!",
  );
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log(`🧪 TEST ENV ACTIVE | DB: ${mongoose.connection.name}`);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); // clean DB after all tests
  await mongoose.connection.close();
  console.log("🧪 Test database dropped and connection closed.");
});

// import mongoose from "mongoose";
// import connectDB from "../database/db";

// beforeAll(async () => {
//   // can be used to connect to test database
//   await connectDB();
// });

// afterAll(async () => {
//   await mongoose.connection.close();
// });
