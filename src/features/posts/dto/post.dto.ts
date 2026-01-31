import z from "zod";
import { PostSchema } from "../type/post.type";

// Create Post DTO
export const CreatePostDTO = PostSchema.pick({
  media: true,
  mediaType: true,
  caption: true,
  tags: true,
  visibility: true,
}).partial();

export type CreatePostDTO = z.infer<typeof CreatePostDTO>;

// Edit post DTO
export const EditPostDTO = PostSchema.pick({
  caption: true,
  tags: true,
  visibility: true,
}).partial();

export type EditPostDTO = z.infer<typeof EditPostDTO>;
