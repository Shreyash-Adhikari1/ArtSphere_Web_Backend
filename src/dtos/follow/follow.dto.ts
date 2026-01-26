import z from "zod";
import { FollowSchema } from "../../types/follow/follow.type";

// follow dto
export const FollowDTO = FollowSchema.pick({
  following: true,
});
export type FollowDTO = z.infer<typeof FollowDTO>;
