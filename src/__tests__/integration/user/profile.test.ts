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
    test("should fail if user is not logged-in || No Token Provided", async () => {
      const response = await request(app).get("/api/user/me");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "No Token Provided");
    });
    test("Should return the authenticated logged-in user", async () => {
      const response = await request(app)
        .get("/api/user/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
    });
  });

  describe("/PATCH /api/user/me", () => {
    test("should update profile when authenticated", async () => {
      const response = await request(app)
        .patch("/api/user/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          fullName: "Updated Name",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Profile updated successfully",
      );
      expect(response.body).toHaveProperty("user");
    });

    test("should fail update without token", async () => {
      const response = await request(app)
        .patch("/api/user/me")
        .send({ fullName: "Hacker Name" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "No Token Provided");
    });

    test("should fail with invalid update data", async () => {
      await UserModel.create({
        email: "test1@example.com",
        password: "test@1234",
        username: "testUser12",
        fullName: "Test User",
      });
      const response = await request(app)
        .patch("/api/user/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ username: "testUser12" });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Email or username already in use",
      );
    });
  });

  //   describe("/DELETE /api/user/me", () => {
  //     test("should delete user wehn authenticated", async () => {
  //       const response = await request(app)
  //         .delete("/api/user/me")
  //         .set("Authorization", `Bearer ${authToken}`);

  //       expect(response.status).toBe(200);
  //       expect(response.body).toHaveProperty(
  //         "message",
  //         "User Deleted Successfully",
  //       );
  //     });
  //   });
});
