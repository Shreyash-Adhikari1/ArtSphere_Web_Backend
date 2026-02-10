import { Request, Response } from "express";
import { EditUserDTO, LoginUserDTO, RegisterUserDTO } from "../dto/user.dto";
import { UserService } from "../service/user.service";

const userService = new UserService();

export class UserController {
  registerUser = async (req: Request, res: Response) => {
    try {
      console.log("Starting registration proces");

      const registerDetailsParsed = RegisterUserDTO.safeParse(req.body);
      console.log(registerDetailsParsed);

      if (!registerDetailsParsed.success) {
        return res
          .status(400)
          .json({ success: false, message: "Registration Failed" });
      }

      const user = await userService.createUser(registerDetailsParsed.data);

      console.log("Registration for user successful: ", user);

      return res.status(200).json({
        success: true,
        message: "User Registration Successfull",
        user,
      });
    } catch (error: any) {
      // Handling unknown errors
      return res.status(500).json({
        success: false,
        message: error.message || "User Registration Failed",
      });
    }
  };

  loginUser = async (req: Request, res: Response) => {
    const loginDetailsParsed = LoginUserDTO.safeParse(req.body);

    try {
      if (!loginDetailsParsed.success) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid Credentials" });
      }

      const { email, password } = loginDetailsParsed.data;

      const loginResult = await userService.loginUser(email, password);

      return res.status(201).json({
        success: true,
        message: "Login Successful",
        token: loginResult.token,
        user: loginResult.user,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "User Login Failed",
      });
    }
  };

  getProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      const user = await userService.getUserById(userId);

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        message: error.message || "User not found",
      });
    }
  };

  editProfile = async (req: Request, res: Response) => {
    console.log(req.file);
    try {
      const editDetailsParsed = EditUserDTO.safeParse(req.body);

      if (!editDetailsParsed.success) {
        return res.status(400).json({
          message: "Invalid input",
          errors: editDetailsParsed.error.format(),
        });
      }
      const userId = (req as any).user.id;
      // if (!req.file) {
      //   return res.status(400).json({ message: "No file uploaded" });
      // }
      // Extract filename from multer
      const avatarFileName = req.file?.filename;

      const updatedUser = await userService.updateUser(userId, {
        ...editDetailsParsed.data,
        avatar: avatarFileName,
      });
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Something went wrong",
      });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      const userId = await (req as any).user.id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "User Doesnt Exist" });
      }
      userService.deleteUser(userId);
      return res
        .status(200)
        .json({ success: true, message: "User Deleted Successfully" });
    } catch (error: any) {
      return res
        .status(500)
        .json({ success: false, message: "User Delete Failed" });
    }
  };

  getAllusers = async (req: Request, res: Response) => {
    try {
      const users = await userService.getAllUsers();
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

  sendResetPasswordEmail = async (req: Request, res: Response) => {
    try {
      const email = req.body.email;
      const user = await userService.sendResetPasswordEmail(email);
      return res.status(200).json({
        success: true,
        data: user,
        message: "If the email is registered, a reset link has been sent.",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const token = req.params.token;
      const { newPassword } = req.body;
      await userService.resetPassword(token, newPassword);
      return res.status(200).json({
        success: true,
        message: "Password has been reset successfully.",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };
}
