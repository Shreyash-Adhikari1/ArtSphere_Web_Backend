import request from "supertest";
import path from "path";
import bcrypt from "bcrypt";
import app from "../../../app";
import { UserModel } from "../../../features/user/model/user.model";
import { PostModel } from "../../../features/posts/model/post.model";

const testUser = {
  email: "test@example.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "testUser",
  fullName: "Test User",
  phoneNumber: "9876543210",
  address: "Kathmandu",
};

describe("Posts Integration (routes: /api/post/*)", () => {
  let authToken: string;
  let userId: string;
  let postId: string;

  const imagePath = path.join(__dirname, "assets/test-image.jpg");
  const nonImagePath = path.join(__dirname, "assets/not-image.txt");

  const createPost = async (caption = "Seed post") => {
    const res = await request(app)
      .post("/api/post/create")
      .set("Authorization", `Bearer ${authToken}`)
      .field("caption", caption)
      .attach("post-images", imagePath);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("post");
    expect(res.body.post).toHaveProperty("_id");
    return res.body.post;
  };

  beforeAll(async () => {
    await UserModel.deleteMany({});
    await PostModel.deleteMany({});

    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const createdUser = await UserModel.create({
      ...testUser,
      password: hashedPassword,
    });

    userId = String((createdUser as any)._id);

    const loginRes = await request(app).post("/api/user/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginRes.body.token;
    expect(authToken).toBeTruthy();

    const post = await createPost("Initial Post For Tests");
    postId = post._id;
  });

  afterAll(async () => {
    await PostModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  // ===================== CREATE =====================
  describe("Create Post", () => {
    test("should create a post with image upload", async () => {
      const res = await request(app)
        .post("/api/post/create")
        .set("Authorization", `Bearer ${authToken}`)
        .field("caption", "My first test post")
        .attach("post-images", imagePath);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("post");
      expect(res.body.post.caption).toBe("My first test post");
      expect(res.body.post).toHaveProperty("media");
    });

    test("should fail when image is missing", async () => {
      const res = await request(app)
        .post("/api/post/create")
        .set("Authorization", `Bearer ${authToken}`)
        .field("caption", "No image");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Media file is required");
    });

    test("should fail without auth token", async () => {
      const res = await request(app)
        .post("/api/post/create")
        .send({ caption: "No auth" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "No Token Provided");
    });

    test("should fail for non-image file upload", async () => {
      const res = await request(app)
        .post("/api/post/create")
        .set("Authorization", `Bearer ${authToken}`)
        .field("caption", "bad file")
        .attach("post-images", nonImagePath);

      // depends on upload.middleware fileFilter; many setups throw -> 500
      expect([400, 415, 500]).toContain(res.status);
    });

    test("should fail when no fields are provided", async () => {
      const res = await request(app)
        .post("/api/post/create")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Create Post Failed");
    });
  });

  // ===================== EDIT =====================
  describe("Edit Post", () => {
    test("should fail without token", async () => {
      const res = await request(app)
        .patch(`/api/post/edit/${postId}`)
        .send({ caption: "No auth" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });

    test("should fail with invalid edit body (DTO validation)", async () => {
      const res = await request(app)
        .patch(`/api/post/edit/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ caption: 12345 }); // wrong type

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Invalid Edit Data");
      expect(res.body).toHaveProperty("errors");
    });

    test("should edit post successfully", async () => {
      const res = await request(app)
        .patch(`/api/post/edit/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ caption: "Edited caption" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Post Edited Succesfully");
      expect(res.body).toHaveProperty("post");
      expect(res.body.post.caption).toBe("Edited caption");
    });
  });

  // ===================== DELETE =====================
  describe("Delete Post", () => {
    test("should fail without token", async () => {
      const tempPost = await createPost("To delete - no token");
      const res = await request(app).delete(`/api/post/delete/${tempPost._id}`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });

    test("should delete owned post successfully", async () => {
      const tempPost = await createPost("To delete - success");

      const res = await request(app)
        .delete(`/api/post/delete/${tempPost._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Post Deleted Successfully");
    });

    test("should return 404 for non-existing postId", async () => {
      const fakeId = "65f1c2a9b0c4e2d1f9a1b2c3";
      const res = await request(app)
        .delete(`/api/post/delete/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect([404, 500]).toContain(res.status);
      if (res.status === 404) {
        expect(res.body).toHaveProperty(
          "message",
          "Post not found or not owned by user",
        );
      }
    });
  });

  // ===================== FEEDS =====================
  describe("Feeds", () => {
    test("getFeed should fail without token", async () => {
      const res = await request(app).get("/api/post/posts");
      expect(res.status).toBe(401);
    });

    test("getFeed should return posts with token", async () => {
      const res = await request(app)
        .get("/api/post/posts")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("posts");
      expect(Array.isArray(res.body.posts)).toBe(true);
    });

    test("getFollowingFeed should return posts with token + pagination", async () => {
      const res = await request(app)
        .get("/api/post/posts/following?page=1&limit=10")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("posts");
      expect(Array.isArray(res.body.posts)).toBe(true);
    });
  });

  // ===================== USER POSTS =====================
  describe("User Posts", () => {
    test("getMyPosts should return posts for logged-in user", async () => {
      const res = await request(app)
        .get("/api/post/posts/my-posts")
        .set("Authorization", `Bearer ${authToken}`);

      // your controller returns 200 if userId exists (it will because of authMiddleware)
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("posts");
      expect(Array.isArray(res.body.posts)).toBe(true);
    });

    test("getPostsByUser should return posts for given userId", async () => {
      const res = await request(app)
        .get(`/api/post/posts/user/${userId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("posts");
      expect(Array.isArray(res.body.posts)).toBe(true);
    });
  });

  // ===================== LIKE / UNLIKE =====================
  describe("Like / Unlike", () => {
    test("like should fail without token", async () => {
      const res = await request(app).post(`/api/post/like/${postId}`);
      expect(res.status).toBe(401);
    });

    test("like should succeed with token", async () => {
      const res = await request(app)
        .post(`/api/post/like/${postId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message", "Post Liked");
    });

    test("unlike should succeed with token", async () => {
      const res = await request(app)
        .post(`/api/post/unlike/${postId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message", "Post Unliked");
    });
  });
});
