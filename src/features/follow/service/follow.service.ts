import { IFollow } from "../model/follow.model";
import { FollowRepository } from "../repository/follow.repository";
import { UserRepository } from "../../user/repository/user.repository";
import { Types } from "mongoose";
import { HttpError } from "../../../errors/http-error";

const followRepository = new FollowRepository();
const userRepository = new UserRepository();

export class FollowService {
  async follow(
    followerId: string,
    followingId: string,
  ): Promise<IFollow | null> {
    const userToFollow = new Types.ObjectId(followingId).toString();
    if (!userToFollow) {
      throw new HttpError(404, "User to follow not found");
    }
    if (followerId == userToFollow) {
      throw new HttpError(400, "You cannot follow or unfollow yourself");
    }
    const isAlreadyFollowed = await followRepository.isFollowing(
      followerId,
      userToFollow,
    );
    if (isAlreadyFollowed) {
      throw new HttpError(400, "You already follow this user");
    }
    const newFollow = await followRepository.follow(followerId, userToFollow);
    await userRepository.increaseFollowerCount(userToFollow);
    await userRepository.increaseFollowingCount(followerId);

    return newFollow;
  }

  async unfollow(
    followerId: string,
    followingId: string,
  ): Promise<IFollow | null> {
    const userToUnfollow = new Types.ObjectId(followingId).toString();
    if (!userToUnfollow) {
      throw new HttpError(404, "User to unfollow not found");
    }
    const isAlreadyFollowed = await followRepository.isFollowing(
      followerId,
      userToUnfollow,
    );
    if (!isAlreadyFollowed) {
      throw new HttpError(400, "You do not follow this user");
    }
    const unfollow = await followRepository.unfollow(
      followerId,
      userToUnfollow,
    );
    await userRepository.decreaseFollowerCount(userToUnfollow);

    // await UserModel.findByIdAndUpdate(followingId, {
    //   $inc: { followerCount: -1 },
    // });

    await userRepository.decreaseFollowingCount(followerId);
    // await UserModel.findByIdAndUpdate(followerId, {
    //   $inc: { followingCount: -1 },
    // });

    return unfollow;
  }

  async getFollowers(userId: string): Promise<IFollow[]> {
    return await followRepository.getFollowers(userId);
  }

  async getFollowing(userId: string): Promise<IFollow[]> {
    return await followRepository.getFollowing(userId);
  }
}
