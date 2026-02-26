import request from "supertest";
import path from "path";
import bcrypt from "bcrypt";
import app from "../../../app";

import { UserModel } from "../../../features/user/model/user.model";
import {
  PostCommentModel,
  PostModel,
} from "../../../features/posts/model/post.model";

// import { CommentModel }

const testUser = {
  email: "test@example.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "testUser",
  fullName: "Test User",
  phoneNumber: "9876543210",
  address: "Kathmandu",
};

describe("Comment Integration (routes: /api/comment/*)", () => {
  let authToken: string;
  let postId: string;
  let commentId: string;

  const imagePath = path.join(__dirname, "../post/assets/test-image.jpg");

  const createPost = async () => {
    const res = await request(app)
      .post("/api/post/create")
      .set("Authorization", `Bearer ${authToken}`)
      .field("caption", "Post for comment tests")
      .attach("post-images", imagePath);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("post");
    expect(res.body.post).toHaveProperty("_id");

    return res.body.post._id as string;
  };

  const createComment = async (pid: string, text = "Nice post!") => {
    const res = await request(app)
      .post(`/api/comment/create/${pid}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ commentText: text });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Comment Successful");
    expect(res.body).toHaveProperty("comment");

    const id = res.body.comment?._id;

    expect(id).toBeTruthy();
    return id as string;
  };

  beforeAll(async () => {
    await UserModel.deleteMany({});
    await PostModel.deleteMany({});
    await PostCommentModel.deleteMany({});

    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await UserModel.create({ ...testUser, password: hashedPassword });

    const loginRes = await request(app).post("/api/user/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginRes.body.token;
    expect(authToken).toBeTruthy();

    postId = await createPost();
    commentId = await createComment(postId);
  });

  afterAll(async () => {
    await PostModel.deleteMany({});
    await UserModel.deleteMany({});
    await PostCommentModel.deleteMany({});
  });

  // ===================== CREATE COMMENT =====================

  test("should create a comment (authorized)", async () => {
    const res = await request(app)
      .post(`/api/comment/create/${postId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ commentText: "Another comment" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Comment Successful");
    expect(res.body).toHaveProperty("comment");
  });

  test("should fail to create comment without token", async () => {
    const res = await request(app)
      .post(`/api/comment/create/${postId}`)
      .send({ comment: "No token comment" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  test("should fail to create comment with invalid body (DTO)", async () => {
    const res = await request(app)
      .post(`/api/comment/create/${postId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ comment: 12345 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid Details");
  });

  // ===================== GET COMMENTS FOR POST =====================

  test("should get comments for a post (authorized)", async () => {
    const res = await request(app)
      .get(`/api/comment/post/${postId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Comments Fetched Successfully");
    expect(res.body).toHaveProperty("comments");
    expect(Array.isArray(res.body.comments)).toBe(true);
  });

  test("should fail to get comments without token", async () => {
    const res = await request(app).get(`/api/comment/post/${postId}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  // ===================== LIKE / UNLIKE COMMENT =====================

  test("should like a comment", async () => {
    const res = await request(app)
      .post(`/api/comment/like/${commentId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Commented Liked");
  });

  test("should unlike a comment", async () => {
    const res = await request(app)
      .post(`/api/comment/unlike/${commentId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Commented Unliked");
  });

  // ===================== DELETE COMMENT =====================

  test("should fail to delete comment without token", async () => {
    const res = await request(app).delete(`/api/comment/delete/${commentId}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  test("should delete a comment (owned by user)", async () => {
    const freshCommentId = await createComment(postId, "Comment to delete");

    const res = await request(app)
      .delete(`/api/comment/delete/${freshCommentId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty(
      "message",
      "Commented Deleted Successfully",
    );
  });
});
