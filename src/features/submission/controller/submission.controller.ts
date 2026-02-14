import { Request, Response } from "express";
import { SubmissionService } from "../service/submission.service";
import { CreatePostDTO } from "../../posts/dto/post.dto";

const submissionService = new SubmissionService();
export class SubmissionController {
  submitExistingPost = async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      const submitterId = (req as any).user.id; // from auth middleware
      const { postId } = req.body; // <-- existing post picked by user in UI

      if (!challengeId) {
        return res
          .status(400)
          .json({ success: false, message: "challengeId missing" });
      }
      if (!postId) {
        return res
          .status(400)
          .json({ success: false, message: "postId missing" });
      }
      console.log(submitterId);
      const submission = await submissionService.submitToChallenge(
        challengeId,
        submitterId,
        postId,
      );

      return res.status(201).json({
        success: true,
        message: "Submitted to challenge",
        submission,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  };

  createNewPostAndSubmit = async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      const userId = (req as any).user.id;

      //   Creating a Post to Submit
      const newPostDetails = CreatePostDTO.safeParse(req.body);
      if (!newPostDetails.success) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Post Details" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Media file is required" });
      }
      const postMedia = req.file.filename;
      const postData = {
        ...newPostDetails.data,
        media: postMedia,
      };

      //   Submission Logic
      const submit = await submissionService.createPostAndSubmit(
        challengeId,
        userId,
        postData,
      );
      return res.status(201).json({
        success: true,
        message: "Post submitted successfully",
        submission: submit,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Internal Server Error",
      });
    }
  };

  deleteSubmission = async (req: Request, res: Response) => {
    try {
      const submitterId = (req as any).user.id;
      if (!submitterId) {
        return res
          .status(400)
          .json({ success: false, message: "submitter not found" });
      }
      const { submissionId } = req.params;
      await submissionService.deleteSubmission(submissionId, submitterId);
      return res
        .status(200)
        .json({ success: true, message: "submission deleted successfully" });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Internal Server Error",
      });
    }
  };

  getSubmissionsForChallenge = async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      if (!challengeId) {
        return res
          .status(400)
          .json({ success: false, message: "challengeId missing" });
      }
      const submissions =
        await submissionService.getSubmissionsForChallenge(challengeId);
      return res
        .status(200)
        .json({
          success: true,
          message: "Submissions fetched successfully",
          submission: submissions,
        });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Internal Server Error",
      });
    }
  };
}
