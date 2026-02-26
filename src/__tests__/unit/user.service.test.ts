// ---- Mocks ----
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("../../config/email", () => ({
  sendEmail: jest.fn(),
}));

// Because UserService does: const userRepository = new UserRepository();
const repoMock = {
  findByEmailOrUsername: jest.fn(),
  createUser: jest.fn(),
  getUserWithPassword: jest.fn(),
  getUserById: jest.fn(),
  getAllUsers: jest.fn(),
  getUserByUsername: jest.fn(),
  deleteUser: jest.fn(),
  updateUser: jest.fn(),
  getUserByEmail: jest.fn(),
};

jest.mock("../../features/user/repository/user.repository", () => ({
  UserRepository: jest.fn().mockImplementation(() => repoMock),
}));

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../config/email";
import { UserService } from "../../features/user/service/user.service";

const hashMock = bcrypt.hash as unknown as jest.Mock;
const compareMock = bcrypt.compare as unknown as jest.Mock;

const jwtSignMock = jwt.sign as unknown as jest.Mock;
const jwtVerifyMock = jwt.verify as unknown as jest.Mock;

const sendEmailMock = sendEmail as unknown as jest.Mock;

describe("UserService unit tests", () => {
  let service: UserService;

  const makeUserDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? "userId123",
      role: overrides.role ?? "user",
      email: overrides.email ?? "test@example.com",
      username: overrides.username ?? "testUser",
      password: overrides.password ?? "hashed",
      __v: 0,
      fullName: overrides.fullName ?? "Test User",
    };

    return {
      ...base,
      toObject: () => ({ ...base }),
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET_TOKEN = "testsecret";
    process.env.CLIENT_URL = "http://localhost:3000";
    service = new UserService();
  });

  test("createUser: throws if email/username already exists", async () => {
    repoMock.findByEmailOrUsername.mockResolvedValue(makeUserDoc());

    await expect(
      service.createUser({
        fullName: "A",
        username: "u",
        email: "a@a.com",
        password: "p",
        phoneNumber: "9",
        address: "k",
        confirmPassword: "p",
      } as any),
    ).rejects.toThrow("User with this email or username already exists");
  });

  test("createUser: hashes password, lowercases email, returns sanitized user", async () => {
    repoMock.findByEmailOrUsername.mockResolvedValue(null);
    hashMock.mockResolvedValue("hashed_pw");

    const createdUser = makeUserDoc({
      email: "a@a.com",
      password: "hashed_pw",
    });
    repoMock.createUser.mockResolvedValue(createdUser);

    const out = await service.createUser({
      fullName: "A",
      username: "u",
      email: "A@A.COM",
      password: "p",
      phoneNumber: "9",
      address: "k",
      confirmPassword: "p",
    } as any);

    expect(hashMock).toHaveBeenCalledWith("p", 10);
    expect(repoMock.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "a@a.com",
        password: "hashed_pw",
      }),
    );

    // sanitize removes password and __v
    expect((out as any).password).toBeUndefined();
    expect((out as any).__v).toBeUndefined();
    expect((out as any).email).toBe("a@a.com");
  });

  test("loginUser: throws Invalid credentials if user not found", async () => {
    repoMock.findByEmailOrUsername.mockResolvedValue(null);

    await expect(service.loginUser("x@x.com", "pw")).rejects.toThrow(
      "Invalid credentials",
    );
  });

  test("loginUser: throws Authentication failed if password-select fetch fails", async () => {
    repoMock.findByEmailOrUsername.mockResolvedValue(
      makeUserDoc({ _id: "u1" }),
    );
    repoMock.getUserWithPassword.mockResolvedValue(null);

    await expect(service.loginUser("x@x.com", "pw")).rejects.toThrow(
      "Authentication failed",
    );
  });

  test("loginUser: throws Invalid credentials when password mismatch", async () => {
    const user = makeUserDoc({ _id: "u1" });
    repoMock.findByEmailOrUsername.mockResolvedValue(user);
    repoMock.getUserWithPassword.mockResolvedValue(
      makeUserDoc({ _id: "u1", password: "hashed" }),
    );
    compareMock.mockResolvedValue(false);

    await expect(service.loginUser("x@x.com", "pw")).rejects.toThrow(
      "Invalid credentials",
    );
  });

  test("loginUser: returns token and sanitized user on success", async () => {
    const user = makeUserDoc({ _id: "u1", role: "user" });
    repoMock.findByEmailOrUsername.mockResolvedValue(user);
    repoMock.getUserWithPassword.mockResolvedValue(
      makeUserDoc({ _id: "u1", password: "hashed" }),
    );
    compareMock.mockResolvedValue(true);
    jwtSignMock.mockReturnValue("jwt_token");

    const out = await service.loginUser("x@x.com", "pw");

    expect(jwtSignMock).toHaveBeenCalledWith(
      { id: "u1", role: "user" },
      "testsecret",
      { expiresIn: "10d" },
    );
    expect(out.token).toBe("jwt_token");
    expect((out.user as any).password).toBeUndefined();
  });

  test("updateUser: throws User not found if user does not exist", async () => {
    repoMock.getUserById.mockResolvedValue(null);

    await expect(
      service.updateUser("u1", { fullName: "X" } as any),
    ).rejects.toThrow("User not found");
  });

  test("updateUser: throws collision error if email/username already in use by another user", async () => {
    repoMock.getUserById.mockResolvedValue(makeUserDoc({ _id: "u1" }));
    repoMock.findByEmailOrUsername.mockResolvedValue(
      makeUserDoc({ _id: "u2" }),
    );

    await expect(
      service.updateUser("u1", { email: "x@x.com" } as any),
    ).rejects.toThrow("Email or username already in use");
  });

  test("getAllUsers: calls repo with skip/limit and sanitizes results", async () => {
    repoMock.getAllUsers.mockResolvedValue([
      makeUserDoc({ _id: "u1" }),
      makeUserDoc({ _id: "u2" }),
    ]);

    const out = await service.getAllUsers(2, 10); // page 2 => skip 10
    expect(repoMock.getAllUsers).toHaveBeenCalledWith(10, 10);

    expect(out).toHaveLength(2);
    expect((out[0] as any).password).toBeUndefined();
    expect((out[0] as any).__v).toBeUndefined();
  });

  test("resetPassword: throws HttpError(400) Invalid or expired token when jwt.verify fails", async () => {
    jwtVerifyMock.mockImplementation(() => {
      throw new Error("bad token");
    });

    await expect(service.resetPassword("bad", "newpw")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid or expired token",
    });
  });

  test("sendResetPasswordEmail: sends email with reset link", async () => {
    const user = makeUserDoc({ _id: "u1", email: "test@example.com" });
    repoMock.getUserByEmail.mockResolvedValue(user);
    jwtSignMock.mockReturnValue("reset_token");

    const result = await service.sendResetPasswordEmail("test@example.com");

    expect(jwtSignMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledWith(
      "test@example.com",
      "Password Reset",
      expect.stringContaining("token=reset_token"),
    );
    expect(result).toBe(user);
  });
});
