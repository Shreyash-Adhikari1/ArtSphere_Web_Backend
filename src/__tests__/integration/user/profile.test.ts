import request from "supertest";
import app from "../../../app";
import { UserModel } from "../../../features/user/model/user.model";

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
const token = describe("After Login Tests", () => {
  let authToken: string;
  beforeAll(async () => {
    // Register
    await request(app).post("/api/user/register").send(testUser);

    // Login
    const loginRes = await request(app).post("/api/user/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginRes.body.token;
  });
  afterAll(async () => {
    // Clean up test user after tests
    await UserModel.deleteMany({ email: testUser.email });
  });

  describe("/GET /api/user/me", () => {
    test("Should return the authenticated logged-in user", async () => {
      const response = await request(app)
        .get("/api/user/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
    });
  });
});
