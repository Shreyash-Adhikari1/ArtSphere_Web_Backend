import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const userRouter = Router();
const userController = new UserController();

// Public routes

userRouter.post('/register', userController.registerUser);

userRouter.post('/login', userController.loginUser);

export default userRouter;