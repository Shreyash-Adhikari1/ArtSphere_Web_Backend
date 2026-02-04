import mongoose from "mongoose";
import { ISubmission, SubmissionModel } from "../model/submission.model";

export interface ISubmissionRepository {
  submitPostToChallenge(
    challengeId: string,
    submitterId: string,
    postId: string,
  ): Promise<ISubmission | null>;

  getAllSubmissions(): Promise<ISubmission[]>;
  getSubmissionsToChallenge(challengeId: string): Promise<ISubmission[]>;
  getSubmissionById(submissionId: string): Promise<ISubmission | null>;

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
  getAllSubmissions(): Promise<ISubmission[]> {
    throw new Error("Method not implemented.");
  }
  getSubmissionsToChallenge(challengeId: string): Promise<ISubmission[]> {
    throw new Error("Method not implemented.");
  }
  getSubmissionById(submissionId: string): Promise<ISubmission | null> {
    throw new Error("Method not implemented.");
  }
  async deleteSubmission(submissionId: string): Promise<ISubmission | null> {
    return await SubmissionModel.findByIdAndDelete(submissionId).exec();
  }
  deleteAllSubmissions(challengerId: string): Promise<ISubmission | null> {
    throw new Error("Method not implemented.");
  }
}
