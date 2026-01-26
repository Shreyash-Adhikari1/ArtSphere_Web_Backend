import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { PostController } from "../../controllers/post/post.controller";

const postRouter = Router();
const postController = new PostController();

// Create and Edit routes
postRouter.post("/create", authMiddleware, postController.createPost);
postRouter.patch("/edit", authMiddleware, postController.editPost);

// Fetch Routes
postRouter.get("/post", authMiddleware, postController.getFeed);
postRouter.get("/post/:id", authMiddleware, postController.getPostByUser);

// Delete Routes
postRouter.delete("/delete/:postId", authMiddleware, postController.deletePost);
// postRouter.delete("/delete/:postId", (req, res) => {
//     res.send("DELETE ROUTE HIT");
// });

// like and unlike routes

postRouter.post("/like/:postId", authMiddleware, postController.likePost);
postRouter.post("/unlike/:postId", authMiddleware, postController.unlikePost);

export default postRouter;
