import mongoose, { Document, Schema } from "mongoose";
import { string } from "zod";

export interface IChallenge extends Document {
  challengerId: mongoose.Types.ObjectId;
  title: string;
  challengeDescription: string;
  challengeMedia: string;

  submissionCount: number;
  submitters: mongoose.Types.ObjectId[];
  submittedPosts: mongoose.Types.ObjectId[];

  status: "open" | "closed";
  endsAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>(
  {
    challengerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    challengeDescription: {
      type: String,
      required: true,
    },

    challengeMedia: {
      type: String,
    },

    submissionCount: {
      type: Number,
      default: 0,
    },

    submitters: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],

    submittedPosts: [{ type: Schema.Types.ObjectId, ref: "Post", index: true }],

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },

    endsAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

export const ChallengeModel = mongoose.model<IChallenge>(
  "Challenge",
  ChallengeSchema,
);
