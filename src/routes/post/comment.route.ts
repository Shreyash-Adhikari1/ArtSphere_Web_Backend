import { Router } from "express";
import { CommentController } from "../../controllers/post/comment.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const commentRouter = Router();
const commentController = new CommentController();

// Create comment
commentRouter.post(
  "/create/:postId",
  authMiddleware,
  commentController.createComment,
);

// delete comment
commentRouter.delete(
  "/delete/:commentId",
  authMiddleware,
  commentController.deleteComment,
);

// like comment
commentRouter.post(
  "/like/:commentId",
  authMiddleware,
  commentController.likeComment,
);

// unlike comment
commentRouter.post(
  "/unlike/:commentId",
  authMiddleware,
  commentController.unlikeComment,
);

export default commentRouter;
