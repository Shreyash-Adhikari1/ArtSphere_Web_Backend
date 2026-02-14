import mongoose from "mongoose";
import connectDB from "../database/db";

beforeAll(async () => {
  // can be used to connect to test database
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});
