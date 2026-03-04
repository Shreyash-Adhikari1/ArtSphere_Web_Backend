/* eslint-disable @typescript-eslint/no-explicit-any */
describe("upload.middleware.ts", () => {
  const ORIGINAL_ENV = process.env;

  // These will be re-initialized per test via jest.resetModules + jest.doMock
  let fsMock: {
    existsSync: jest.Mock;
    mkdirSync: jest.Mock;
  };

  let multerFactoryMock: jest.Mock & {
    memoryStorage?: jest.Mock;
    diskStorage?: jest.Mock;
    __getCapturedOptions?: () => any;
    __getDiskStorageCfg?: () => any;
    __getUploadInstance?: () => any;
  };

  let uuidMock: jest.Mock;

  const loadModule = async (
    nodeEnv: string,
    existsSyncImpl?: (p: string) => boolean,
  ) => {
    jest.resetModules();

    process.env = { ...ORIGINAL_ENV, NODE_ENV: nodeEnv };

    // --- fs mock (important: import-time side effects) ---
    fsMock = {
      existsSync: jest.fn(existsSyncImpl ?? (() => true)),
      mkdirSync: jest.fn(),
    };
    jest.doMock("fs", () => ({
      __esModule: true,
      default: fsMock,
      existsSync: fsMock.existsSync,
      mkdirSync: fsMock.mkdirSync,
    }));

    // --- uuid mock ---
    uuidMock = jest.fn(() => "uuid-123");
    jest.doMock("uuid", () => ({
      __esModule: true,
      v4: uuidMock,
    }));

    // --- multer mock ---
    let capturedOptions: any = null;
    let diskStorageCfg: any = null;

    const uploadInstance = {
      single: jest.fn(() => "single-mw"),
      array: jest.fn(() => "array-mw"),
      fields: jest.fn(() => "fields-mw"),
    };

    const multerFn: any = jest.fn((opts: any) => {
      capturedOptions = opts;
      return uploadInstance;
    });

    multerFn.memoryStorage = jest.fn(() => "MEMORY_STORAGE");
    multerFn.diskStorage = jest.fn((cfg: any) => {
      diskStorageCfg = cfg;
      return { __type: "DISK_STORAGE", cfg };
    });

    multerFn.__getCapturedOptions = () => capturedOptions;
    multerFn.__getDiskStorageCfg = () => diskStorageCfg;
    multerFn.__getUploadInstance = () => uploadInstance;

    multerFactoryMock = multerFn;

    jest.doMock("multer", () => ({
      __esModule: true,
      default: multerFn,
    }));

    // Now import the module under test
    const mod = await import("../../../middleware/upload.middleware");
    return { mod, multer: multerFactoryMock, fs: fsMock };
  };

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.clearAllMocks();
    jest.resetModules();
  });

  test("creates base uploads directory at import time if missing", async () => {
    // First existsSync call for base uploadDir -> false, so mkdirSync should run
    let first = true;
    await loadModule("test", () => {
      if (first) {
        first = false;
        return false; // base uploads folder missing
      }
      return true;
    });

    expect(fsMock.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
  });

  test("NODE_ENV=test uses multer.memoryStorage and not diskStorage", async () => {
    const { mod, multer } = await loadModule("test");

    // storage selection
    expect(multer.memoryStorage).toHaveBeenCalledTimes(1);
    expect(multer.diskStorage).not.toHaveBeenCalled();

    // multer called with correct options
    const opts = multer.__getCapturedOptions?.();
    expect(opts).toBeTruthy();
    expect(opts.storage).toBe("MEMORY_STORAGE");
    expect(typeof opts.fileFilter).toBe("function");
    expect(opts.limits).toEqual({ fileSize: 5 * 1024 * 1024 });

    // wrapper exports delegate to upload instance
    const uploadInstance = multer.__getUploadInstance?.();
    expect(mod.uploads.single("profile-image")).toBe("single-mw");
    expect(uploadInstance.single).toHaveBeenCalledWith("profile-image");

    expect(mod.uploads.array("post-images", 3)).toBe("array-mw");
    expect(uploadInstance.array).toHaveBeenCalledWith("post-images", 3);

    const fieldsArg = [{ name: "a", maxCount: 1 }, { name: "b" }];
    expect(mod.uploads.fields(fieldsArg as any)).toBe("fields-mw");
    expect(uploadInstance.fields).toHaveBeenCalledWith(fieldsArg);
  });

  test("fileFilter rejects non-image mimetypes and accepts images", async () => {
    const { multer } = await loadModule("test");

    const opts = multer.__getCapturedOptions?.();
    const fileFilter = opts.fileFilter as Function;

    const cb1 = jest.fn();
    fileFilter({} as any, { mimetype: "text/plain" } as any, cb1);

    expect(cb1).toHaveBeenCalledTimes(1);
    const err = cb1.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("Only image files are allowed!");

    const cb2 = jest.fn();
    fileFilter({} as any, { mimetype: "image/png" } as any, cb2);
    expect(cb2).toHaveBeenCalledWith(null, true);
  });

  test("NODE_ENV!=test uses diskStorage and destination/filename behave correctly", async () => {
    // base uploads exists, but per-field folder doesn't
    await loadModule("development", (p: string) => {
      // if path contains "/uploads/post-images" return false to force mkdir
      return !p.replace(/\\/g, "/").includes("/uploads/post-images");
    });

    expect(multerFactoryMock.diskStorage).toHaveBeenCalledTimes(1);
    expect(multerFactoryMock.memoryStorage).not.toHaveBeenCalled();

    const diskCfg = multerFactoryMock.__getDiskStorageCfg?.();
    expect(diskCfg).toBeTruthy();
    expect(typeof diskCfg.destination).toBe("function");
    expect(typeof diskCfg.filename).toBe("function");

    // --- destination() creates folder and calls cb(null, folderPath) ---
    const cbDest = jest.fn();
    diskCfg.destination({} as any, { fieldname: "post-images" } as any, cbDest);

    expect(fsMock.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining("uploads"),
      {
        recursive: true,
      },
    );
    expect(cbDest).toHaveBeenCalledWith(
      null,
      expect.stringContaining(`uploads${require("path").sep}post-images`),
    );

    // --- filename() uses uuid + extension ---
    const cbName = jest.fn();
    diskCfg.filename(
      {} as any,
      { fieldname: "post-images", originalname: "hello.png" } as any,
      cbName,
    );

    expect(uuidMock).toHaveBeenCalledTimes(1);
    expect(cbName).toHaveBeenCalledWith(null, "post-images-uuid-123.png");
  });
});
