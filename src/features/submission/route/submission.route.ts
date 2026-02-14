import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { SubmissionController } from "../controller/submission.controller";
import { uploads } from "../../../middleware/upload.middleware";

const submissionController = new SubmissionController();
export const submissionRouter = Router();

// submit to challenge
submissionRouter.post(
  "/existing/:challengeId",
  authMiddleware,
  submissionController.submitExistingPost,
);

submissionRouter.post(
  "/new/:challengeId",
  authMiddleware,
  uploads.single("challenge-submissions"),
  submissionController.createNewPostAndSubmit,
);

// Get Submissions Routes
submissionRouter.get(
  "/get/:challengeId",
  authMiddleware,
  submissionController.getSubmissionsForChallenge,
);

// delete submission
submissionRouter.delete(
  "/delete/:submissionId",
  authMiddleware,
  submissionController.deleteSubmission,
);
export default submissionRouter;
