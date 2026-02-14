import request from "supertest";
import path from "path";
import bcrypt from "bcrypt";
import { UserModel } from "../../../features/user/model/user.model";
import { PostModel } from "../../../features/posts/model/post.model";
import app from "../../../app";

const testUser = {
  email: "test@example.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "testUser",
  fullName: "Test User",
  phoneNumber: "9876543210",
  address: "Kathmandu",
};

describe("Post creation", () => {
  let authToken: string;

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash(testUser.password, 10);

    await UserModel.create({
      ...testUser,
      password: hashedPassword,
    });

    // Login to get auth token
    const loginRes = await request(app).post("/api/user/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup DB after test
    await UserModel.deleteMany({});
    await PostModel.deleteMany({});
  });

  test("should create a post with image upload", async () => {
    // Use a small test image in your __tests__/integration/post/assets folder
    const imagePath = path.join(__dirname, "assets/test-image.jpg");

    const response = await request(app)
      .post("/api/post/create")
      .set("Authorization", `Bearer ${authToken}`)
      .field("caption", "My first test post")
      .attach("post-images", imagePath); // matches your Multer field

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("post");
    expect(response.body.post).toHaveProperty("media");
    expect(response.body.post.caption).toBe("My first test post");
  });

  test("should fail when image is missing", async () => {
    const response = await request(app)
      .post("/api/post/create")
      .set("Authorization", `Bearer ${authToken}`)
      .field("caption", "No image");

    expect(response.status).toBe(400);
  });

  test("should fail without auth token", async () => {
    const response = await request(app)
      .post("/api/post/create")
      .send({ caption: "No auth" });

    expect(response.status).toBe(401);
  });

  test("should fail for non-image file", async () => {
    const filePath = path.join(__dirname, "assets/not-image.txt");

    const response = await request(app)
      .post("/api/post/create")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("post-images", filePath);

    expect(response.status).toBe(500);
  });
});

describe("Post Update", () => {});
