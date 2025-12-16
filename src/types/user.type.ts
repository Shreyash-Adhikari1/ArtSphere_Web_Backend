import { z } from "zod";

export const UserSchema = z.object({
    _id: z.string().optional(),
    fullName: z.string(),
    username: z.string(),
    email: z.string().email(),
    password: z.string(),
    confirmPassword: z.string().optional(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    role: z.enum(["user", "moderator"]).default("user"),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    followerCount: z.number().default(0),
    followingCount: z.number().default(0),
    postCount: z.number().default(0)
});

export type User = z.infer<typeof UserSchema>;