import { Request, Response } from "express";
import { AdminService } from "../service/admin.service";
import { success } from "zod";
import { AdminRepository } from "../repository/admin.repository";

const adminService = new AdminService();
export class AdminController {
  // User Operations
  getAllusers = async (req: Request, res: Response) => {
    try {
      const users = await adminService.getAllUsers();
      return res.status(200).json({
        success: true,
        message: "Users Fetched Successfully",
        users: users,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  getUserById = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "user not found",
        });
      }
      const user = await adminService.getUserById(userId);
      return res.status(200).json({
        success: true,
        message: "user fetched successfully",
        user: user,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  getUserByusername = async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      if (!username) {
        return res.status(400).json({
          success: false,
          message: "Username not passed",
        });
      }
      const user = await adminService.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "A user of this username doesnt exist",
        });
      }
      return res
        .status(200)
        .json({ success: true, message: "User Found", user: user });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(404).json({
          success: false,
          message: "user not found",
        });
      }
      await adminService.deleteUser(userId);
      return res
        .status(200)
        .json({ success: true, message: "User Deleted", user: userId });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  deleteAllUsers = async (req: Request, res: Response) => {
    try {
      await adminService.deleteAllUsers();
      return res
        .status(200)
        .json({ success: true, message: "All users deleted" });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  // Post Operations
  getAllPosts = async (req: Request, res: Response) => {
    try {
      const posts = await adminService.getAllPosts();
      return res.status(200).json({
        success: true,
        message: "Posts Fetched Successfully",
        posts: posts,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  getPostByUser = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res
          .status(404)
          .json({ success: false, message: "UserId not passed" });
      }
      const userPosts = await adminService.getPostsByUser(userId);
      if (!userPosts) {
        return res
          .status(404)
          .json({ success: false, message: "User has no posts" });
      }
      return res.status(200).json({
        success: true,
        message: "Posts Fetched Successfully",
        posts: userPosts,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  getPostById = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      if (!postId) {
        return res
          .status(404)
          .json({ success: false, message: "postId not passed" });
      }
      const post = await adminService.getPostById(postId);
      return res.status(200).json({
        success: true,
        message: "Post Fetched Successfully",
        post: post,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  deletePost = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      if (!postId) {
        return res
          .status(404)
          .json({ success: false, message: "postId not passed" });
      }
      await adminService.deletePost(postId);
      return res.status(200).json({
        success: true,
        message: "Post Deleted Successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  deleteAllPostsByUser = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res
          .status(404)
          .json({ success: false, message: "UserId not passed" });
      }
      await adminService.deleteAllPostsByUser(userId);
      return res.status(200).json({
        success: true,
        message: "All Posts by the user deleted",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };
}
