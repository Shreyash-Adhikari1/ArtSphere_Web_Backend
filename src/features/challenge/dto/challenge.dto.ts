import z from "zod";
import { ChallengeSchema } from "../type/challenge.type";
import { type } from "node:os";

export const CreateChallengeDTO = ChallengeSchema.pick({
  challengeTitle: true,
  challengeDescription: true,
  challengeMedia: true,
  endsAt: true,
});
export type CreateChallengeDTO = z.infer<typeof CreateChallengeDTO>;

export const EditChallengeDTO = ChallengeSchema.pick({
  challengeTitle: true,
  challengeDescription: true,
  endsAt: true,
}).partial();
export type EditChallengeDTO = z.infer<typeof EditChallengeDTO>;
