import z from "zod";
import { PostCommentSchema } from "../../types/post/comment.type";

export const CommentDTO = PostCommentSchema.pick({
  commentText: true,
});
export type CommentDTO = z.infer<typeof CommentDTO>;
