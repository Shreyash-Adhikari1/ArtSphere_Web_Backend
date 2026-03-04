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

const otherUser = {
  email: "other@example.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "otherUser",
  fullName: "Other User",
  phoneNumber: "9876543222",
  address: "Kathmandu",
};

const noFollowingUser = {
  email: "nofollow@example.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "noFollowUser",
  fullName: "No Follow User",
  phoneNumber: "9876543333",
  address: "Kathmandu",
};

describe("Posts Integration (routes: /api/post/*)", () => {
  let authToken: string;
  let otherToken: string;
  let noFollowingToken: string;

  let userId: string;
  let otherUserId: string;
  let postId: string;

  const imagePath = path.join(__dirname, "assets/test-image.jpg");
  const nonImagePath = path.join(__dirname, "assets/not-image.txt");

  const createPost = async (caption = "Seed post", token = authToken) => {
    const res = await request(app)
      .post("/api/post/create")
      .set("Authorization", `Bearer ${token}`)
      .field("caption", caption)
      .attach("post-images", imagePath);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("post");
    expect(res.body.post).toHaveProperty("_id");
    return res.body.post;
  };

  const loginAndGetToken = async (email: string, password: string) => {
    const loginRes = await request(app).post("/api/user/login").send({
      email,
      password,
    });
    expect(loginRes.body).toHaveProperty("token");
    expect(loginRes.body.token).toBeTruthy();
    return loginRes.body.token as string;
  };

  beforeAll(async () => {
    await UserModel.deleteMany({});
    await PostModel.deleteMany({});

    // Main user
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const createdUser = await UserModel.create({
      ...testUser,
      password: hashedPassword,
    });
    userId = String((createdUser as any)._id);
    authToken = await loginAndGetToken(testUser.email, testUser.password);

    const hashedOther = await bcrypt.hash(otherUser.password, 10);
    const createdOther = await UserModel.create({
      ...otherUser,
      password: hashedOther,
    });
    otherUserId = String((createdOther as any)._id);
    otherToken = await loginAndGetToken(otherUser.email, otherUser.password);

    const hashedNoFollow = await bcrypt.hash(noFollowingUser.password, 10);
    await UserModel.create({
      ...noFollowingUser,
      password: hashedNoFollow,
    });
    noFollowingToken = await loginAndGetToken(
      noFollowingUser.email,
      noFollowingUser.password,
    );

    const post = await createPost("Initial Post For Tests", authToken);
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

    test("should fail with invalid edit body", async () => {
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

    test("should fail editing a post not owned by user", async () => {
      const res = await request(app)
        .patch(`/api/post/edit/${postId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ caption: "Hacked caption" });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message");
    });

    test("should fail editing non-existing postId", async () => {
      const fakeId = "65f1c2a9b0c4e2d1f9a1b2c3";
      const res = await request(app)
        .patch(`/api/post/edit/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ caption: "Edited caption" });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message");
    });
  });

  // ===================== DELETE =====================
  describe("Delete Post", () => {
    test("should fail without token", async () => {
      const tempPost = await createPost("To delete - no token", authToken);
      const res = await request(app).delete(`/api/post/delete/${tempPost._id}`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });

    test("should delete owned post successfully", async () => {
      const tempPost = await createPost("To delete - success", authToken);

      const res = await request(app)
        .delete(`/api/post/delete/${tempPost._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Post Deleted Successfully");
    });

    test("should return 404 for non-existing postId (or 500 depending on service)", async () => {
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

    test("should fail deleting a post not owned by user", async () => {
      const ownedByUserA = await createPost("Owned by A", authToken);

      const res = await request(app)
        .delete(`/api/post/delete/${ownedByUserA._id}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message");
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

    test("getFollowingFeed should return empty array when user follows nobody", async () => {
      const res = await request(app)
        .get("/api/post/posts/following?page=1&limit=10")
        .set("Authorization", `Bearer ${noFollowingToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("posts");
      expect(Array.isArray(res.body.posts)).toBe(true);
      expect(res.body.posts.length).toBe(0);
    });
  });

  // ===================== USER POSTS =====================
  describe("User Posts", () => {
    test("getMyPosts should return posts for logged-in user", async () => {
      const res = await request(app)
        .get("/api/post/posts/my-posts")
        .set("Authorization", `Bearer ${authToken}`);

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

    test("getPostsByUser should return empty posts for a user with no posts", async () => {
      const res = await request(app)
        .get(`/api/post/posts/user/${otherUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("posts");
      expect(Array.isArray(res.body.posts)).toBe(true);
      expect(res.body.posts.length).toBe(0);
    });
  });

  // ===================== LIKE / UNLIKE =====================
  describe("Like / Unlike", () => {
    test("like should fail without token", async () => {
      const res = await request(app).post(`/api/post/like/${postId}`);
      expect(res.status).toBe(401);
    });

    test("like should succeed with token", async () => {
      const temp = await createPost("To like/unlike", authToken);

      const res = await request(app)
        .post(`/api/post/like/${temp._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message", "Post Liked");
    });

    test("unlike should succeed with token", async () => {
      const temp = await createPost("To unlike", authToken);

      // like first
      await request(app)
        .post(`/api/post/like/${temp._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      const res = await request(app)
        .post(`/api/post/unlike/${temp._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message", "Post Unliked");
    });

    test("like twice should fail (already liked)", async () => {
      const temp = await createPost("Double-like", authToken);

      const first = await request(app)
        .post(`/api/post/like/${temp._id}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(first.status).toBe(201);

      const second = await request(app)
        .post(`/api/post/like/${temp._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(second.status).toBe(500);
      expect(second.body).toHaveProperty("message");
    });

    test("unlike without like should fail", async () => {
      const temp = await createPost("Unlike-without-like", authToken);

      const res = await request(app)
        .post(`/api/post/unlike/${temp._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message");
    });

    test("like should fail for non-existing postId", async () => {
      const fakeId = "65f1c2a9b0c4e2d1f9a1b2c3";
      const res = await request(app)
        .post(`/api/post/like/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message");
    });

    test("unlike should fail for non-existing postId", async () => {
      const fakeId = "65f1c2a9b0c4e2d1f9a1b2c3";
      const res = await request(app)
        .post(`/api/post/unlike/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message");
    });
  });
});
