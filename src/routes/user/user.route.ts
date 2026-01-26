import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { UserController } from "../../controllers/user/user.controller";

const userRouter = Router();
const userController = new UserController();

// Public routes

userRouter.post("/register", userController.registerUser);

userRouter.post("/login", userController.loginUser);

// Protected Routes
userRouter.get("/me", authMiddleware, userController.getProfile);

userRouter.patch("/me", authMiddleware, userController.editProfile);

userRouter.delete("/me", authMiddleware, userController.deleteUser);

userRouter.get("/users", userController.getAllusers);

export default userRouter;
