import { Events, type MessageReaction, type User } from "discord.js";
import { findMatch, loadReactionRoles } from "../preferences/reactionRole";

export const event: Chino.Event = {
  name: Events.MessageReactionRemove,
  once: false,
  execute: async (reaction: MessageReaction, user: User) => {
    if (user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error(
          "Something went wrong when fetching the reaction:",
          error
        );
        return;
      }
    }

    // 対応するリアクションロール設定を取得
    const reactionRoles = await loadReactionRoles();
    const reactionRole = findMatch(reactionRoles, reaction);
    if (reactionRole == null) return;

    const { roleId, secret } = reactionRole;

    if (secret) return;

    try {
      const guild = reaction.message.guild;
      const member = await guild?.members.fetch(user);
      if (member == null) return;

      // ロール解除
      await member.roles.remove(roleId);
      console.log(`Removed role from ${member.displayName}.`);
    } catch (error) {
      console.error(error);
    }
  },
};
