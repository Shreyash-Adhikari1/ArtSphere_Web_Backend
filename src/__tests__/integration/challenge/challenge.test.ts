import request from "supertest";
import path from "path";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import app from "../../../app";
import { UserModel } from "../../../features/user/model/user.model";
import { ChallengeModel } from "../../../features/challenge/model/challenge.model";

const userA = {
  email: "challengeA@test.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "challengeUserA",
  fullName: "Challenge User A",
  phoneNumber: "9800000011",
  address: "Kathmandu",
  role: "user",
};

const userB = {
  email: "challengeB@test.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "challengeUserB",
  fullName: "Challenge User B",
  phoneNumber: "9800000012",
  address: "Kathmandu",
  role: "user",
};

describe("Challenge Integration (routes: /api/challenge/*)", () => {
  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let userBId: string;

  let challengeId: string;

  const imagePath = path.join(__dirname, "assets/test-image.jpg");

  const login = async (email: string, password: string) => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email, password });
    expect(res.body.token).toBeTruthy();
    return res.body.token as string;
  };

  const createChallengeAsA = async (
    overrides?: Partial<Record<string, any>>,
  ) => {
    const endsAt = overrides?.endsAt ?? "2026-03-05";

    const res = await request(app)
      .post("/api/challenge/create")
      .set("Authorization", `Bearer ${tokenA}`)
      .field("challengeTitle", overrides?.challengeTitle ?? "My Test Challenge")
      .field(
        "challengeDescription",
        overrides?.challengeDescription ?? "Challenge description",
      )
      .field("endsAt", endsAt)
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
    return String(id);
  };

  beforeAll(async () => {
    await UserModel.deleteMany({});
    await ChallengeModel.deleteMany({});

    const hashA = await bcrypt.hash(userA.password, 10);
    const hashB = await bcrypt.hash(userB.password, 10);

    const createdA = await UserModel.create({ ...userA, password: hashA });
    const createdB = await UserModel.create({ ...userB, password: hashB });

    userAId = String((createdA as any)._id);
    userBId = String((createdB as any)._id);

    tokenA = await login(userA.email, userA.password);
    tokenB = await login(userB.email, userB.password);

    // seed one challenge by A
    challengeId = await createChallengeAsA({
      challengeTitle: "Seed Challenge",
    });
  });

  afterAll(async () => {
    await ChallengeModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  // ===================== GET ALL (PUBLIC) =====================

  test("GET /getall should return list (public)", async () => {
    const res = await request(app).get("/api/challenge/getall");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Challenges fetched successfully",
    );
    expect(Array.isArray(res.body.challenges)).toBe(true);
  });

  test("POST /create should fail without token", async () => {
    const res = await request(app).post("/api/challenge/create").send({});

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  test("POST /create should fail when DTO invalid (missing required fields)", async () => {
    const res = await request(app)
      .post("/api/challenge/create")
      .set("Authorization", `Bearer ${tokenA}`)
      .field("challengeTitle", "") // invalid
      .attach("challenge-images", imagePath);

    expect([400, 500]).toContain(res.status);
  });

  test("POST /create should fail when endsAt is in the past (service validation)", async () => {
    const res = await request(app)
      .post("/api/challenge/create")
      .set("Authorization", `Bearer ${tokenA}`)
      .field("challengeTitle", "Past Challenge")
      .field("challengeDescription", "desc")
      .field("endsAt", "2020-01-01")
      .attach("challenge-images", imagePath);

    expect(res.status).toBe(500);
  });

  test("POST /create should create a challenge (happy path)", async () => {
    const id = await createChallengeAsA({
      challengeTitle: "Created from test",
    });
    expect(id).toBeTruthy();
  });

  test("GET /getmy should fail without token", async () => {
    const res = await request(app).get("/api/challenge/getmy");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  test("GET /getmy should return my challenges (token)", async () => {
    const res = await request(app)
      .get("/api/challenge/getmy")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Challenges by user fetched successfully",
    );
    expect(Array.isArray(res.body.challenges)).toBe(true);
  });

  test("GET /:challengeId should fail without token", async () => {
    const res = await request(app).get(`/api/challenge/${challengeId}`);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  test("GET /:challengeId should return challenge by id (token)", async () => {
    const res = await request(app)
      .get(`/api/challenge/${challengeId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Challenge fetched successfully",
    );
    expect(res.body).toHaveProperty("challenge");
  });

  test("GET /:challengeId should return 500/404 for non-existent challenge", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .get(`/api/challenge/${fakeId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect([404, 500]).toContain(res.status);
  });

  test("PATCH /edit/:challengeId should fail without token", async () => {
    const res = await request(app)
      .patch(`/api/challenge/edit/${challengeId}`)
      .send({ challengeTitle: "No token edit" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  test("PATCH /edit/:challengeId should fail with invalid edit body (DTO)", async () => {
    const res = await request(app)
      .patch(`/api/challenge/edit/${challengeId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ challengeTitle: 12345 }); // invalid type

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Bad Request || Invalid Edit Data",
    );
    expect(res.body).toHaveProperty("errors");
  });

  test("PATCH /edit/:challengeId should edit successfully (owner)", async () => {
    const res = await request(app)
      .patch(`/api/challenge/edit/${challengeId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ challengeTitle: "Updated Challenge Title" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Challenge Edited Succesfully");
    expect(res.body).toHaveProperty("challenge");
  });

  test("PATCH /edit/:challengeId should fail when editing someone else's challenge (403 in service -> 500 in controller)", async () => {
    const res = await request(app)
      .patch(`/api/challenge/edit/${challengeId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ challengeTitle: "Hacked Title" });

    expect(res.status).toBe(500);
  });

  test("PATCH /edit/:challengeId should fail when challenge is expired (service branch)", async () => {
    const tempId = await createChallengeAsA({ challengeTitle: "Will expire" });

    // Force endsAt to past
    await ChallengeModel.findByIdAndUpdate(tempId, {
      endsAt: new Date("2020-01-01"),
    });

    const res = await request(app)
      .patch(`/api/challenge/edit/${tempId}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ challengeTitle: "Edit after expiry" });

    expect(res.status).toBe(500);
  });

  test("DELETE /delete/:challengeId should fail without token", async () => {
    const res = await request(app).delete(
      `/api/challenge/delete/${challengeId}`,
    );
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  test("DELETE /delete/:challengeId should fail deleting someone else's challenge (403 in service -> 500 in controller)", async () => {
    const res = await request(app)
      .delete(`/api/challenge/delete/${challengeId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(500);
  });

  test("DELETE /delete/:challengeId should delete successfully (owner)", async () => {
    const tempId = await createChallengeAsA({ challengeTitle: "To delete" });

    const res = await request(app)
      .delete(`/api/challenge/delete/${tempId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Challenge Deleted Successfully",
    );
  });

  // ===================== DELETE ALL MY CHALLENGES =====================

  test("DELETE /delete/all-my-challenges should fail without token", async () => {
    const res = await request(app).delete(
      "/api/challenge/delete/all-my-challenges",
    );
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });
});
