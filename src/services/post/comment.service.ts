import { Types } from "mongoose";
import { CommentDTO } from "../../dtos/post/comment.dto";
import {
  IPostComment,
  PostCommentModel,
  PostModel,
} from "../../models/post/post.model";
import { PostCommentRepository } from "../../repositories/post/comment.repository";
import { PostRepository } from "../../repositories/post/post.repository";

const commentRepository = new PostCommentRepository();
const postRepository = new PostRepository();

export class CommentService {
  async createComment(
    data: CommentDTO,
    userId: string,
    postId: string,
  ): Promise<IPostComment | null> {
    console.log("SERVICE: createComment called");
    console.log("Data:", data);
    console.log("UserId:", userId, "PostId:", postId);

    // Avoid White Spaces by using trim
    userId = userId.trim();
    postId = postId.trim();

    console.log("trimmed userID:", userId);
    console.log("trimmed postid;", postId);
    if (!userId || !postId) {
      throw new Error("UserId and PostId are required");
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId");
    }

    if (!Types.ObjectId.isValid(postId)) {
      throw new Error("Invalid postId");
    }
    const commentDetails = {
      commentText: data.commentText,
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    };
    console.log("Comment details to save:", commentDetails);

    const comment = await commentRepository.createComment(commentDetails);

    // Increase Comment Count on post
    await postRepository.increaseCommentCount(postId, userId);
    console.log("Saved comment:", comment);
    return comment;
  }

  async deleteComment(
    userId: string,
    commentId: string,
  ): Promise<{ message: string }> {
    const comment = await commentRepository.getCommentById(commentId);
    console.log("Comment", comment);
    if (!comment) {
      throw new Error("Comment Doesnt Exist");
    }
    if (comment.userId.toString() !== userId) {
      throw new Error("You can only delete your own comments");
    }

    const postId = comment.postId;

    await commentRepository.deleteComment(commentId);

    await postRepository.decreaseCommentCount(postId.toString(), userId);

    return { message: "Comment deleted Successfully" };
  }

  async likeComment(
    commentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const comment = await commentRepository.getCommentById(commentId);
    if (!comment) {
      throw new Error("Comment Doesnt Exist");
    }
    const user = new Types.ObjectId(userId);
    // Check if user already liked
    if (comment.likedBy?.some((id) => id.equals(user))) {
      throw new Error("You have already liked this comment");
    }

    await commentRepository.likeComment(commentId, userId);

    // await PostCommentModel.findByIdAndUpdate(commentId, {
    //   $push: { likedBy: user },
    // });

    return { message: "Comment Liked" };
  }

  async unlikeComment(
    commentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const comment = await commentRepository.getCommentById(commentId);
    if (!comment) {
      throw new Error("Comment Doesnt Exist");
    }
    const user = new Types.ObjectId(userId);

    // Check if user has liked before unliking

    const hasLiked = comment.likedBy.some((id: Types.ObjectId) =>
      id.equals(user),
    );
    if (!hasLiked) {
      throw new Error("You have not liked this comment");
    }

    await commentRepository.unlikeComment(commentId, userId);

    // await PostCommentModel.findByIdAndUpdate(commentId, {
    //   $pull: { likedBy: user },
    // });

    return { message: "Comment Unliked" };
  }
}
