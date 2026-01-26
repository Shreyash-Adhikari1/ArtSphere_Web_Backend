import { z } from "zod";

export const PostSchema = z.object({
    _id: z.string().optional(),
    author: z.string().optional(),
    mediaUrl: z.string().url(),
    mediaType: z.enum(["image", "video"]),
    caption: z.string().max(2000).optional(),
    tags: z.array(z.string()).optional(),
    visibility: z.enum(["public", "followers", "private"]).default("public"),
    likeCount: z.number().default(0),
    commentCount: z.number().default(0),
    isDeleted: z.boolean().default(false)
});

export type Post = z.infer<typeof PostSchema>;
