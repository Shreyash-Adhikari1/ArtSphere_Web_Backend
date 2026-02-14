import mongoose from "mongoose";
import { ISubmission, SubmissionModel } from "../model/submission.model";

export interface ISubmissionRepository {
  submitPostToChallenge(
    challengeId: string,
    submitterId: string,
    postId: string,
  ): Promise<ISubmission | null>;

  deleteSubmission(submissionId: string): Promise<ISubmission | null>;
}

export class SubmissionRepository implements ISubmissionRepository {
  submitPostToChallenge(
    challengeId: string,
    submitterId: string,
    submittedPostId: string,
  ): Promise<ISubmission | null> {
    const post = new mongoose.Types.ObjectId(submittedPostId);
    const newSubmission = new SubmissionModel(challengeId, submitterId, post);
    return newSubmission.save();
  }
  async deleteSubmission(submissionId: string): Promise<ISubmission | null> {
    return await SubmissionModel.findByIdAndDelete(submissionId).exec();
  }
}
