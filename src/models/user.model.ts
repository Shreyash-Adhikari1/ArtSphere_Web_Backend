// src/models/user.model.ts
import mongoose, { Document, Schema } from "mongoose";
import { number } from "zod";

export interface IUser extends Document {
    fullName: string;
    username: string;
    email: string;
    password: string;
    phoneNumber?: string;
    address?: string;
    role: "user" | "moderator";
    bio?:string;
    avatar?:string;
    followerCount:number;
    followingCount: number;
    postCount: number;
    
}

const UserSchema: Schema<IUser> = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true, lowercase:true, index:true },
        password: { type: String, required: true, select:false },
        phoneNumber: { type: String },
        address: { type: String },
        role: { type: String, enum:["user", "moderator"], default:"user"},  
        bio: { type: String },
        avatar: { type: String},
        followerCount: { type: Number, default:0},
        followingCount: { type: Number, default:0},
        postCount: { type: Number, default:0}, 
    },
    { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);