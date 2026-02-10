import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

if (!process.env.NODE_ENV || process.env.NODE_ENV !== "test") {
  throw new Error("Tests are trying to run outside of the test environment!");
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); // clears test DB safely
  await mongoose.connection.close();
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
