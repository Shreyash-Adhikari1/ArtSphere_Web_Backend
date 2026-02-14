import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { ChallengeController } from "../controller/challenge.controller";
import { uploads } from "../../../middleware/upload.middleware";

export const challengeRouter = Router();
const challengeController = new ChallengeController();

// Create Challenge Route
challengeRouter.post(
  "/create",
  authMiddleware,
  uploads.single("challenge-images"),
  challengeController.createChallenge,
);

// Update Challenge Route
challengeRouter.patch(
  "/edit/:challengeId",
  authMiddleware,
  uploads.single("challenge-images"),
  challengeController.editChallenge,
);

// Get Challenge Routes
challengeRouter.get("/getall", challengeController.getAllChallenges);
challengeRouter.get(
  "/getmy",
  authMiddleware,
  challengeController.getChallengesByUser,
);
challengeRouter.get(
  "/:challengeId",
  authMiddleware,
  challengeController.getChallengeById,
);

// Delete Challenge Routes
challengeRouter.delete(
  "/delete/:challengeId",
  authMiddleware,
  challengeController.deleteChallenge,
);

challengeRouter.delete(
  "/delete/all-my-challenges",
  authMiddleware,
  challengeController.deleteAllChallengesByUser,
);

export default challengeRouter;
