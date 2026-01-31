import { z } from "zod";

export const PostSchema = z.object({
  _id: z.string().optional(),
  author: z.string().optional(),
  media: z.string(),
  mediaType: z.enum(["image", "video"]),
  caption: z.string().max(2000).optional(),
  tags: z.string().transform((val) => val.split(",")),
  visibility: z.enum(["public", "followers", "private"]).default("public"),
  likeCount: z.number().default(0),
  commentCount: z.number().default(0),
  isDeleted: z.boolean().default(false),
});

export type Post = z.infer<typeof PostSchema>;
