// src/__tests__/unit/post.service.test.ts

// ---- Repo mocks (constructed via new ...) ----
const postRepoMock = {
  createPost: jest.fn(),
  getPostById: jest.fn(),
  editPost: jest.fn(),
  deletePost: jest.fn(),
  getPublicFeed: jest.fn(),
  getFollowingFeed: jest.fn(),
  getPostsByUser: jest.fn(),
  likePost: jest.fn(),
  unlikePost: jest.fn(),
};

const userRepoMock = {
  increasePostCount: jest.fn(),
  decreasePostCount: jest.fn(),
};

const followRepoMock = {
  getFollowingIdsOnly: jest.fn(),
};

jest.mock("../../../features/posts/repository/post.repository", () => ({
  PostRepository: jest.fn().mockImplementation(() => postRepoMock),
}));

jest.mock("../../../features/user/repository/user.repository", () => ({
  UserRepository: jest.fn().mockImplementation(() => userRepoMock),
}));

jest.mock("../../../features/follow/repository/follow.repository", () => ({
  FollowRepository: jest.fn().mockImplementation(() => followRepoMock),
}));

import { Types } from "mongoose";
import { PostService } from "../../../features/posts/service/post.service";

describe("PostService unit tests", () => {
  let service: PostService;

  const makePostDoc = (overrides: any = {}) => {
    const authorId = overrides.authorId ?? "author123";
    const likedBy = overrides.likedBy ?? [];

    return {
      _id: overrides._id ?? "post123",
      author: overrides.author ?? { _id: { toString: () => authorId } },
      likedBy,
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostService();
  });

  test("createPost: throws if media missing", async () => {
    await expect(
      service.createPost("u1", { caption: "x" } as any),
    ).rejects.toThrow("Post must contain media");
  });

  test("createPost: creates post and increases user postCount", async () => {
    const userId = "507f1f77bcf86cd799439011"; // ✅ valid ObjectId string

    const createdPost = makePostDoc({ _id: "p1" });
    postRepoMock.createPost.mockResolvedValue(createdPost);
    userRepoMock.increasePostCount.mockResolvedValue({ _id: userId } as any);

    const out = await service.createPost(userId, {
      media: "file.jpg",
      caption: "hello",
      visibility: "public",
    } as any);

    expect(postRepoMock.createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        media: "file.jpg",
        caption: "hello",
        visibility: "public",
        author: expect.any(Types.ObjectId),
      }),
    );
    expect(userRepoMock.increasePostCount).toHaveBeenCalledWith(userId, "p1");
    expect(out._id).toBe("p1");
  });

  test("editPost: throws if post not found", async () => {
    postRepoMock.getPostById.mockResolvedValue(null);

    await expect(
      service.editPost("u1", "p1", { caption: "new" } as any),
    ).rejects.toThrow("Post not found");
  });

  test("editPost: throws if user is not owner", async () => {
    postRepoMock.getPostById.mockResolvedValue(
      makePostDoc({ authorId: "owner" }),
    );

    await expect(
      service.editPost("NOT_OWNER", "p1", { caption: "new" } as any),
    ).rejects.toThrow("You are not allowed to edit this post");
  });

  test("editPost: throws if repository fails to update post", async () => {
    postRepoMock.getPostById.mockResolvedValue(makePostDoc({ authorId: "u1" }));
    postRepoMock.editPost.mockResolvedValue(null);

    await expect(
      service.editPost("u1", "p1", { caption: "new" } as any),
    ).rejects.toThrow("Failed to update post");
  });

  test("deletePost: throws if post not found", async () => {
    postRepoMock.getPostById.mockResolvedValue(null);

    await expect(service.deletePost("u1", "p1")).rejects.toThrow(
      "Post not found",
    );
  });

  test("deletePost: throws if user is not owner", async () => {
    postRepoMock.getPostById.mockResolvedValue(
      makePostDoc({ authorId: "owner" }),
    );

    await expect(service.deletePost("NOT_OWNER", "p1")).rejects.toThrow(
      "You are not allowed to delete this post",
    );
  });

  test("deletePost: deletes post and decreases user postCount", async () => {
    postRepoMock.getPostById.mockResolvedValue(makePostDoc({ authorId: "u1" }));
    postRepoMock.deletePost.mockResolvedValue({ _id: "p1" } as any);
    userRepoMock.decreasePostCount.mockResolvedValue({ _id: "u1" } as any);

    const out = await service.deletePost("u1", "p1");

    expect(postRepoMock.deletePost).toHaveBeenCalledWith("p1");
    expect(userRepoMock.decreasePostCount).toHaveBeenCalledWith("u1", "p1");
    expect(out).toEqual({ message: "Post deleted successfully" });
  });

  test("getFollowingFeed: returns [] when user follows nobody", async () => {
    followRepoMock.getFollowingIdsOnly.mockResolvedValue([]);

    const out = await service.getFollowingFeed("u1", 1, 10);

    expect(out).toEqual([]);
    expect(postRepoMock.getFollowingFeed).not.toHaveBeenCalled();
  });

  test("likePost/unlikePost: enforces like rules and calls repository on success", async () => {
    const userId = "507f1f77bcf86cd799439011";
    const postId = "p1";

    const alreadyLiked = [new Types.ObjectId(userId)];
    postRepoMock.getPostById.mockResolvedValue(
      makePostDoc({ likedBy: alreadyLiked }),
    );

    await expect(service.likePost(postId, userId)).rejects.toThrow(
      "You have already liked this post",
    );

    postRepoMock.getPostById.mockResolvedValue(makePostDoc({ likedBy: [] }));
    postRepoMock.likePost.mockResolvedValue(makePostDoc() as any);

    const liked = await service.likePost(postId, userId);
    expect(postRepoMock.likePost).toHaveBeenCalledWith(postId, userId);
    expect(liked).toEqual({ message: "Post Liked" });

    postRepoMock.getPostById.mockResolvedValue(makePostDoc({ likedBy: [] }));
    await expect(service.unlikePost(postId, userId)).rejects.toThrow(
      "You have already liked this post",
    );

    postRepoMock.getPostById.mockResolvedValue(
      makePostDoc({ likedBy: [new Types.ObjectId(userId)] }),
    );
    postRepoMock.unlikePost.mockResolvedValue(makePostDoc() as any);

    const unliked = await service.unlikePost(postId, userId);
    expect(postRepoMock.unlikePost).toHaveBeenCalledWith(postId, userId);
    expect(unliked).toEqual({ message: "Post Unliked" });
  });
});
