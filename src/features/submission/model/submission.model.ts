import mongoose, { Document, Schema } from "mongoose";

export interface ISubmission extends Document {
  submitterId: mongoose.Types.ObjectId;
  challengeId: mongoose.Types.ObjectId;
  submittedPostId: mongoose.Types.ObjectId;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    submitterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    challengeId: {
      type: Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
      index: true,
    },
    submittedPostId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export const SubmissionModel = mongoose.model<ISubmission>(
  "Submission",
  SubmissionSchema,
);
