import request from "supertest";
import path from "path";
import bcrypt from "bcrypt";
import app from "../../../app";

import { UserModel } from "../../../features/user/model/user.model";
import { PostModel } from "../../../features/posts/model/post.model";
import { ChallengeModel } from "../../../features/challenge/model/challenge.model";
import { SubmissionModel } from "../../../features/submission/model/submission.model";

const testUser = {
  email: "submit@test.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "submitUser",
  fullName: "Submit User",
  phoneNumber: "9800000099",
  address: "Kathmandu",
};

describe("Submission Integration (routes: /api/submit/*)", () => {
  let authToken: string;
  let postId: string;
  let challengeId: string;
  let submissionId: string;

  const postImagePath = path.join(__dirname, "../post/assets/test-image.jpg"); // adjust if needed
  const submissionImagePath = path.join(__dirname, "assets/test-image.jpg"); // put image here

  const createPost = async (caption = "Post for submission tests") => {
    const res = await request(app)
      .post("/api/post/create")
      .set("Authorization", `Bearer ${authToken}`)
      .field("caption", caption)
      .attach("post-images", postImagePath);

    expect(res.status).toBe(200);
    const id = res.body?.post?._id;
    expect(id).toBeTruthy();
    return id as string;
  };

  const createChallenge = async (title = "Challenge for submissions") => {
    const res = await request(app)
      .post("/api/challenge/create")
      .set("Authorization", `Bearer ${authToken}`)
      .field("challengeTitle", title)
      .field("challengeDescription", "Challenge description")
      .field("endsAt", "2026-03-05")
      .attach("challenge-images", submissionImagePath);

    expect(res.status).toBe(201);
    const id = res.body?.challenge?._id;
    expect(id).toBeTruthy();
    return id as string;
  };

  beforeAll(async () => {
    await UserModel.deleteMany({});
    await PostModel.deleteMany({});
    await ChallengeModel.deleteMany({});
    await SubmissionModel.deleteMany({});

    const hashed = await bcrypt.hash(testUser.password, 10);
    await UserModel.create({ ...testUser, password: hashed });

    const loginRes = await request(app).post("/api/user/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginRes.body.token;
    expect(authToken).toBeTruthy();

    postId = await createPost();
    challengeId = await createChallenge();
  });

  afterAll(async () => {
    await SubmissionModel.deleteMany({});
    await ChallengeModel.deleteMany({});
    await PostModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  test("existing submit: should fail without token", async () => {
    const res = await request(app)
      .post(`/api/submit/existing/${challengeId}`)
      .send({ postId });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  test("existing submit: should fail when postId missing", async () => {
    const res = await request(app)
      .post(`/api/submit/existing/${challengeId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "postId missing");
  });

  test("existing submit: should submit an existing post to a challenge", async () => {
    const res = await request(app)
      .post(`/api/submit/existing/${challengeId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ postId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "Submitted to challenge");
    expect(res.body).toHaveProperty("submission");

    submissionId =
      res.body.submission?._id ??
      res.body.submission?.id ??
      res.body.submission?._doc?._id;

    expect(submissionId).toBeTruthy();
  });

  test("existing submit: should block second submission for same challenge", async () => {
    const anotherPostId = await createPost("Another post");
    const res = await request(app)
      .post(`/api/submit/existing/${challengeId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ postId: anotherPostId });

    expect([400, 500]).toContain(res.status);
    expect(res.body).toHaveProperty(
      "message",
      "You can only submit one post per challenge",
    );
  });

  test("get submissions: should fetch submissions for a challenge", async () => {
    const res = await request(app)
      .get(`/api/submit/get/${challengeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Submissions fetched successfully",
    );
    expect(res.body).toHaveProperty("submission");
    expect(Array.isArray(res.body.submission)).toBe(true);
  });

  test("get submissions: should fail without token", async () => {
    const res = await request(app).get(`/api/submit/get/${challengeId}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  test("new submit: should fail when media is missing", async () => {
    const newChallengeId = await createChallenge(
      "Challenge for new-submit missing media",
    );

    const res = await request(app)
      .post(`/api/submit/new/${newChallengeId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ caption: "No media" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "Media file is required");
  });

  test("new submit: should reject invalid challengeId format", async () => {
    const invalidChallengeId = "not-an-objectid";

    const res = await request(app)
      .post(`/api/submit/new/${invalidChallengeId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .field("caption", "Invalid challenge id")
      .attach("challenge-submissions", submissionImagePath);

    expect([400, 500]).toContain(res.status);
    expect(res.body).toHaveProperty("message", "Invalid challengeId");
  });
});
