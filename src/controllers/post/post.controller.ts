import { Request, Response } from "express";
import { PostService } from "../../services/post/post.service";
import { CreatePostDTO, EditPostDTO } from "../../dtos/post/post.dto";

const postService = new PostService();

export class PostController {
  createPost = async (req: Request, res: Response) => {
    try {
      const postDetailsParsed = CreatePostDTO.safeParse(req.body);
      if (!postDetailsParsed.success) {
        return res
          .status(401)
          .json({ success: false, message: "Create Post Failed" });
      }
      const userId = (req as any).user.id; //userId is taken from jwt and is not given by the user/client
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Unauthorized || Author unauthorized",
        });
      }

      const post = await postService.createPost(userId, postDetailsParsed.data);

      return res
        .status(200)
        .json({ success: true, message: "Post Created Successfully!", post });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error.message || "Create post Failed!!" });
    }
  };

  editPost = async (req: Request, res: Response) => {
    try {
      const editDetailsParsed = EditPostDTO.safeParse(req.body);
      if (!editDetailsParsed.success) {
        return res.status(400).json({
          message: "Invalid Edit Data",
          errors: editDetailsParsed.error.format(),
        });
      }
      const userId = (req as any).user.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized access denied" });
      }
      const { postId } = req.params;
      if (!postId) {
        return res.status(400).json({ message: "Post ID is required" });
      }

      const updatedPost = await postService.editPost(
        userId,
        postId,
        editDetailsParsed.data,
      );

      return res
        .status(200)
        .json({ message: "Post Edited Succesfully", post: updatedPost });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error.message || "Edit Post Failed!!" });
    }
  };

  deletePost = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized access denied" });
      }
      const { postId } = req.params;
      if (!postId) {
        return res.status(400).json({ message: "Post ID is required" });
      }

      const deletedPost = await postService.deletePost(userId, postId);

      if (!deletedPost) {
        return res
          .status(404)
          .json({ message: "Post not found or not owned by user" });
      }
      return res.status(200).json({ message: "Post Deleted Successfully" });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error.message || "Post Delete Failed" });
    }
  };

  getFeed = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized access denied" });
      }
      const posts = await postService.getFeed(userId);
      return res
        .status(200)
        .json({ message: "Posts fetched Successfully", posts });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error.message || "Fetching Posts Failed" });
    }
  };

  getPostByUser = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          message: "User ID is required",
        });
      }

      const posts = await postService.getPostsByUser(userId);

      return res.status(200).json({
        message: "User posts fetched successfully",
        posts,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Failed to fetch user posts",
      });
    }
  };

  likePost = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { postId } = req.params;
      // console.log("controller User Id:", userId);
      // console.log("controller post id:", postId);

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Uauthorized Access Denied" });
      }
      if (!postId) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }
      const like = await postService.likePost(postId, userId);
      return res.status(201).json({ success: true, message: "Post Liked" });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  unlikePost = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { postId } = req.params;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Uauthorized Access Denied" });
      }
      if (!postId) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }
      const like = await postService.unlikePost(postId, userId);
      return res.status(201).json({ success: true, message: "Post Unliked" });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };
}
