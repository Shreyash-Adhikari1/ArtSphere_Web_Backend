import { Request, Response } from "express";
import { FollowService } from "../service/follow.service";
import { FollowDTO } from "../dto/follow.dto";

const followService = new FollowService();

export class FollowController {
  follow = async (req: Request, res: Response) => {
    try {
      const followDetailsParsed = FollowDTO.safeParse(req.body);
      if (!followDetailsParsed.success) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Follow Details" });
      }
      const followerId = (req as any).user.id; //userId is taken from jwt and is not given by the user/client
      if (!followerId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized || User unauthorized",
        });
      }
      const followed = await followService.follow(
        followerId,
        followDetailsParsed.data,
      );
      return res.status(200).json({
        success: true,
        message: "User Followed Successfully",
        data: {
          follower: followed?.follower,
          following: followed?.following,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  unfollow = async (req: Request, res: Response) => {
    try {
      const followDetailsParsed = FollowDTO.safeParse(req.body);
      if (!followDetailsParsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid Follow Data",
          error: followDetailsParsed.error,
        });
      }
      const followerId = (req as any).user.id;
      if (!followerId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized || User unauthorized",
        });
      }
      const unfollow = await followService.unfollow(
        followerId,
        followDetailsParsed.data,
      );
      return res.status(200).json({
        success: true,
        message: "User Unfollowed Successfully",
        data: {
          follower: unfollow?.follower,
          following: unfollow?.following,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  getFollowers = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized || User unauthorized",
        });
      }
      const followers = await followService.getFollowers(userId);
      return res.status(200).json({
        success: true,
        message: "Followers Fetched Successfully",
        data: followers,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  getFollowing = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized || User unauthorized",
        });
      }
      const following = await followService.getFollowing(userId);
      return res.status(200).json({
        success: true,
        message: "Following Fetched Successfully",
        data: following,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };
}
