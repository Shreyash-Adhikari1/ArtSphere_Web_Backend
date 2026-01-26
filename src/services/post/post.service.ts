import { Types } from "mongoose";
import { IPost, PostModel } from "../../models/post/post.model";
import { PostRepository } from "../../repositories/post/post.repository";
import { CreatePostDTO, EditPostDTO } from "../../dtos/post/post.dto";
import { UserRepository } from "../../repositories/user/user.repositroy";
import { UserModel } from "../../models/user/user.model";

const userRepository = new UserRepository();
const postRepository = new PostRepository();

export class PostService {
  async createPost(userId: string, data: CreatePostDTO): Promise<IPost> {
    if (!data.mediaUrl) {
      throw new Error("Post must contain media");
    }

    const postToCreate = {
      // MongoDB expects ObjectId, but request/JWT gives us a string
      // So we convert userId (string from JWT/request) into MongoDB ObjectId required by the Post model
      author: new Types.ObjectId(userId), // TRUST SERVER ONLY
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      caption: data.caption,
      tags: data.tags,
      visibility: data.visibility ?? "public",
    };
    const post = await postRepository.createPost(postToCreate);

    const postId = post._id.toString();

    const updatedUser = await userRepository.increasePostCount(userId, postId);

    console.log("Updated User After Post Created", updatedUser);
    return post;
  }

  async editPost(
    userId: string,
    postId: string,
    data: EditPostDTO,
  ): Promise<IPost> {
    const post = await postRepository.getPostById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Ownership check (CRITICAL)
    if (post.author.toString() !== userId) {
      throw new Error("You are not allowed to edit this post");
    }

    const updatedPost = await postRepository.editPost(postId, data);
    if (!updatedPost) {
      throw new Error("Failed to update post");
    }

    return updatedPost;
  }

  async deletePost(
    userId: string,
    postId: string,
  ): Promise<{ message: string }> {
    const post = await postRepository.getPostById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.author.toString() !== userId) {
      throw new Error("You are not allowed to delete this post");
    }

    await postRepository.deletePost(postId);
    await userRepository.decreasePostCount(userId, postId);

    return { message: "Post deleted successfully" };
  }

  async getFeed(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<IPost[]> {
    const skip = (page - 1) * limit;

    return await postRepository.getPublicFeed(skip, limit);
  }

  async getPostsByUser(userId: string): Promise<IPost[]> {
    return postRepository.getPostsByUser(userId);
  }

  async likePost(postId: string, userId: string): Promise<{ message: string }> {
    const post = await postRepository.getPostById(postId);
    // console.log("Service-userID", userId);
    // console.log("Service-postId", postId);
    if (!post) {
      throw new Error("Post Doesnt Exist");
    }
    const user = new Types.ObjectId(userId);
    if (post.likedBy.some((id) => id.equals(user))) {
      throw new Error("You have already liked this post");
    }

    await postRepository.likePost(postId, userId);

    // await PostModel.findByIdAndUpdate(postId, {
    //   $push: { likedBy: user },
    // });
    return { message: "Post Liked" };
  }

  async unlikePost(
    postId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const post = await postRepository.getPostById(postId);
    if (!post) {
      throw new Error("Post Doesnt Exist");
    }
    const user = new Types.ObjectId(userId);

    const hasLiked = post.likedBy.some((id: Types.ObjectId) => id.equals(user));
    if (!hasLiked) {
      throw new Error("You have already liked this post");
    }

    await postRepository.unlikePost(postId, userId);

    // await PostModel.findByIdAndUpdate(postId, {
    //   $pull: { likedBy: user },
    // });
    return { message: "Post Unliked" };
  }
}
