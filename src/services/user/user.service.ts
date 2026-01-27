import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  UserRepository,
  UserRepositoryInterface,
} from "../../repositories/user/user.repository";
import { IUser } from "../../models/user/user.model";
import { EditUserDTO, RegisterUserDTO } from "../../dtos/user/user.dto";

const userRepository: UserRepositoryInterface = new UserRepository();
dotenv.config();

export class UserService {
  //    helper function: Filter user object to exclude password and the version key that mongoose creates

  // doing this because we dont want password going everywhere
  private sanitizeUser(user: IUser) {
    const userObj = user.toObject();
    const { password, __v, ...safeUser } = userObj; // here __v is version key [mongoose generates it automatically]
    return safeUser;
  }

  // create user  [for registration]

  async createUser(data: RegisterUserDTO) {
    const existingUser = await userRepository.findByEmailOrUsername(
      data.email,
      data.username,
    );

    if (existingUser) {
      throw new Error("User with this email or username already exists");
    }

    // Hash password for security reasons
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userToCreate = {
      fullName: data.fullName,
      username: data.username,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      phoneNumber: data.phoneNumber,
      address: data.address,
    };

    const user = await userRepository.createUser(userToCreate);
    return this.sanitizeUser(user);
  }

  //  login function [jwt token is created here and not in controller because its easier that way]

  async loginUser(email: string, password: string) {
    const user = await userRepository.findByEmailOrUsername(email, email);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Because password has select:false [done in model || cant access directly], we must explicitly select it
    const userWithPassword = await userRepository.getUserWithPassword(
      user._id.toString(),
    );
    if (!userWithPassword) {
      throw new Error("Authentication failed");
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      userWithPassword.password,
    );

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // token geneation after login
    const token = jwt.sign(
      {
        id: user._id.toString(), // .toString() done because JWT payload should be JSON-serializable
        role: user.role,
      },
      process.env.JWT_SECRET_TOKEN!,
      { expiresIn: "10d" },
    );

    const safeUser = this.sanitizeUser(user);

    return { token, user: safeUser };
  }

  // update user logic

  async updateUser(userId: string, data: EditUserDTO) {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");

    // Prevent email / username collisions
    if (data.email || data.username) {
      const existingUser = await userRepository.findByEmailOrUsername(
        data.email ?? "",
        data.username ?? "",
      );

      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error("Email or username already in use");
      }
    }

    const updatedUser = await userRepository.updateUser(userId, data);
    if (!updatedUser) throw new Error("Failed to update user");

    return this.sanitizeUser(updatedUser);
  }

  //  Below functions alll are used for "get" operations, basically get from db and show type shi

  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const users = await userRepository.getAllUsers(skip, limit);
    return users.map((user) => this.sanitizeUser(user));
  }

  async getUserById(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");
    return this.sanitizeUser(user);
  }

  async getUserByUsername(username: string) {
    const user = await userRepository.getUserByUsername(username);
    if (!user) throw new Error("User not found");
    return this.sanitizeUser(user);
  }

  // Delete user logic

  async deleteUser(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new Error("User not found");

    await userRepository.deleteUser(userId);
    return { message: "User deleted successfully" };
  }
}
