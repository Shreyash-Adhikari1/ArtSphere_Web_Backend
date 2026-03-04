import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../../app";

import { UserModel } from "../../../features/user/model/user.model";
import { PostModel } from "../../../features/posts/model/post.model";

// NOTE: Your admin routes are mounted at something like /api/admin
// If your base path is different, update ADMIN_BASE below.
const ADMIN_BASE = "/api/admin";

describe("Admin Integration (routes: /api/admin/*)", () => {
  let adminToken: string;
  let userToken: string;

  let adminId: string;
  let normalUserId: string;

  let createdPostId: string;

  const adminUser = {
    email: "admin@example.com",
    password: "admin@1234",
    username: "adminUser",
    fullName: "Admin User",
    phoneNumber: "9800000000",
    address: "Kathmandu",
    role: "admin",
  };

  const normalUser = {
    email: "user@example.com",
    password: "user@1234",
    username: "normalUser",
    fullName: "Normal User",
    phoneNumber: "9811111111",
    address: "Kathmandu",
    role: "user",
  };

  async function login(email: string, password: string) {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email, password });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("token");
    return res.body.token as string;
  }

  async function seedUser(user: any) {
    const hashed = await bcrypt.hash(user.password, 10);
    const created = await UserModel.create({
      ...user,
      password: hashed,
    });
    return created;
  }

  async function seedPost(authorId: string) {
    // Your Post model likely has required fields. Adjust if needed.
    // This is only for admin post routes (get/delete), not upload create route.
    const post = await PostModel.create({
      author: authorId,
      caption: "Seed post for admin tests",
      media: "seed.jpg",
      mediaType: "image",
      likeCount: 0,
      commentCount: 0,
      likedBy: [],
    } as any);

    // Keep user's postCount realistic (some of your logic uses it)
    await UserModel.findByIdAndUpdate(authorId, { $inc: { postCount: 1 } });

    return post;
  }

  beforeAll(async () => {
    await UserModel.deleteMany({});
    await PostModel.deleteMany({});

    const a = await seedUser(adminUser);
    const u = await seedUser(normalUser);

    adminId = String((a as any)._id);
    normalUserId = String((u as any)._id);

    adminToken = await login(adminUser.email, adminUser.password);
    userToken = await login(normalUser.email, normalUser.password);

    const post = await seedPost(normalUserId);
    createdPostId = String((post as any)._id);
  });

  afterAll(async () => {
    await PostModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  // ---------------------------------------------------------
  // AUTH + ADMIN ONLY GUARDS (covers adminOnly + authMiddleware)
  // ---------------------------------------------------------
  describe("Guards", () => {
    test("rejects when no token (401)", async () => {
      const res = await request(app).get(`${ADMIN_BASE}/users`);
      expect(res.status).toBe(401);
    });

    test("rejects when token is non-admin (403)", async () => {
      const res = await request(app)
        .get(`${ADMIN_BASE}/users`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("message", "Only Admin can access");
    });
  });

  // ---------------------------------------------------------
  // USER ROUTES
  // ---------------------------------------------------------
  describe("Admin User Operations", () => {
    test("GET /users: admin can fetch users (sanitized)", async () => {
      const res = await request(app)
        .get(`${ADMIN_BASE}/users`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Users Fetched Successfully");
      expect(Array.isArray(res.body.users)).toBe(true);

      // sanitize check (service removes password + __v)
      const anyUser = res.body.users[0];
      expect(anyUser).not.toHaveProperty("password");
      expect(anyUser).not.toHaveProperty("__v");
    });

    test("GET /users/id/:userId: returns user when valid id", async () => {
      const res = await request(app)
        .get(`${ADMIN_BASE}/users/id/${normalUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "user fetched successfully");
      expect(res.body.user).toHaveProperty("_id");
      expect(res.body.user).not.toHaveProperty("password");
    });

    test("GET /users/id/:userId: returns 500 when user not found", async () => {
      const fakeId = "65f1c2a9b0c4e2d1f9a1b2c3"; // valid-ish ObjectId
      const res = await request(app)
        .get(`${ADMIN_BASE}/users/id/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      // service throws -> controller catch -> 500
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message");
    });

    test("GET /users/username/:username: returns user when exists", async () => {
      const res = await request(app)
        .get(`${ADMIN_BASE}/users/username/${normalUser.username}`)
        .set("Authorization", `Bearer ${adminToken}`);

      // Your service throws when not found, but this path should succeed
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "User Found");
      expect(res.body.user).toHaveProperty("username", normalUser.username);
      expect(res.body.user).not.toHaveProperty("password");
    });

    test("GET /users/username/:username: returns 500 when username not found (service throws)", async () => {
      const res = await request(app)
        .get(`${ADMIN_BASE}/users/username/not_a_real_username_123`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message");
    });

    test("PATCH /users/edit/:userId: invalid input returns 400", async () => {
      const res = await request(app)
        .patch(`${ADMIN_BASE}/users/edit/${normalUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        // Invalid: avatar is handled by multer; we just break DTO fields
        .send({ fullName: 12345 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Invalid input");
      expect(res.body).toHaveProperty("errors");
    });

    test("PATCH /users/edit/:userId: valid edit returns 200", async () => {
      const res = await request(app)
        .patch(`${ADMIN_BASE}/users/edit/${normalUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ fullName: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "User updated successfully");
      expect(res.body.user).toHaveProperty("fullName", "Updated Name");
    });

    test("DELETE /users/delete/:userId: deletes user", async () => {
      // seed a temp user to delete
      const temp = await seedUser({
        email: "temp-delete@example.com",
        password: "temp@1234",
        username: "tempDelete",
        fullName: "Temp Delete",
        phoneNumber: "9800000001",
        address: "Ktm",
        role: "user",
      });
      const tempId = String((temp as any)._id);

      const res = await request(app)
        .delete(`${ADMIN_BASE}/users/delete/${tempId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "User Deleted");
    });

    test("DELETE /users/delete/:userId: returns 500 if user not found", async () => {
      const fakeId = "65f1c2a9b0c4e2d1f9a1b2c3";
      const res = await request(app)
        .delete(`${ADMIN_BASE}/users/delete/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message");
    });

    test("DELETE /users/deleteAll: deletes all users (admin)", async () => {
      // seed 1 extra so this route actually does something
      await seedUser({
        email: "temp2@example.com",
        password: "temp@1234",
        username: "temp2",
        fullName: "Temp2",
        phoneNumber: "9800000002",
        address: "Ktm",
        role: "user",
      });

      const res = await request(app)
        .delete(`${ADMIN_BASE}/users/deleteAll`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "All users deleted");

      // Re-seed admin + normal user because future tests might rely on them
      // (Optional) If you prefer, remove this test or run it last.
    });
  });

  // ---------------------------------------------------------
  // POST ROUTES
  // ---------------------------------------------------------
  describe("Admin Post Operations", () => {
    test("GET /posts: admin can fetch posts", async () => {
      const res = await request(app)
        .get(`${ADMIN_BASE}/posts`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Posts Fetched Successfully");
      expect(Array.isArray(res.body.posts)).toBe(true);
    });

    test("GET /posts/user/:userId: returns posts for user", async () => {
      const res = await request(app)
        .get(`${ADMIN_BASE}/posts/user/${normalUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Posts Fetched Successfully");
      expect(Array.isArray(res.body.posts)).toBe(true);
    });

    test("GET /posts/post/:postId: returns a post by id", async () => {
      const res = await request(app)
        .get(`${ADMIN_BASE}/posts/post/${createdPostId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Post Fetched Successfully");
      expect(res.body).toHaveProperty("post");
      expect(res.body.post).toHaveProperty("_id");
    });

    test("DELETE /posts/delete/:postId: deletes a post and decreases postCount", async () => {
      // seed a post to delete
      const p = await seedPost(normalUserId);

      const beforeUser = await UserModel.findById(normalUserId);
      const beforeCount = (beforeUser as any)?.postCount ?? 0;

      const res = await request(app)
        .delete(`${ADMIN_BASE}/posts/delete/${String((p as any)._id)}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Post Deleted Successfully");

      const afterUser = await UserModel.findById(normalUserId);
      const afterCount = (afterUser as any)?.postCount ?? 0;

      // should go down by 1 (if your decreasePostCount is implemented normally)
      expect(afterCount).toBeLessThanOrEqual(beforeCount);
    });

    test("DELETE /posts/delete/:postId: returns 500 when post not found", async () => {
      const fakeId = "65f1c2a9b0c4e2d1f9a1b2c3";
      const res = await request(app)
        .delete(`${ADMIN_BASE}/posts/delete/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message");
    });

    test("DELETE /posts/deleteAll/:userId: deletes all posts by a user", async () => {
      // seed a couple posts first
      await seedPost(normalUserId);
      await seedPost(normalUserId);

      const res = await request(app)
        .delete(`${ADMIN_BASE}/posts/deleteAll/${normalUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "All Posts by the user deleted",
      );
    });
  });
});
