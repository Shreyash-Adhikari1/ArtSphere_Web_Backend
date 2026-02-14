import { ChallengeModel, IChallenge } from "../model/challenge.model";

export interface IChallengeRepository {
  // Create Challenge Repo Logic
  createChallenge(challenge: Partial<IChallenge>): Promise<IChallenge | null>;

  // Update Logi
  updateChallenge(
    challengeId: string,
    updateData: Partial<IChallenge>,
  ): Promise<IChallenge | null>;

  // Retireve/Get Logics
  getAllChallenges(skip?: number, limit?: number): Promise<IChallenge[]>;
  getChallengebyId(challengeId: string): Promise<IChallenge | null>;
  getChallengesByUser(userId: string): Promise<IChallenge[]>;

  // Delete Logic
  deleteChallenge(challengeId: string): Promise<IChallenge | null>;
  deleteAllChallengesByUser(userId: string): Promise<{ deletedCount: number }>;
}

export class ChallengeRepository implements IChallengeRepository {
  // ===================== Create A Challenge ============

  async createChallenge(
    challenge: Partial<IChallenge>,
  ): Promise<IChallenge | null> {
    const createdChallenge = new ChallengeModel(challenge);
    return createdChallenge.save();
  }

  //========================== Update Challenge ============================================
  async updateChallenge(
    challengeId: string,
    updateData: Partial<IChallenge>,
  ): Promise<IChallenge | null> {
    return await ChallengeModel.findByIdAndUpdate(
      challengeId,
      {
        $set: updateData,
      },
      { new: true },
    ).exec();
  }

  // ================ Below Are All Retrieve/ Get Logics implementations========================

  async getAllChallenges(
    skip: number = 0,
    limit: number = 10,
  ): Promise<IChallenge[]> {
    return await ChallengeModel.find()
      .skip(skip)
      .limit(limit)
      .populate("challengerId", "_id username avatar")
      .exec();
  }

  async getChallengebyId(challengeId: string): Promise<IChallenge | null> {
    return await ChallengeModel.findById(challengeId)
      .populate("challengerId", "_id username avatar")
      .exec();
  }

  async getChallengesByUser(
    userId: string,
    skip = 0,
    limit = 10,
  ): Promise<IChallenge[]> {
    return await ChallengeModel.find({ challengerId: userId })
      .skip(skip)
      .populate("challengerId", "_id username avatar")
      .limit(limit)
      .exec();
  }

  // ================== Delete Challenge Logics =====================
  async deleteChallenge(challengeId: string): Promise<IChallenge | null> {
    const challenge =
      await ChallengeModel.findByIdAndDelete(challengeId).exec();
    return challenge;
  }

  async deleteAllChallengesByUser(
    userId: string,
  ): Promise<{ deletedCount: number }> {
    const deleted = await ChallengeModel.deleteMany({
      challengerId: userId,
    }).exec();
    return deleted;
  }

  // ================ Misc Logic ==================
  async closeChallenge(challengeId: string): Promise<IChallenge | null> {
    return await ChallengeModel.findByIdAndUpdate(
      challengeId,
      { $set: { status: "closed" } },
      { new: true },
    );
  }
}
