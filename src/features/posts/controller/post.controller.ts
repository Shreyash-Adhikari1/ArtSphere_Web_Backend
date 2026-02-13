import { Request, Response } from "express";
import { CreatePostDTO, EditPostDTO } from "../dto/post.dto";
import { PostService } from "../service/post.service";

const postService = new PostService();

export class PostController {
  createPost = async (req: Request, res: Response) => {
    // console.log("create post chahi call bhayo");
    try {
      // console.log("create post Call try block");
      const postDetailsParsed = CreatePostDTO.safeParse(req.body);
      console.log("Post Details :", postDetailsParsed);
      if (!postDetailsParsed.success) {
        return res
          .status(401)
          .json({ success: false, message: "Create Post Failed" });
      }
      const userId = (req as any).user.id; //userId is taken from jwt and is not given by the user/client
      if (!req.file) {
        return res.status(400).json({ message: "Media file is required" });
      }
      console.log("Media Aayo, aba agaadi jaaney");
      // const postFileName = req.file.filename ?? "test-file";
      const postFileName =
        (req.file as any)?.filename ??
        `test-${Date.now()}-${req.file?.originalname ?? "image.jpg"}`;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Unauthorized || Author unauthorized",
        });
      }
      console.log("jaaney data", postDetailsParsed.data);
      const post = await postService.createPost(userId, {
        ...postDetailsParsed.data,
        media: postFileName,
      });
      console.log("gaako Data:", post);

      return res
        .status(200)
        .json({ success: true, message: "Post Created Successfully!", post });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Create post Failed!!(Internal Server)",
      });
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

  getMyPosts = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

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

  getPostsByUser = async (req: Request, res: Response) => {
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
