import { Types } from "mongoose";
import { HttpError } from "../../../errors/http-error";
import { SubmissionRepository } from "../repository/submission.repository";
import { ChallengeRepository } from "../../challenge/repository/challenge.repository";
import { PostRepository } from "../../posts/repository/post.repository";
import { CreatePostDTO } from "../../posts/dto/post.dto";
import { UserRepository } from "../../user/repository/user.repository";

const userRepository = new UserRepository();
const postRepository = new PostRepository();
const submissionRepository = new SubmissionRepository();
const challengeRepository = new ChallengeRepository();
export class SubmissionService {
  async submitToChallenge(
    challengeId: string,
    submitterId: string,
    postId: string,
  ) {
    if (!challengeId) {
      throw new HttpError(404, "Challenge Not Found");
    }
    if (!submitterId || !postId) {
      throw new HttpError(404, "User or Post not found");
    }
    // Validating Ids
    if (!Types.ObjectId.isValid(challengeId)) {
      throw new HttpError(400, "Invalid challengeId");
    }
    if (!Types.ObjectId.isValid(submitterId)) {
      throw new HttpError(400, "Invalid userId");
    }
    if (!Types.ObjectId.isValid(postId)) {
      throw new HttpError(400, "Invalid postId");
    }

    // Validating if the user is submitting their own posts
    const postToSubmit = await postRepository.getPostById(postId);
    if (!postToSubmit) {
      throw new HttpError(404, "Post Not Found");
    }
    if (postToSubmit.author.toString() !== submitterId) {
      throw new HttpError(400, "You can only submit your own posts");
    }
    // Getting Challenge by Id to see if it exists
    const challenge = await challengeRepository.getChallengebyId(challengeId);
    if (!challenge) {
      throw new HttpError(404, "Challenge Not Found");
    }

    // Seeing if the Challenge is Expired
    const today = new Date();

    if (challenge.endsAt <= today) {
      await challengeRepository.closeChallenge(challengeId);
      throw new HttpError(400, "The Challenge Has Expired");
    }

    // Seeing if the submitter has already submitted to the challenge before
    const existingSubmission =
      await submissionRepository.getByChallengeAndSubmitter(
        challengeId,
        submitterId,
      );
    if (existingSubmission) {
      throw new HttpError(400, "You can only submit one post per challenge");
    }
    const submission = await submissionRepository.submitPostToChallenge(
      challengeId,
      submitterId,
      postId,
    );

    return submission;
  }

  async createPostAndSubmit(
    challengeId: string,
    submitterId: string,
    data: CreatePostDTO,
  ) {
    if (!challengeId) {
      throw new HttpError(404, "Challenge Not Found");
    }

    // Validating Ids
    if (!Types.ObjectId.isValid(challengeId)) {
      throw new HttpError(400, "Invalid challengeId");
    }
    if (!Types.ObjectId.isValid(submitterId)) {
      throw new HttpError(400, "Invalid userId");
    }

    // Getting Challenge by Id to see if it exists
    const challenge = await challengeRepository.getChallengebyId(challengeId);
    if (!challenge) {
      throw new HttpError(404, "Challenge Not Found");
    }

    // Seeing if the Challenge is Expired
    const today = new Date();

    if (challenge.endsAt <= today) {
      await challengeRepository.closeChallenge(challengeId);
      throw new HttpError(400, "The Challenge Has Expired");
    }

    // Seeing if the submitter has already submitted to the challenge before
    const existingSubmission =
      await submissionRepository.getByChallengeAndSubmitter(
        challengeId,
        submitterId,
      );
    if (existingSubmission) {
      throw new HttpError(400, "You can only submit one post per challenge");
    }

    // Creating a new post
    if (!data.media) {
      throw new HttpError(400, "Post must contain media");
    }

    const postToCreate = {
      // MongoDB expects ObjectId, but request/JWT gives us a string
      // So we convert userId (string from JWT/request) into MongoDB ObjectId required by the Post model
      author: new Types.ObjectId(submitterId), // TRUST SERVER ONLY
      media: data.media,
      mediaType: data.mediaType,
      caption: data.caption,
      tags: data.tags,
      visibility: data.visibility ?? "public",
    };

    // console.log("Service layer baata jaadai gareyko data:", postToCreate);
    const post = await postRepository.createPost(postToCreate);
    // console.log("Service layer ma baneyko post:", post);

    const postId = post._id.toString();
    await userRepository.increasePostCount(submitterId, postId);
    await postRepository.postCreateForSubmission(postId);

    // Validating if the user is submitting their own posts
    const postToSubmit = await postRepository.getPostById(postId);
    if (!postToSubmit) {
      throw new HttpError(404, "Post Not Found");
    }
    if (postToSubmit.author.toString() !== submitterId) {
      throw new HttpError(400, "You can only submit your own posts");
    }

    const submission = await submissionRepository.submitPostToChallenge(
      challengeId,
      submitterId,
      postId,
    );

    return submission;
  }

  async deleteSubmission(
    submissionId: string,
    submitterId: string,
  ): Promise<{ message: string }> {
    const submisison =
      await submissionRepository.getSubmissionById(submissionId);
    if (!submisison) {
      throw new HttpError(404, "Submission doesnt exist");
    }
    if (submisison.submitterId.toString() !== submitterId) {
      throw new HttpError(403, "You are not allowed to delete this submission");
    }
    const postToDelete = submisison.submittedPostId.toString();
    const post = await postRepository.getPostById(postToDelete);
    if (!post) {
      throw new HttpError(404, "Submitted post not found");
    }
    await submissionRepository.deleteSubmission(submissionId);
    if (post.isChallengeSubmission == true) {
      await postRepository.deletePost(postToDelete);
      await userRepository.decreasePostCount(submitterId, postToDelete);
    }
    return { message: "Submission Deleted Successfully" };
  }

  //   async deleteAllSubmisions(
  //     challengerId: string,
  //   ): Promise<{ message: string }> {
  //     if (!challengerId) {

  //     }
  //     return { message: "All submissions to this challenge deleted " };
  //   }
}
