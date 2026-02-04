import { Types } from "mongoose";
import { CreateChallengeDTO, EditChallengeDTO } from "../dto/challenge.dto";
import { IChallenge } from "../model/challenge.model";
import { ChallengeRepository } from "../repository/challenge.repository";
import { HttpError } from "../../../errors/http-error";

const challengeRepository = new ChallengeRepository();
export class ChallengeService {
  async createChallenge(
    userId: string,
    data: CreateChallengeDTO,
  ): Promise<IChallenge | null> {
    const today = new Date();
    if (data.endsAt <= today) {
      throw new HttpError(400, "endsAt must be in the future");
    }
    const challengeToCreate = {
      challengerId: new Types.ObjectId(userId),
      challengeMedia: data.challengeMedia,
      challengeDescription: data.challengeDescription,
      challengeTitle: data.challengeTitle,
      endsAt: data.endsAt,
    };
    const challenge =
      await challengeRepository.createChallenge(challengeToCreate);
    return challenge;
  }

  async updateChallenge(
    userId: string,
    challengeId: string,
    data: EditChallengeDTO,
  ): Promise<IChallenge> {
    const challenge = await challengeRepository.getChallengebyId(challengeId);
    if (!challenge) {
      throw new HttpError(404, "Challenge Not Found");
    }
    if (challenge.challengerId._id.toString() !== userId) {
      throw new HttpError(403, "You are not allowed to edit this challenge");
    }
    const today = new Date();
    const endsAt = challenge.endsAt;
    if (endsAt <= today) {
      throw new HttpError(400, "Challenge cannot be edited after endsAt date");
    }
    if (endsAt <= today) {
      throw new HttpError(400, "endsAt must be in the future");
    }

    const updatedChallenge = await challengeRepository.updateChallenge(
      challengeId,
      data,
    );
    if (!updatedChallenge) {
      throw new HttpError(400, "Failed To Update Challenge");
    }

    return updatedChallenge;
  }

  async deleteChallenge(
    userId: string,
    challengeId: string,
  ): Promise<{ message: string }> {
    const challenge = await challengeRepository.getChallengebyId(challengeId);
    if (!challenge) {
      throw new HttpError(404, "Challenge Not Found");
    }
    console.log(userId);
    if (challenge.challengerId._id.toString() != userId) {
      throw new HttpError(403, "You are not allowed to delete this challenge");
    }
    await challengeRepository.deleteChallenge(challengeId);
    return { message: "Challenge deleted successfully" };
  }

  async deleteAllChallengesByUser(
    userId: string,
  ): Promise<{ message: string }> {
    await challengeRepository.deleteAllChallengesByUser(userId);
    return { message: "All challenges by user deleted" };
  }

  async getAllChallenges(
    page: number = 1,
    limit: number = 10,
  ): Promise<IChallenge[]> {
    const skip = (page - 1) * limit;
    return await challengeRepository.getAllChallenges(skip, limit);
  }

  async getChallengesByUser(userId: string): Promise<IChallenge[]> {
    return await challengeRepository.getChallengesByUser(userId);
  }
}
