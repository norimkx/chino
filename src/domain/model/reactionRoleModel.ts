import { type ReactionRole } from "@prisma/client";
import { prisma } from "../prisma";

let reactionRoles: ReactionRole[] | undefined;

export const fetchReactionRoles = async (): Promise<ReactionRole[]> => {
  reactionRoles = await prisma.reactionRole.findMany();
  return reactionRoles;
};

export const loadReactionRoles = async (): Promise<ReactionRole[]> => {
  return reactionRoles ?? (await fetchReactionRoles());
};
