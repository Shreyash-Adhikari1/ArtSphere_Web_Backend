import request from "supertest";
import path from "path";
import bcrypt from "bcrypt";
import app from "../../../app";
import { UserModel } from "../../../features/user/model/user.model";
import { ChallengeModel } from "../../../features/challenge/model/challenge.model";

const testUser = {
  email: "challenge@test.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "challengeUser",
  fullName: "Challenge User",
  phoneNumber: "9800000011",
  address: "Kathmandu",
};

describe("Challenge Integration", () => {
  let authToken: string;
  let challengeId: string;

  const imagePath = path.join(__dirname, "assets/test-image.jpg");

  beforeAll(async () => {
    await UserModel.deleteMany({});

    await ChallengeModel.deleteMany({});

    const hashed = await bcrypt.hash(testUser.password, 10);
    await UserModel.create({ ...testUser, password: hashed });

    const loginRes = await request(app).post("/api/user/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginRes.body.token;
    expect(authToken).toBeTruthy();
  });

  afterAll(async () => {
    await ChallengeModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  // Helper to create a challenge once
  const createChallenge = async () => {
    const res = await request(app)
      .post("/api/challenge/create")
      .set("Authorization", `Bearer ${authToken}`)
      .field("challengeTitle", "My Test Challenge")
      .field("challengeDescription", "Challenge description")
      .field("endsAt", "2026-03-05")
      .attach("challenge-images", imagePath);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty(
      "message",
      "challenge created successfully",
    );
    expect(res.body).toHaveProperty("challenge");

    const id =
      res.body.challenge?._id ??
      res.body.challenge?.id ??
      res.body.challenge?._doc?._id;

    expect(id).toBeTruthy();
    return id as string;
  };

  // ===================== GET ALL (PUBLIC) =====================

  test("should get all challenges", async () => {
    const res = await request(app).get("/api/challenge/getall");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Challenges fetched successfully",
    );
    expect(res.body).toHaveProperty("challenges");
    expect(Array.isArray(res.body.challenges)).toBe(true);
  });

  // ===================== CREATE =====================

  test("should fail creating challenge without token", async () => {
    const res = await request(app).post("/api/challenge/create").send({});

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  test("should fail creating challenge with invalid body", async () => {
    const res = await request(app)
      .post("/api/challenge/create")
      .set("Authorization", `Bearer ${authToken}`)
      .field("challengTitle", "")
      .field("endsAt", "2026-03-06")
      .attach("challenge-images", imagePath);

    expect(res.status).toBe(500);
  });

  test("should create a challenge", async () => {
    challengeId = await createChallenge();
  });

  // ===================== GET MY (PROTECTED) =====================

  test("should get my challenges", async () => {
    if (!challengeId) challengeId = await createChallenge();

    const res = await request(app)
      .get("/api/challenge/getmy")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Challenges by user fetched successfully",
    );
    expect(res.body).toHaveProperty("challenges");
    expect(Array.isArray(res.body.challenges)).toBe(true);
  });

  test("should fail getmy without token", async () => {
    const res = await request(app).get("/api/challenge/getmy");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  // ===================== GET BY ID (PROTECTED) =====================

  test("should get challenge by id (authorized)", async () => {
    if (!challengeId) challengeId = await createChallenge();

    const res = await request(app)
      .get(`/api/challenge/${challengeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Challenge fetched successfully",
    );
    expect(res.body).toHaveProperty("challenge");
  });

  // ===================== EDIT =====================

  test("should edit challenge successfully (authorized)", async () => {
    if (!challengeId) challengeId = await createChallenge();

    // Replace fields with your real EditChallengeDTO keys
    const res = await request(app)
      .patch(`/api/challenge/edit/${challengeId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ challengeTitle: "Updated Challenge Title" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Challenge Edited Succesfully");
    expect(res.body).toHaveProperty("challenge");
  });

  // ===================== DELETE =====================

  test("should delete challenge successfully (authorized)", async () => {
    const tempId = await createChallenge();

    const res = await request(app)
      .delete(`/api/challenge/delete/${tempId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Challenge Deleted Successfully",
    );
  });
});
