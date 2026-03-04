const challengeRepoMock = {
  createChallenge: jest.fn(),
  getChallengebyId: jest.fn(),
  updateChallenge: jest.fn(),
  deleteChallenge: jest.fn(),
  deleteAllChallengesByUser: jest.fn(),
  getAllChallenges: jest.fn(),
  getChallengesByUser: jest.fn(),
};

jest.mock(
  "../../../features/challenge/repository/challenge.repository",
  () => ({
    ChallengeRepository: jest.fn().mockImplementation(() => challengeRepoMock),
  }),
);

import { ChallengeService } from "../../../features/challenge/service/challenge.service";

describe("ChallengeService unit tests", () => {
  let service: ChallengeService;

  const userId = "507f1f77bcf86cd799439011";
  const otherUserId = "507f1f77bcf86cd799439099";
  const challengeId = "507f1f77bcf86cd799439012";

  const makeChallengeDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? challengeId,
      challengerId: overrides.challengerId ?? {
        _id: { toString: () => userId },
      },
      endsAt: overrides.endsAt ?? new Date(Date.now() + 60 * 60 * 1000),
    };
    return { ...base, ...overrides };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChallengeService();
  });

  // 1) createChallenge: endsAt must be future
  test("createChallenge: throws HttpError(400) when endsAt is in the past", async () => {
    const data = {
      challengeTitle: "t",
      challengeDescription: "d",
      challengeMedia: "m",
      endsAt: new Date(Date.now() - 1000),
    } as any;

    await expect(service.createChallenge(userId, data)).rejects.toMatchObject({
      statusCode: 400,
      message: "endsAt must be in the future",
    });
  });

  // 2) createChallenge: success calls repo.createChallenge with ObjectId challengerId
  test("createChallenge: creates challenge with challengerId as ObjectId", async () => {
    const data = {
      challengeTitle: "Title",
      challengeDescription: "Desc",
      challengeMedia: "file.jpg",
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    } as any;

    challengeRepoMock.createChallenge.mockResolvedValue(
      makeChallengeDoc({ challengeTitle: "Title" }) as any,
    );

    const out = await service.createChallenge(userId, data);

    expect(challengeRepoMock.createChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        challengerId: expect.anything(), // ObjectId
        challengeTitle: "Title",
        challengeDescription: "Desc",
        challengeMedia: "file.jpg",
        endsAt: data.endsAt,
      }),
    );
    expect(out).toBeTruthy();
  });

  // 3) updateChallenge: not found
  test("updateChallenge: throws HttpError(404) if challenge not found", async () => {
    challengeRepoMock.getChallengebyId.mockResolvedValue(null);

    await expect(
      service.updateChallenge(userId, challengeId, {
        challengeTitle: "x",
      } as any),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Challenge Not Found",
    });
  });

  // 4) updateChallenge: forbidden if not owner
  test("updateChallenge: throws HttpError(403) if user not owner", async () => {
    challengeRepoMock.getChallengebyId.mockResolvedValue(
      makeChallengeDoc({
        challengerId: { _id: { toString: () => otherUserId } },
      }),
    );

    await expect(
      service.updateChallenge(userId, challengeId, {
        challengeTitle: "x",
      } as any),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "You are not allowed to edit this challenge",
    });
  });

  // 5) updateChallenge: cannot edit after endsAt
  test("updateChallenge: throws HttpError(400) if endsAt is in the past", async () => {
    challengeRepoMock.getChallengebyId.mockResolvedValue(
      makeChallengeDoc({ endsAt: new Date(Date.now() - 1000) }),
    );

    await expect(
      service.updateChallenge(userId, challengeId, {
        challengeTitle: "x",
      } as any),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Challenge cannot be edited after endsAt date",
    });
  });

  // 6) updateChallenge: throws if updateChallenge returns null
  test("updateChallenge: throws HttpError(400) if repo update fails", async () => {
    challengeRepoMock.getChallengebyId.mockResolvedValue(makeChallengeDoc());
    challengeRepoMock.updateChallenge.mockResolvedValue(null);

    await expect(
      service.updateChallenge(userId, challengeId, {
        challengeTitle: "new",
      } as any),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Failed To Update Challenge",
    });
  });

  // 7) updateChallenge: success returns updated challenge
  test("updateChallenge: success returns updated challenge", async () => {
    challengeRepoMock.getChallengebyId.mockResolvedValue(makeChallengeDoc());
    challengeRepoMock.updateChallenge.mockResolvedValue(
      makeChallengeDoc({ challengeTitle: "Updated" }) as any,
    );

    const out = await service.updateChallenge(userId, challengeId, {
      challengeTitle: "Updated",
    } as any);

    expect(challengeRepoMock.updateChallenge).toHaveBeenCalledWith(
      challengeId,
      expect.objectContaining({ challengeTitle: "Updated" }),
    );
    expect((out as any).challengeTitle).toBe("Updated");
  });

  // 8) deleteChallenge: not found
  test("deleteChallenge: throws HttpError(404) if challenge not found", async () => {
    challengeRepoMock.getChallengebyId.mockResolvedValue(null);

    await expect(
      service.deleteChallenge(userId, challengeId),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Challenge Not Found",
    });
  });

  // 9) deleteChallenge: forbidden if not owner
  test("deleteChallenge: throws HttpError(403) if user not owner", async () => {
    challengeRepoMock.getChallengebyId.mockResolvedValue(
      makeChallengeDoc({
        challengerId: { _id: { toString: () => otherUserId } },
      }),
    );

    await expect(
      service.deleteChallenge(userId, challengeId),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "You are not allowed to delete this challenge",
    });
  });

  // 10) getAllChallenges: uses skip/limit correctly
  test("getAllChallenges: calls repo with correct skip/limit", async () => {
    challengeRepoMock.getAllChallenges.mockResolvedValue([
      makeChallengeDoc(),
    ] as any);

    const out = await service.getAllChallenges(2, 10);

    expect(challengeRepoMock.getAllChallenges).toHaveBeenCalledWith(10, 10);
    expect(Array.isArray(out)).toBe(true);
    expect(out).toHaveLength(1);
  });
});
