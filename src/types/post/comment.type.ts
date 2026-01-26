import { z } from "zod";

export const PostCommentSchema = z.object({
  userId: z.string().optional(),
  postId: z.string().optional(),
  commentText: z.string().min(1, "Comment cannot be empty"),
  likeCount: z.number().default(0),
});

export type PostComment = z.infer<typeof PostCommentSchema>;
