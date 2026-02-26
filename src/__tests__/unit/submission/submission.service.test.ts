import { Types } from "mongoose";

const userRepoMock = {
  increasePostCount: jest.fn(),
  decreasePostCount: jest.fn(),
};

const postRepoMock = {
  getPostById: jest.fn(),
  createPost: jest.fn(),
  postCreateForSubmission: jest.fn(),
  deletePost: jest.fn(),
};

const submissionRepoMock = {
  submitPostToChallenge: jest.fn(),
  getByChallengeAndSubmitter: jest.fn(),
  getSubmissionById: jest.fn(),
  deleteSubmission: jest.fn(),
  getAllSubmissions: jest.fn(),
  getSubmissionsForChallenge: jest.fn(),
};

const challengeRepoMock = {
  getChallengebyId: jest.fn(),
  closeChallenge: jest.fn(),
  increaseSubmisionCount: jest.fn(),
  decreaseSubmissionCount: jest.fn(),
};

jest.mock("../../../features/user/repository/user.repository", () => ({
  UserRepository: jest.fn().mockImplementation(() => userRepoMock),
}));

jest.mock("../../../features/posts/repository/post.repository", () => ({
  PostRepository: jest.fn().mockImplementation(() => postRepoMock),
}));

jest.mock(
  "../../../features/submission/repository/submission.repository",
  () => ({
    SubmissionRepository: jest
      .fn()
      .mockImplementation(() => submissionRepoMock),
  }),
);

jest.mock(
  "../../../features/challenge/repository/challenge.repository",
  () => ({
    ChallengeRepository: jest.fn().mockImplementation(() => challengeRepoMock),
  }),
);

import { SubmissionService } from "../../../features/submission/service/submission.service";

describe("SubmissionService unit tests", () => {
  let service: SubmissionService;

  const challengeId = "507f1f77bcf86cd799439011";
  const submitterId = "507f1f77bcf86cd799439012";
  const otherUserId = "507f1f77bcf86cd799439099";
  const postId = "507f1f77bcf86cd799439013";
  const submissionId = "507f1f77bcf86cd799439014";

  const makePostDoc = (overrides: any = {}) => ({
    _id: overrides._id ?? postId,
    author: overrides.author ?? { _id: { toString: () => submitterId } },
    isChallengeSubmission: overrides.isChallengeSubmission ?? false,
    likedBy: [],
    ...overrides,
  });

  const makeChallengeDoc = (overrides: any = {}) => ({
    _id: overrides._id ?? challengeId,
    endsAt: overrides.endsAt ?? new Date(Date.now() + 60 * 60 * 1000), // future
    ...overrides,
  });

  const makeSubmissionDoc = (overrides: any = {}) => ({
    _id: overrides._id ?? submissionId,
    challengeId: overrides.challengeId ?? new Types.ObjectId(challengeId),
    submitterId: overrides.submitterId ?? new Types.ObjectId(submitterId),
    submittedPostId: overrides.submittedPostId ?? new Types.ObjectId(postId),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SubmissionService();
  });

  // ======================================================
  // submitToChallenge
  // ======================================================

  test("submitToChallenge: throws HttpError(400) for invalid challengeId", async () => {
    await expect(
      service.submitToChallenge("bad", submitterId, postId),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid challengeId",
    });
  });

  test("submitToChallenge: throws HttpError(404) if post not found", async () => {
    postRepoMock.getPostById.mockResolvedValue(null);

    await expect(
      service.submitToChallenge(challengeId, submitterId, postId),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Post Not Found",
    });
  });

  test("submitToChallenge: throws HttpError(400) if post not owned by submitter", async () => {
    postRepoMock.getPostById.mockResolvedValue(
      makePostDoc({ author: { _id: { toString: () => otherUserId } } }),
    );

    await expect(
      service.submitToChallenge(challengeId, submitterId, postId),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "You can only submit your own posts",
    });
  });

  test("submitToChallenge: throws HttpError(400) and closes challenge if expired", async () => {
    postRepoMock.getPostById.mockResolvedValue(makePostDoc());
    challengeRepoMock.getChallengebyId.mockResolvedValue(
      makeChallengeDoc({ endsAt: new Date(Date.now() - 1000) }), // expired
    );

    await expect(
      service.submitToChallenge(challengeId, submitterId, postId),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "The Challenge Has Expired",
    });

    expect(challengeRepoMock.closeChallenge).toHaveBeenCalledWith(challengeId);
  });

  test("submitToChallenge: throws HttpError(400) if already submitted", async () => {
    postRepoMock.getPostById.mockResolvedValue(makePostDoc());
    challengeRepoMock.getChallengebyId.mockResolvedValue(makeChallengeDoc());
    submissionRepoMock.getByChallengeAndSubmitter.mockResolvedValue(
      makeSubmissionDoc(),
    );

    await expect(
      service.submitToChallenge(challengeId, submitterId, postId),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "You can only submit one post per challenge",
    });
  });

  test("submitToChallenge: success submits + increases submission count", async () => {
    postRepoMock.getPostById.mockResolvedValue(makePostDoc());
    challengeRepoMock.getChallengebyId.mockResolvedValue(makeChallengeDoc());
    submissionRepoMock.getByChallengeAndSubmitter.mockResolvedValue(null);
    submissionRepoMock.submitPostToChallenge.mockResolvedValue(
      makeSubmissionDoc(),
    );

    const out = await service.submitToChallenge(
      challengeId,
      submitterId,
      postId,
    );

    expect(submissionRepoMock.submitPostToChallenge).toHaveBeenCalledWith(
      challengeId,
      submitterId,
      postId,
    );
    expect(challengeRepoMock.increaseSubmisionCount).toHaveBeenCalledWith(
      challengeId,
    );
    expect(out).toBeTruthy();
  });

  // ======================================================
  // createPostAndSubmit
  // ======================================================

  test("createPostAndSubmit: throws HttpError(400) if data.media missing", async () => {
    challengeRepoMock.getChallengebyId.mockResolvedValue(makeChallengeDoc());
    submissionRepoMock.getByChallengeAndSubmitter.mockResolvedValue(null);

    await expect(
      service.createPostAndSubmit(challengeId, submitterId, {
        caption: "no media",
      } as any),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Post must contain media",
    });
  });

  test("createPostAndSubmit: creates post -> marks as submission -> submits -> increases count", async () => {
    // challenge ok + not expired + no existing submission
    challengeRepoMock.getChallengebyId.mockResolvedValue(makeChallengeDoc());
    submissionRepoMock.getByChallengeAndSubmitter.mockResolvedValue(null);

    // createPost returns new postId
    postRepoMock.createPost.mockResolvedValue({ _id: postId } as any);

    // after creation, service re-fetches post by id for ownership validation
    postRepoMock.getPostById.mockResolvedValue(makePostDoc());

    submissionRepoMock.submitPostToChallenge.mockResolvedValue(
      makeSubmissionDoc(),
    );

    const out = await service.createPostAndSubmit(challengeId, submitterId, {
      media: "file.jpg",
      caption: "hello",
      visibility: "public",
    } as any);

    expect(postRepoMock.createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        author: expect.any(Types.ObjectId),
        media: "file.jpg",
        caption: "hello",
        visibility: "public",
      }),
    );
    expect(userRepoMock.increasePostCount).toHaveBeenCalledWith(
      submitterId,
      postId,
    );
    expect(postRepoMock.postCreateForSubmission).toHaveBeenCalledWith(postId);
    expect(submissionRepoMock.submitPostToChallenge).toHaveBeenCalledWith(
      challengeId,
      submitterId,
      postId,
    );
    expect(challengeRepoMock.increaseSubmisionCount).toHaveBeenCalledWith(
      challengeId,
    );
    expect(out).toBeTruthy();
  });

  // ======================================================
  // deleteSubmission
  // ======================================================

  test("deleteSubmission: deletes submission and deletes post only if isChallengeSubmission==true", async () => {
    submissionRepoMock.getSubmissionById.mockResolvedValue(
      makeSubmissionDoc({
        submitterId: new Types.ObjectId(submitterId),
        submittedPostId: new Types.ObjectId(postId),
        challengeId: new Types.ObjectId(challengeId),
      }),
    );

    postRepoMock.getPostById.mockResolvedValue(
      makePostDoc({ isChallengeSubmission: true }),
    );

    submissionRepoMock.deleteSubmission.mockResolvedValue({} as any);

    const out = await service.deleteSubmission(submissionId, submitterId);

    expect(submissionRepoMock.deleteSubmission).toHaveBeenCalledWith(
      submissionId,
    );
    expect(postRepoMock.deletePost).toHaveBeenCalledWith(postId);
    expect(userRepoMock.decreasePostCount).toHaveBeenCalledWith(
      submitterId,
      postId,
    );
    expect(challengeRepoMock.decreaseSubmissionCount).toHaveBeenCalledWith(
      challengeId,
    );
    expect(out).toEqual({ message: "Submission Deleted Successfully" });
  });
});
