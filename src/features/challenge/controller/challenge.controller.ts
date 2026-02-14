import { Request, Response } from "express";
import { CreateChallengeDTO, EditChallengeDTO } from "../dto/challenge.dto";
import { ChallengeService } from "../service/challenge.service";
import { success } from "zod";
const challengeService = new ChallengeService();

export class ChallengeController {
  createChallenge = async (req: Request, res: Response) => {
    try {
      const challengeDetails = CreateChallengeDTO.safeParse(req.body);
      console.log("Challenge Details parse bhayo hai", challengeDetails);
      if (!challengeDetails.success) {
        return res.status(400).json({
          success: false,
          message: "Bad Request || All fields are not provided",
        });
      }
      const userId = (req as any).user.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized || Author unauthorized",
        });
      }
      const challengeMediaFile = req.file?.filename;
      const challenge = await challengeService.createChallenge(userId, {
        ...challengeDetails.data,
        challengeMedia: challengeMediaFile,
      });
      console.log("Aayo hai", challenge);
      return res.status(201).json({
        success: true,
        message: "challenge created successfully",
        challenge: challenge,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  editChallenge = async (req: Request, res: Response) => {
    try {
      const editChallengeDetails = EditChallengeDTO.safeParse(req.body);
      if (!editChallengeDetails.success) {
        return res.status(400).json({
          success: false,
          message: "Bad Request || Invalid Edit Data",
          errors: editChallengeDetails.error.format(),
        });
      }

      const userId = (req as any).user.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized access denied" });
      }
      const { challengeId } = req.params;
      if (!challengeId) {
        return res.status(400).json({ message: "Challenge ID is required" });
      }

      const updatedChallenge = await challengeService.updateChallenge(
        userId,
        challengeId,
        editChallengeDetails.data,
      );
      return res.status(200).json({
        message: "Challenge Edited Succesfully",
        challenge: updatedChallenge,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  deleteChallenge = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized access denied" });
      }
      const { challengeId } = req.params;
      if (!challengeId) {
        return res.status(400).json({ message: "Challenge ID is required" });
      }
      const deletedChallenge = await challengeService.deleteChallenge(
        userId,
        challengeId,
      );

      if (!deletedChallenge) {
        return res
          .status(404)
          .json({ message: "Challenge not found or not owned by user" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Challenge Deleted Successfully" });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  deleteAllChallengesByUser = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized access denied" });
      }
      const deletedChallenges =
        await challengeService.deleteAllChallengesByUser(userId);
      if (!deletedChallenges) {
        return res
          .status(404)
          .json({ message: "Challenges not found or not owned by user" });
      }
      return res.status(200).json({
        success: true,
        message: " All Challenges by user deleted successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  getAllChallenges = async (req: Request, res: Response) => {
    try {
      const challenges = await challengeService.getAllChallenges();
      return res.status(200).json({
        sucess: true,
        message: "Challenges fetched successfully",
        challenges: challenges,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  getChallengesByUser = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized access denied" });
      }
      const challenges = await challengeService.getChallengesByUser(userId);
      return res.status(200).json({
        sucess: true,
        message: "Challenges by user fetched successfully",
        challenges: challenges,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  getChallengeById = async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      if (!challengeId) {
        return res
          .status(400)
          .json({ success: false, message: "Challenge ID is required" });
      }

      const challenge = await challengeService.getChallengeById(challengeId);

      return res.status(200).json({
        success: true,
        message: "Challenge fetched successfully",
        challenge,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };
}
