import request from "supertest";
import app from "../../app";
import { UserModel } from "../../features/user/model/user.model";

describe("Authentication Integration Tests", () => {
  const testUser = {
    email: "test@example.com",
    password: "test@1234",
    confirmPassword: "test@1234",
    username: "testUser",
    fullName: "Test User",
    phoneNumber: "9876543210",
    address: "Kathmandu",
  };

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
});
