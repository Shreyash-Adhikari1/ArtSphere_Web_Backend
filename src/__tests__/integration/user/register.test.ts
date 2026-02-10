import request from "supertest";
import app from "../../../app";
import { UserModel } from "../../../features/user/model/user.model";
import bcrypt from "bcrypt";

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

// ================================= REGISTRATION TEST CASES ============================================

describe("User Registration Integration Tests", () => {
  beforeAll(async () => {
    // Ensure test user does not exist before tests
    await UserModel.deleteMany({ email: testUser.email });
  });
  afterAll(async () => {
    // Clean up test user after tests
    await UserModel.deleteMany({ email: testUser.email });
  });

  describe("/POST /api/user/register", () => {
    test("should register a new user successfully", async () => {
      //Test Name
      const response = await request(app)
        .post("/api/user/register")
        .send(testUser);

      // Validate response structure
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "User Registration Successfull",
      );
      expect(response.body).toHaveProperty("user");
    });
    test("should fail to regsiter a user with existing email", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send(testUser);

      // Validate
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        "message",
        "User with this email or username already exists",
      );
    });
    test("should fail to register a user with existing username", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send(testUser);

      // Validate
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        "message",
        "User with this email or username already exists",
      );
    });

    test("should fail to register user if password is less than 8 characters", async () => {
      const userWithBadPass = {
        email: "test@example.com",
        password: "test",
        confirmPassword: "test@123",
        username: "testUser",
        fullName: "Test User",
        phoneNumber: "9876543210",
        address: "Kathmandu",
      };
      const response = await request(app)
        .post("/api/user/register")
        .send(userWithBadPass);

      // Validate
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Registration Failed");
    });

    test("should fail to register user if password and confirmPassword dont match", async () => {
      const userWithBadPass = {
        email: "test@example.com",
        password: "test@1234",
        confirmPassword: "test@123",
        username: "testUser",
        fullName: "Test User",
        phoneNumber: "9876543210",
        address: "Kathmandu",
      };
      const response = await request(app)
        .post("/api/user/register")
        .send(userWithBadPass);

      // Validate
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Registration Failed");
    });
  });
});

// ================================= LOGIN TEST CASES ============================================
