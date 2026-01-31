import { FollowDTO } from "../dto/follow.dto";
import { IFollow } from "../model/follow.model";
import { UserModel } from "../../user/model/user.model";
import { FollowRepository } from "../repository/follow.repository";
import { UserRepository } from "../../user/repository/user.repository";

const followRepository = new FollowRepository();
const userRepository = new UserRepository();

export class FollowService {
  async follow(
    followerId: string,
    followData: FollowDTO,
  ): Promise<IFollow | null> {
    const parsed = FollowDTO.safeParse(followData);
    if (!parsed.success) {
      throw new Error("Invalid Follow Data");
    }

    // Using the Dto to get userId to follow instead of hard coding it
    const followingId = parsed.data.following;

    if (followerId == followingId) {
      throw new Error("You cannot follow or unfollow yourself");
    }

    if (!followingId) {
      throw new Error("User does not exist");
    }
    const isAlreadyFollowing = await followRepository.isFollowing(
      followerId,
      followingId,
    ); // check if user already folloes another user

    if (isAlreadyFollowing) {
      throw new Error("You are already following this user");
    }

    const newFollow = await followRepository.follow(followerId, followingId);

    // Update Follower Count in User Model
    await userRepository.increaseFollowerCount(followingId);
    // await UserModel.findByIdAndUpdate(followingId, {
    //   $inc: { followerCount: 1 },
    // });
    await userRepository.increaseFollowingCount(followerId);
    // await UserModel.findByIdAndUpdate(followerId, {
    //   $inc: { followingCount: 1 },
    // });

    return newFollow;
  }

  async unfollow(
    followerId: string,
    followData: FollowDTO,
  ): Promise<IFollow | null> {
    const parsed = FollowDTO.safeParse(followData);
    if (!parsed.success) {
      throw new Error("Invalid follow data");
    }
    const followingId = parsed.data.following;

    if (!followingId) {
      throw new Error("User Doesnt Exist");
    }
    if (followerId == followingId) {
      throw new Error("You cannot follow or unfollow yourself");
    }
    const isFollowed = await followRepository.isFollowing(
      followerId,
      followingId,
    );
    if (!isFollowed) {
      throw new Error("You do not follow this user");
    }

    const newUnfollow = await followRepository.unfollow(
      followerId,
      followingId,
    );

    await userRepository.decreaseFollowerCount(followingId);

    // await UserModel.findByIdAndUpdate(followingId, {
    //   $inc: { followerCount: -1 },
    // });

    await userRepository.decreaseFollowingCount(followerId);
    // await UserModel.findByIdAndUpdate(followerId, {
    //   $inc: { followingCount: -1 },
    // });

    return newUnfollow;
  }

  async getFollowers(userId: string): Promise<IFollow[]> {
    return await followRepository.getFollowers(userId);
  }

  async getFollowing(userId: string): Promise<IFollow[]> {
    return await followRepository.getFollowing(userId);
  }
}
