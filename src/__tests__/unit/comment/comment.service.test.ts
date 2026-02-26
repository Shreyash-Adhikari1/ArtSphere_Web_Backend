// ---- Repo Mocks ----
const commentRepoMock = {
  createComment: jest.fn(),
  getCommentById: jest.fn(),
  deleteComment: jest.fn(),
  likeComment: jest.fn(),
  unlikeComment: jest.fn(),
  getCommentsForPost: jest.fn(),
};

const postRepoMock = {
  increaseCommentCount: jest.fn(),
  decreaseCommentCount: jest.fn(),
};

// Mock class constructors
jest.mock("../../../features/posts/repository/comment.repository", () => ({
  PostCommentRepository: jest.fn().mockImplementation(() => commentRepoMock),
}));

jest.mock("../../../features/posts/repository/post.repository", () => ({
  PostRepository: jest.fn().mockImplementation(() => postRepoMock),
}));

import { Types } from "mongoose";
import { CommentService } from "../../../features/posts/service/comment.service";

describe("CommentService unit tests", () => {
  let service: CommentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommentService();
  });

  const validUserId = "507f1f77bcf86cd799439011";
  const validPostId = "507f1f77bcf86cd799439012";
  const validCommentId = "507f1f77bcf86cd799439013";

  const makeCommentDoc = (overrides: any = {}) => {
    return {
      _id: overrides._id ?? validCommentId,
      userId: overrides.userId ?? new Types.ObjectId(validUserId),
      postId: overrides.postId ?? new Types.ObjectId(validPostId),
      likedBy: overrides.likedBy ?? [],
      ...overrides,
    };
  };

  // =========================
  // CREATE COMMENT
  // =========================

  test("createComment: throws if userId or postId missing", async () => {
    await expect(
      service.createComment({ commentText: "x" } as any, "", ""),
    ).rejects.toThrow("UserId and PostId are required");
  });

  test("createComment: throws if invalid userId", async () => {
    await expect(
      service.createComment({ commentText: "x" } as any, "bad", validPostId),
    ).rejects.toThrow("Invalid userId");
  });

  test("createComment: throws if invalid postId", async () => {
    await expect(
      service.createComment({ commentText: "x" } as any, validUserId, "bad"),
    ).rejects.toThrow("Invalid postId");
  });

  test("createComment: creates comment and increases post comment count", async () => {
    const createdComment = makeCommentDoc();
    commentRepoMock.createComment.mockResolvedValue(createdComment);
    postRepoMock.increaseCommentCount.mockResolvedValue({} as any);

    const out = await service.createComment(
      { commentText: "hello" } as any,
      validUserId,
      validPostId,
    );

    expect(commentRepoMock.createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        commentText: "hello",
        userId: expect.any(Types.ObjectId),
        postId: expect.any(Types.ObjectId),
      }),
    );

    expect(postRepoMock.increaseCommentCount).toHaveBeenCalledWith(
      validPostId,
      validUserId,
    );

    expect(out).toEqual(createdComment);
  });

  // =========================
  // DELETE COMMENT
  // =========================

  test("deleteComment: throws if comment not found", async () => {
    commentRepoMock.getCommentById.mockResolvedValue(null);

    await expect(
      service.deleteComment(validUserId, validCommentId),
    ).rejects.toThrow("Comment Doesnt Exist");
  });

  test("deleteComment: throws if user not owner", async () => {
    commentRepoMock.getCommentById.mockResolvedValue(
      makeCommentDoc({
        userId: new Types.ObjectId("507f1f77bcf86cd799439099"),
      }),
    );

    await expect(
      service.deleteComment(validUserId, validCommentId),
    ).rejects.toThrow("You can only delete your own comments");
  });

  test("deleteComment: deletes comment and decreases comment count", async () => {
    commentRepoMock.getCommentById.mockResolvedValue(makeCommentDoc());
    commentRepoMock.deleteComment.mockResolvedValue({} as any);
    postRepoMock.decreaseCommentCount.mockResolvedValue({} as any);

    const result = await service.deleteComment(validUserId, validCommentId);

    expect(commentRepoMock.deleteComment).toHaveBeenCalledWith(validCommentId);
    expect(postRepoMock.decreaseCommentCount).toHaveBeenCalled();
    expect(result).toEqual({ message: "Comment deleted Successfully" });
  });

  // =========================
  // LIKE COMMENT
  // =========================

  test("likeComment: throws if comment not found", async () => {
    commentRepoMock.getCommentById.mockResolvedValue(null);

    await expect(
      service.likeComment(validCommentId, validUserId),
    ).rejects.toThrow("Comment Doesnt Exist");
  });

  test("likeComment: throws if already liked", async () => {
    commentRepoMock.getCommentById.mockResolvedValue(
      makeCommentDoc({
        likedBy: [new Types.ObjectId(validUserId)],
      }),
    );

    await expect(
      service.likeComment(validCommentId, validUserId),
    ).rejects.toThrow("You have already liked this comment");
  });

  test("likeComment: success calls repository", async () => {
    commentRepoMock.getCommentById.mockResolvedValue(makeCommentDoc());
    commentRepoMock.likeComment.mockResolvedValue({} as any);

    const result = await service.likeComment(validCommentId, validUserId);

    expect(commentRepoMock.likeComment).toHaveBeenCalledWith(
      validCommentId,
      validUserId,
    );
    expect(result).toEqual({ message: "Comment Liked" });
  });

  // =========================
  // UNLIKE COMMENT
  // =========================

  test("unlikeComment: throws if not previously liked", async () => {
    commentRepoMock.getCommentById.mockResolvedValue(makeCommentDoc());

    await expect(
      service.unlikeComment(validCommentId, validUserId),
    ).rejects.toThrow("You have not liked this comment");
  });

  test("unlikeComment: success calls repository", async () => {
    commentRepoMock.getCommentById.mockResolvedValue(
      makeCommentDoc({
        likedBy: [new Types.ObjectId(validUserId)],
      }),
    );

    commentRepoMock.unlikeComment.mockResolvedValue({} as any);

    const result = await service.unlikeComment(validCommentId, validUserId);

    expect(commentRepoMock.unlikeComment).toHaveBeenCalledWith(
      validCommentId,
      validUserId,
    );
    expect(result).toEqual({ message: "Comment Unliked" });
  });
});
