import { UserModel } from "../../../features/user/model/user.model";
import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../../app";

// Dummy User For Auth Tests
const testUser = {
  email: "test@example.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "testUser",
  fullName: "Test User",
  phoneNumber: "9876543210",
  address: "Kathmandu",
};

describe("User Login Integration Tests", () => {
  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await UserModel.create({
      fullName: testUser.fullName,
      username: testUser.username,
      email: testUser.email,
      password: hashedPassword,
    });
  });
  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
  });

  describe("/POST /api/user/login", () => {
    const testEmail = {
      email: testUser.email,
      password: testUser.password,
    };
    test("should log in the user successfully", async () => {
      const response = await request(app)
        .post("/api/user/login")
        .send(testEmail);

      // Validation
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Login Successful");
    });
    test("should fail for non-existent user", async () => {
      const response = await request(app).post("/api/user/login").send({
        email: "nouser@example.com",
        password: "whatever",
      });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message", "Invalid credentials");
    });
    test("should fail to login user with empty fields", async () => {
      const response = await request(app).post("/api/user/login");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Invalid Credentials");
    });

    test("should fail for wrong password", async () => {
      const response = await request(app).post("/api/user/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message", "Invalid credentials");
    });
    test("should return token after login successful", async () => {
      const response = await request(app)
        .post("/api/user/login")
        .send(testEmail);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Login Successful");
      expect(response.body).toHaveProperty("token");
    });
  });
});
