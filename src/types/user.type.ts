// src/types/user.type.ts
import { z } from "zod";

export const UserSchema = z.object({
    _id: z.string().optional(),
    fullName: z.string(),
    username: z.string(),
    email: z.string().email(),
    password: z.string(),
    confirmPassword: z.string().optional(),
    phoneNumber: z.string(),
    address: z.string().optional(),
    role: z.enum(["user", "moderator"]).optional(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    followerCount: z.number(),
    followingCount: z.number(),
    postCount: z.number() 
});

export type User = z.infer<typeof UserSchema>;