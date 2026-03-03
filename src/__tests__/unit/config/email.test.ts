describe("config/email.ts", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.EMAIL_USER = "unit@test.com";
    process.env.EMAIL_PASS = "fakepass";
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test("creates transporter with gmail + env credentials", async () => {
    const sendMailMock = jest.fn().mockResolvedValueOnce(true);
    const createTransportMock = jest
      .fn()
      .mockReturnValue({ sendMail: sendMailMock });

    // mock BEFORE import
    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport: createTransportMock },
    }));

    // prevent dotenv from mutating env during import
    jest.doMock("dotenv", () => ({
      __esModule: true,
      default: { config: jest.fn() },
      config: jest.fn(),
    }));

    const mod = await import("../../../config/email");

    // transporter created at import time
    expect(createTransportMock).toHaveBeenCalledWith({
      service: "gmail",
      auth: { user: "unit@test.com", pass: "fakepass" },
    });

    // also prove transporter exists
    expect(mod.transporter).toBeDefined();
  });

  test("sendEmail calls transporter.sendMail with correct mailOptions", async () => {
    const sendMailMock = jest.fn().mockResolvedValueOnce(true);
    const createTransportMock = jest
      .fn()
      .mockReturnValue({ sendMail: sendMailMock });

    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport: createTransportMock },
    }));

    jest.doMock("dotenv", () => ({
      __esModule: true,
      default: { config: jest.fn() },
      config: jest.fn(),
    }));

    const { sendEmail } = await import("../../../config/email");

    await sendEmail("to@example.com", "Hello", "<b>Hi</b>");

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith({
      from: "ArtSphere <unit@test.com>",
      to: "to@example.com",
      subject: "Hello",
      html: "<b>Hi</b>",
    });
  });

  test("sendEmail propagates error when transporter.sendMail fails", async () => {
    const err = new Error("smtp down");
    const sendMailMock = jest.fn().mockRejectedValueOnce(err);
    const createTransportMock = jest
      .fn()
      .mockReturnValue({ sendMail: sendMailMock });

    jest.doMock("nodemailer", () => ({
      __esModule: true,
      default: { createTransport: createTransportMock },
    }));

    jest.doMock("dotenv", () => ({
      __esModule: true,
      default: { config: jest.fn() },
      config: jest.fn(),
    }));

    const { sendEmail } = await import("../../../config/email");

    await expect(
      sendEmail("to@example.com", "Hello", "<b>Hi</b>"),
    ).rejects.toThrow("smtp down");
  });
});
