import type { Request, Response, NextFunction } from "express";

// ✅ mock jsonwebtoken + dotenv (since middleware imports dotenv.config at module load)
jest.mock("dotenv", () => ({
  __esModule: true,
  default: { config: jest.fn() },
  config: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
  },
  verify: jest.fn(),
}));

import jwt from "jsonwebtoken";
import { authMiddleware } from "../../../middleware/auth.middleware";

const verifyMock = (jwt as any).verify as jest.Mock;

function makeRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe("authMiddleware", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, JWT_SECRET_TOKEN: "test_secret" };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test("returns 401 when Authorization header is missing", () => {
    const req = { headers: {} } as unknown as Request;
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No Token Provided" });
    expect(next).not.toHaveBeenCalled();
    expect(verifyMock).not.toHaveBeenCalled();
  });

  test("returns 401 when Authorization header does not start with 'Bearer '", () => {
    const req = {
      headers: { authorization: "Token abc" },
    } as unknown as Request;
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No Token Provided" });
    expect(next).not.toHaveBeenCalled();
    expect(verifyMock).not.toHaveBeenCalled();
  });

  test("returns 401 when token verification fails", () => {
    verifyMock.mockImplementation(() => {
      throw new Error("bad token");
    });

    const req = {
      headers: { authorization: "Bearer badtoken" },
    } as unknown as Request;
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(verifyMock).toHaveBeenCalledWith("badtoken", "test_secret");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("sets req.user and calls next() when token is valid", () => {
    verifyMock.mockReturnValue({ id: "u1", role: "admin" });

    const req = {
      headers: { authorization: "Bearer goodtoken" },
    } as any as Request;
    const res = makeRes();
    const next = jest.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(verifyMock).toHaveBeenCalledWith("goodtoken", "test_secret");
    expect((req as any).user).toEqual({ id: "u1", role: "admin" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
