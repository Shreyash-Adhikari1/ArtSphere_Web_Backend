// src/__tests__/unit/database/db.test.ts

describe("connectDB (src/database/db.ts)", () => {
  const ORIGINAL_ENV = process.env;

  let exitSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules(); // important: clears module cache
    process.env = { ...ORIGINAL_ENV }; // reset env per test

    exitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test("calls process.exit when MONGO_URL is missing", async () => {
    // ✅ stop dotenv from modifying env at import time
    jest.doMock("dotenv", () => ({
      __esModule: true,
      default: { config: jest.fn() },
      config: jest.fn(),
    }));

    // ✅ mock mongoose default export shape
    const connectMock = jest.fn();
    jest.doMock("mongoose", () => ({
      __esModule: true,
      default: { connect: connectMock },
    }));

    delete process.env.MONGO_URL;

    const { default: connectDB } = await import("../../../database/db");
    await connectDB();

    expect(errorSpy).toHaveBeenCalledWith(
      "FATAL ERROR: DB_URL is not defined.",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(connectMock).not.toHaveBeenCalled();
  });

  test("connects successfully when MONGO_URL exists", async () => {
    jest.doMock("dotenv", () => ({
      __esModule: true,
      default: { config: jest.fn() },
      config: jest.fn(),
    }));

    const connectMock = jest.fn().mockResolvedValueOnce({});
    jest.doMock("mongoose", () => ({
      __esModule: true,
      default: { connect: connectMock },
    }));

    process.env.MONGO_URL = "mongodb://fake-uri";

    const { default: connectDB } = await import("../../../database/db");
    await connectDB();

    expect(connectMock).toHaveBeenCalledWith("mongodb://fake-uri");
    expect(logSpy).toHaveBeenCalledWith("Connected to Database");
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test("calls process.exit when mongoose.connect fails", async () => {
    jest.doMock("dotenv", () => ({
      __esModule: true,
      default: { config: jest.fn() },
      config: jest.fn(),
    }));

    const err = new Error("connection failed");
    const connectMock = jest.fn().mockRejectedValueOnce(err);

    jest.doMock("mongoose", () => ({
      __esModule: true,
      default: { connect: connectMock },
    }));

    process.env.MONGO_URL = "mongodb://fake-uri";

    const { default: connectDB } = await import("../../../database/db");
    await connectDB();

    expect(errorSpy).toHaveBeenCalledWith("Database connection error:", err);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
