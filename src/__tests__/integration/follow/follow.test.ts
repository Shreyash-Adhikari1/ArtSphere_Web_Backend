import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../../app";
import { UserModel } from "../../../features/user/model/user.model";
import { FollowModel } from "../../../features/follow/model/follow.model";

const userA = {
  email: "a@example.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "userA",
  fullName: "User A",
  phoneNumber: "9800000001",
  address: "Kathmandu",
};

const userB = {
  email: "b@example.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "userB",
  fullName: "User B",
  phoneNumber: "9800000002",
  address: "Kathmandu",
};

const userC = {
  email: "c@example.com",
  password: "test@1234",
  confirmPassword: "test@1234",
  username: "userC",
  fullName: "User C",
  phoneNumber: "9800000003",
  address: "Kathmandu",
};

describe("Follow Integration (routes: /api/follow/*)", () => {
  let tokenA: string;
  let tokenB: string;
  let tokenC: string;

  let userAId: string;
  let userBId: string;
  let userCId: string;

  beforeAll(async () => {
    await UserModel.deleteMany({});
    // if (FollowModel) await FollowModel.deleteMany({});

    const hashA = await bcrypt.hash(userA.password, 10);
    const hashB = await bcrypt.hash(userB.password, 10);
    const hashC = await bcrypt.hash(userC.password, 10);

    const createdA = await UserModel.create({ ...userA, password: hashA });
    const createdB = await UserModel.create({ ...userB, password: hashB });
    const createdC = await UserModel.create({ ...userC, password: hashC });

    userAId = String((createdA as any)._id);
    userBId = String((createdB as any)._id);
    userCId = String((createdC as any)._id);

    const loginA = await request(app).post("/api/user/login").send({
      email: userA.email,
      password: userA.password,
    });
    tokenA = loginA.body.token;
    expect(tokenA).toBeTruthy();

    const loginB = await request(app).post("/api/user/login").send({
      email: userB.email,
      password: userB.password,
    });
    tokenB = loginB.body.token;
    expect(tokenB).toBeTruthy();

    const loginC = await request(app).post("/api/user/login").send({
      email: userC.email,
      password: userC.password,
    });
    tokenC = loginC.body.token;
    expect(tokenC).toBeTruthy();
  });

  afterAll(async () => {
    // if (FollowModel) await FollowModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  // ---------------- AUTH MIDDLEWARE BRANCHES ----------------

  test("should fail follow without token", async () => {
    const res = await request(app).post(`/api/follow/follow/${userBId}`);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  test("should fail with invalid token (expired/invalid)", async () => {
    const res = await request(app)
      .get(`/api/follow/is-following/${userBId}`)
      .set("Authorization", `Bearer totally_invalid_token`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid or expired token");
  });

  // ---------------- FOLLOW / UNFOLLOW EDGE CASES ----------------

  test("follow self should fail (service rule)", async () => {
    const res = await request(app)
      .post(`/api/follow/follow/${userAId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    // controller catches and returns 500 with the error message
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message");
    expect(String(res.body.message).toLowerCase()).toContain("yourself");
  });

  test("follow with invalid ObjectId should fail (Types.ObjectId throws)", async () => {
    const res = await request(app)
      .post(`/api/follow/follow/not-a-valid-objectid`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("message");
  });

  test("is-following should be false before following", async () => {
    const res = await request(app)
      .get(`/api/follow/is-following/${userBId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("isFollowing", false);
  });

  test("should follow a user successfully", async () => {
    const res = await request(app)
      .post(`/api/follow/follow/${userBId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "User Followed Successfully");
    expect(res.body).toHaveProperty("data");
  });

  test("follow same user twice should fail (already followed)", async () => {
    const res = await request(app)
      .post(`/api/follow/follow/${userBId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(500);
    expect(String(res.body.message).toLowerCase()).toContain("already");
  });

  test("is-following should be true after following", async () => {
    const res = await request(app)
      .get(`/api/follow/is-following/${userBId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("isFollowing", true);
  });

  test("unfollow should succeed", async () => {
    const res = await request(app)
      .post(`/api/follow/unfollow/${userBId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "User Unfollowed Successfully");
  });

  test("unfollow when NOT following should fail (service rule)", async () => {
    const res = await request(app)
      .post(`/api/follow/unfollow/${userBId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(500);
    expect(String(res.body.message).toLowerCase()).toContain("do not follow");
  });

  test("viewer flag: A sees B followers and marks C as isFollowedByMe=true", async () => {
    // Ensure state: C follows B
    await request(app)
      .post(`/api/follow/follow/${userBId}`)
      .set("Authorization", `Bearer ${tokenC}`);

    // Ensure state: A follows C
    await request(app)
      .post(`/api/follow/follow/${userCId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    const res = await request(app)
      .get(`/api/follow/${userBId}/followers`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);

    // Find C inside followers list
    const rowForC = res.body.data.find((r: any) => {
      const followerId = String(r.follower?._id ?? r.follower);
      return followerId === userCId;
    });

    expect(rowForC).toBeTruthy();
    expect(rowForC).toHaveProperty("isFollowedByMe", true);
  });

  test("GET /following returns my following list", async () => {
    const res = await request(app)
      .get("/api/follow/following")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Following Fetched Successfully",
    );
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /followers returns my followers list", async () => {
    const res = await request(app)
      .get("/api/follow/followers")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Followers Fetched Successfully",
    );
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /:userId/following returns a user's following list", async () => {
    // make B follow C, so B has following
    await request(app)
      .post(`/api/follow/follow/${userCId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    const res = await request(app)
      .get(`/api/follow/${userBId}/following`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Users Following Fetched Successfully",
    );
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
