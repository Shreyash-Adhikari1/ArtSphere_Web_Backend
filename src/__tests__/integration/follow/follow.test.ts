import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../../app";
import { UserModel } from "../../../features/user/model/user.model";

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

describe("Follow Integration (routes: /api/follow/*)", () => {
  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    await UserModel.deleteMany({});

    const hashA = await bcrypt.hash(userA.password, 10);
    const hashB = await bcrypt.hash(userB.password, 10);

    const createdA = await UserModel.create({ ...userA, password: hashA });
    const createdB = await UserModel.create({ ...userB, password: hashB });

    userAId = String((createdA as any)._id);
    userBId = String((createdB as any)._id);

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
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
  });

  // 1) auth required
  test("should fail follow without token", async () => {
    const res = await request(app).post(`/api/follow/follow/${userBId}`);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "No Token Provided");
  });

  // 2) initial is-following should be false
  test("is-following should be false before following", async () => {
    const res = await request(app)
      .get(`/api/follow/is-following/${userBId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("isFollowing");
    expect(res.body.isFollowing).toBe(false);
  });

  // 3) follow should succeed
  test("should follow a user successfully", async () => {
    const res = await request(app)
      .post(`/api/follow/follow/${userBId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "User Followed Successfully");
    expect(res.body).toHaveProperty("data");
    // structure from controller:
    expect(res.body.data).toHaveProperty("follower");
    expect(res.body.data).toHaveProperty("following");
  });

  // 4) is-following should become true after follow
  test("is-following should be true after following", async () => {
    const res = await request(app)
      .get(`/api/follow/is-following/${userBId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.isFollowing).toBe(true);
  });

  // 5) my following should return 200
  test("should get my following list", async () => {
    const res = await request(app)
      .get("/api/follow/following")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Following Fetched Successfully",
    );
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 6) my followers (for B) should include A after A followed B
  test("user B should have followers after being followed", async () => {
    const res = await request(app)
      .get("/api/follow/followers")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Followers Fetched Successfully",
    );
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 7) users followers endpoint should return 200
  test("should get followers of a specific user", async () => {
    const res = await request(app)
      .get(`/api/follow/${userBId}/followers`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Users Followers Fetched Successfully",
    );
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 8) unfollow should succeed and is-following should be false again
  test("should unfollow successfully and status becomes false", async () => {
    const unfollowRes = await request(app)
      .post(`/api/follow/unfollow/${userBId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body).toHaveProperty(
      "message",
      "User Unfollowed Successfully",
    );

    const statusRes = await request(app)
      .get(`/api/follow/is-following/${userBId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.isFollowing).toBe(false);
  });
});
