import { FollowModel, IFollow } from "../model/follow.model";

export interface FollowRepositoryInterface {
  follow(followerId: string, followingId: string): Promise<IFollow | null>;
  unfollow(followerId: string, followingId: string): Promise<IFollow | null>;
  getFollowers(userId: string): Promise<IFollow[]>;
  getFollowing(userId: string): Promise<IFollow[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
}

export class FollowRepository implements FollowRepositoryInterface {
  // Create a follow document
  async follow(
    followerId: string,
    followingId: string,
  ): Promise<IFollow | null> {
    const newFollow = new FollowModel({
      follower: followerId,
      following: followingId,
    });
    await newFollow.save(); // saves to DB

    return FollowModel.findById(newFollow._id)
      .populate("follower", "username")
      .populate("following", "username")
      .exec() as Promise<IFollow>;
  }

  // Hard-delete / unfollow
  async unfollow(
    followerId: string,
    followingId: string,
  ): Promise<IFollow | null> {
    // Find and delete the follow document
    const deletedFollow = await FollowModel.findOneAndDelete({
      follower: followerId,
      following: followingId,
    })
      .populate("follower", "username")
      .populate("following", "username")
      .exec();

    if (!deletedFollow) {
      throw new Error("You do not follow this user");
    }

    return deletedFollow;
  }

  // Get all users who follow this user
  async getFollowers(userId: string): Promise<IFollow[]> {
    return FollowModel.find({ following: userId, isDeleted: false })
      .populate("follower", "_id username") // optionally populate the follower info
      .exec();
  }

  // Get all users that this user is following
  async getFollowing(userId: string): Promise<IFollow[]> {
    return FollowModel.find({ follower: userId, isFollowActive: false })
      .populate("following", "_id username") // optionally populate the followed user info
      .exec();
  }

  // Check if followerId is following followingId
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await FollowModel.findOne({
      follower: followerId,
      following: followingId,
      isFollowActive: false,
    }).exec();
    return !!follow;
  }
}
