// src/models/post.model.ts
import mongoose, { Schema, Document } from "mongoose";
import { time } from "node:console";
import { string } from "zod";

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  media: string;
  mediaType: "image" | "video";
  caption?: string;
  tags?: string[];
  visibility: "public" | "followers" | "private";
  likeCount: number;
  likedBy: mongoose.Types.ObjectId[];
  commentCount: number;
  commentedBy: mongoose.Types.ObjectId[];
  isDeleted: boolean;
}

const PostSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    media: { type: String, required: true },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
      required: true,
    },

    caption: { type: String, trim: true, maxlength: 2000 },

    tags: { type: [String], index: true },

    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public",
    },

    likeCount: { type: Number, default: 0 },

    likedBy: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],

    commentCount: { type: Number, default: 0 },

    commentedBy: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const PostModel = mongoose.model<IPost>("Post", PostSchema);

export interface IPostComment extends Document {
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  commentText: string;
  likeCount: number;
  likedBy: mongoose.Types.ObjectId[];
}
const PostCommentSchema = new Schema<IPostComment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    commentText: { type: String, required: true, trim: true, maxLength: 2000 },
    likeCount: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
  },
  { timestamps: true },
);
export const PostCommentModel = mongoose.model<IPostComment>(
  "PostComment",
  PostCommentSchema,
);
