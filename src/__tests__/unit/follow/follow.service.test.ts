const followRepoMock = {
  isFollowing: jest.fn(),
  follow: jest.fn(),
  unfollow: jest.fn(),
  getFollowers: jest.fn(),
  getFollowing: jest.fn(),
  getFollowingIdsOnly: jest.fn(),
};

const userRepoMock = {
  increaseFollowerCount: jest.fn(),
  increaseFollowingCount: jest.fn(),
  decreaseFollowerCount: jest.fn(),
  decreaseFollowingCount: jest.fn(),
};

// Mock constructors used at module load in FollowService
jest.mock("../../../features/follow/repository/follow.repository", () => ({
  FollowRepository: jest.fn().mockImplementation(() => followRepoMock),
}));

jest.mock("../../../features/user/repository/user.repository", () => ({
  UserRepository: jest.fn().mockImplementation(() => userRepoMock),
}));

import { FollowService } from "../../../features/follow/service/follow.service";

describe("FollowService unit tests", () => {
  let service: FollowService;

  const followerId = "507f1f77bcf86cd799439011";
  const followingId = "507f1f77bcf86cd799439012";

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FollowService();
  });

  test("follow: throws HttpError(400) when followerId == followingId", async () => {
    await expect(service.follow(followerId, followerId)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test("follow: throws HttpError(400) if already following", async () => {
    followRepoMock.isFollowing.mockResolvedValue(true);

    await expect(service.follow(followerId, followingId)).rejects.toMatchObject(
      {
        statusCode: 400,
        message: "You already follow this user",
      },
    );
  });

  test("follow: creates follow and updates counts", async () => {
    followRepoMock.isFollowing.mockResolvedValue(false);
    followRepoMock.follow.mockResolvedValue({ _id: "f1" } as any);

    const out = await service.follow(followerId, followingId);

    expect(followRepoMock.follow).toHaveBeenCalledWith(followerId, followingId);
    expect(userRepoMock.increaseFollowerCount).toHaveBeenCalledWith(
      followingId,
    );
    expect(userRepoMock.increaseFollowingCount).toHaveBeenCalledWith(
      followerId,
    );
    expect(out).toEqual({ _id: "f1" });
  });

  test("unfollow: throws HttpError(400) if not following", async () => {
    followRepoMock.isFollowing.mockResolvedValue(false);

    await expect(
      service.unfollow(followerId, followingId),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "You do not follow this user",
    });
  });

  test("unfollow: removes follow and decrements counts", async () => {
    followRepoMock.isFollowing.mockResolvedValue(true);
    followRepoMock.unfollow.mockResolvedValue({ _id: "unf1" } as any);

    const out = await service.unfollow(followerId, followingId);

    expect(followRepoMock.unfollow).toHaveBeenCalledWith(
      followerId,
      followingId,
    );
    expect(userRepoMock.decreaseFollowerCount).toHaveBeenCalledWith(
      followingId,
    );
    expect(userRepoMock.decreaseFollowingCount).toHaveBeenCalledWith(
      followerId,
    );
    expect(out).toEqual({ _id: "unf1" });
  });

  test("getFollowersWithViewerFlag: no viewerId -> isFollowedByMe false", async () => {
    followRepoMock.getFollowers.mockResolvedValue([
      { toObject: () => ({ follower: { _id: "uA" } }) },
      { toObject: () => ({ follower: { _id: "uB" } }) },
    ]);

    const out = await service.getFollowersWithViewerFlag("userX");

    expect(out[0].isFollowedByMe).toBe(false);
    expect(out[1].isFollowedByMe).toBe(false);
  });

  test("getFollowersWithViewerFlag: viewerId -> marks isFollowedByMe", async () => {
    followRepoMock.getFollowers.mockResolvedValue([
      { toObject: () => ({ follower: { _id: "uA" } }) },
      { toObject: () => ({ follower: { _id: "uC" } }) },
    ]);
    followRepoMock.getFollowingIdsOnly.mockResolvedValue(["uA"]);

    const out = await service.getFollowersWithViewerFlag("userX", "viewer1");

    expect(out[0].isFollowedByMe).toBe(true);
    expect(out[1].isFollowedByMe).toBe(false);
  });

  test("getFollowingWithViewerFlag: no viewerId -> isFollowedByMe false", async () => {
    followRepoMock.getFollowing.mockResolvedValue([
      { toObject: () => ({ following: { _id: "uB" } }) },
    ]);

    const out = await service.getFollowingWithViewerFlag("userX");

    expect(out[0].isFollowedByMe).toBe(false);
  });

  test("getFollowingWithViewerFlag: viewerId -> marks isFollowedByMe", async () => {
    followRepoMock.getFollowing.mockResolvedValue([
      { toObject: () => ({ following: { _id: "uB" } }) },
      { toObject: () => ({ following: { _id: "uD" } }) },
    ]);
    followRepoMock.getFollowingIdsOnly.mockResolvedValue(["uD"]);

    const out = await service.getFollowingWithViewerFlag("userX", "viewer1");

    expect(out[0].isFollowedByMe).toBe(false);
    expect(out[1].isFollowedByMe).toBe(true);
  });

  test("isAlreadyFollowing: returns repo result", async () => {
    followRepoMock.isFollowing.mockResolvedValue(true);

    const out = await service.isAlreadyFollowing("a", "b");

    expect(out).toBe(true);
    expect(followRepoMock.isFollowing).toHaveBeenCalledWith("a", "b");
  });
});
