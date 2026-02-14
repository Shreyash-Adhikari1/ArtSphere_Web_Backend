import { z } from "zod";

export const SubmissionSchema = z.object({
  _id: z.string().optional(),
  challengeId: z.string().optional(),
  submitterId: z.string().optional(),
  submittedPostId: z.string().optional(),
});
