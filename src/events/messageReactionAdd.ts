import { Events, type MessageReaction, type User } from "discord.js";
import * as reactionRoleService from "../domain/service/reactionRoleService";

export const event: Chino.Event = {
  name: Events.MessageReactionAdd,
  once: false,
  execute: async (reaction: MessageReaction, user: User) => {
    await reactionRoleService.addRole(reaction, user);
  },
};
