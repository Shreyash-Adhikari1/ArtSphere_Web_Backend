import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { FollowController } from "../controller/follow.controller";
const followRouter = Router();
const followController = new FollowController();

// follow and unfollow routes
followRouter.post("/follow", authMiddleware, followController.follow);
followRouter.post("/unfollow", authMiddleware, followController.unfollow);

// get routes
followRouter.get("/followers", authMiddleware, followController.getFollowers);
followRouter.get("/following", authMiddleware, followController.getFollowing);

export default followRouter;
