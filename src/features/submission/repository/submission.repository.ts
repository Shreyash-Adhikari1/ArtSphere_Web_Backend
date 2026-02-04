import mongoose from "mongoose";
import { ISubmission, SubmissionModel } from "../model/submission.model";

export interface ISubmissionRepository {
  submitPostToChallenge(
    challengeId: string,
    submitterId: string,
    postId: string,
  ): Promise<ISubmission | null>;

  getAllSubmissions(skip: number, limit: number): Promise<ISubmission[]>;
  getSubmissionsForChallenge(
    challengeId: string,
    skip: number,
    limit: number,
  ): Promise<ISubmission[]>;
  getSubmissionById(submissionId: string): Promise<ISubmission | null>;
  getByChallengeAndSubmitter(
    challengeId: string,
    submitterId: string,
  ): Promise<ISubmission | null>;

  deleteSubmission(submissionId: string): Promise<ISubmission | null>;
  deleteAllSubmissions(challengerId: string): Promise<ISubmission | null>;
}

export class SubmissionRepository implements ISubmissionRepository {
  async submitPostToChallenge(
    challengeId: string,
    submitterId: string,
    submittedPostId: string,
  ): Promise<ISubmission | null> {
    const post = new mongoose.Types.ObjectId(submittedPostId);
    const newSubmission = new SubmissionModel(challengeId, submitterId, post);
    return newSubmission.save();
  }
  async getAllSubmissions(
    skip: number = 0,
    limit: number = 10,
  ): Promise<ISubmission[]> {
    return await SubmissionModel.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
  }
  async getSubmissionsForChallenge(
    challengeId: string,
    skip: number = 0,
    limit: number = 10,
  ): Promise<ISubmission[]> {
    return await SubmissionModel.find({ challengeId })
      // Nested Populate Query Used
      // something like this
      // SubmittedPost---baata-->PostDetails---baata--->UserDetails
      .populate({
        path: "submittedPostId",
        select: "media caption likeCount commentCount author",
        populate: {
          path: "author",
          select: "_id username avatar",
        },
      })
      // .populate(
      //   "submittedPostId",
      //   "author media caption likeCount commentCount",
      // )
      // .populate("submittedPostId.author", " _id username avatar ")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }
  async getSubmissionById(submissionId: string): Promise<ISubmission | null> {
    return await SubmissionModel.findById(submissionId).populate({
      path: "submittedPostId",
      select: "media caption likeCount commentCount author",
      populate: { path: "author", select: "_id username avatar" },
    });
  }
  async getByChallengeAndSubmitter(
    challengeId: string,
    submitterId: string,
  ): Promise<ISubmission | null> {
    return await SubmissionModel.findOne({ challengeId, submitterId }).exec();
  }
  async deleteSubmission(submissionId: string): Promise<ISubmission | null> {
    return await SubmissionModel.findByIdAndDelete(submissionId).exec();
  }
  async deleteAllSubmissions(
    challengerId: string,
  ): Promise<ISubmission | null> {
    throw new Error("Method not implemented.");
  }
}
