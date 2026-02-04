import { z } from "zod";

export const ChallengeSchema = z.object({
  _id: z.string().optional(),
  challengerId: z.string().optional(),
  challengeTitle: z.string().optional(),
  challengeDescription: z.string().optional(),
  challengeMedia: z.string().optional(),

  submissionCount: z.number().default(0),
  submitters: z.string().optional(),
  submittedPosts: z.string().optional(),

  status: z.enum(["open", "closed"]).default("open"),
  endsAt: z.preprocess(
    (val) => (typeof val === "string" ? new Date(val) : val),
    z.date(),
  ),
});

export type Challenge = z.infer<typeof ChallengeSchema>;
