import { type ReactionRole } from "@prisma/client";
import {
  BaseGuildTextChannel,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type Message,
  type MessageReaction,
  type User,
} from "discord.js";
import {
  fetchReactionRoles,
  loadReactionRoles,
} from "../model/reactionRoleModel";
import { prisma } from "../prisma";

/**
 * リアクションに反応してロールを付与する。
 * リアクションロールが `secret` の場合、ロールを付与または解除する。
 *
 * @param reaction
 * @param user
 */
export const addRole = async (
  reaction: MessageReaction,
  user: User
): Promise<void> => {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Something went wrong when fetching the reaction:", error);
      return;
    }
  }

  // 対応するリアクションロール設定を取得
  const reactionRole = await findReactionRole(reaction);
  if (reactionRole == null) return;

  const { roleId, secret } = reactionRole;

  try {
    const guild = reaction.message.guild;
    const member = await guild?.members.fetch(user);
    if (member == null) return;

    // ロールを付与または解除する
    if (secret && member.roles.cache.has(roleId)) {
      // secretで既にロールを持っている場合、ロールを解除する
      await member.roles.remove(roleId);
      console.log(`Removed role from ${member.displayName}.`);
    } else {
      // それ以外ならロールを付与する
      await member.roles.add(roleId);
      console.log(`Added role to ${member.displayName}.`);
    }

    // secretの場合、リアクションを削除する
    if (secret) {
      await reaction.users.remove(user);
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * リアクションに反応してロールを解除する。
 *
 * @param reaction
 * @param user
 */
export const removeRole = async (
  reaction: MessageReaction,
  user: User
): Promise<void> => {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Something went wrong when fetching the reaction:", error);
      return;
    }
  }

  // 対応するリアクションロール設定を取得
  const reactionRole = await findReactionRole(reaction);
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
};

/**
 * リアクションロールを設定する。
 *
 * @param interaction
 */
export const addReactionRole = async (
  interaction: ChatInputCommandInteraction
): Promise<void> => {
  const messageId = interaction.options.getString("message_id", true);
  const emoji = interaction.options.getString("emoji", true);
  const role = interaction.options.getRole("role", true);
  const secret = interaction.options.getBoolean("secret") ?? false;

  // リアクションロール設定を取得
  const reactionRoles = await loadReactionRoles();

  // リアクションロールがすでに存在していないかチェック
  {
    const reactionRole = reactionRoles.find((r) => r.roleId === role.id);
    if (reactionRole != null) {
      await interaction.reply({
        content: "The reaction role already exists.",
        ephemeral: true,
      });
      return;
    }
  }

  // 同じメッセージに同じ絵文字で登録しようとしていないかチェック
  {
    const reactionRole = reactionRoles.find(
      (r) => r.messageId === messageId && r.emoji === escapeEmoji(emoji)
    );
    if (reactionRole != null) {
      await interaction.reply({
        content: "Duplicate emoji in the message.",
        ephemeral: true,
      });
      return;
    }
  }

  // 絵文字チェック
  if (isCustomEmoji(emoji)) {
    // カスタム絵文字が使用可能かチェック
    const customEmoji = interaction.client.emojis.cache.find(
      (e) => e.toString() === emoji
    );
    if (customEmoji == null) {
      await interaction.reply({
        content: "This emoji is not available.",
        ephemeral: true,
      });
      return;
    }
  } else {
    // 絵文字数チェック
    if (emojiLength(emoji) !== 1) {
      await interaction.reply({
        content: "Please enter only one emoji.",
        ephemeral: true,
      });
      return;
    }
  }

  // リアクション付与用にメッセージを取得
  let message: Message | undefined;
  try {
    message = await interaction.channel?.messages.fetch(messageId);
    if (message == null) {
      throw new Error("Failed to fetch the message.");
    }
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Failed to fetch the message.",
      ephemeral: true,
    });
    return;
  }

  // リアクションロール追加
  try {
    const guildId = interaction.guildId;
    if (guildId == null) {
      throw new Error("interaction.guildId is null.");
    }

    // リアクション付与
    await message.react(emoji);

    // 永続化
    await prisma.reactionRole.create({
      data: {
        roleId: role.id,
        guildId,
        channelId: interaction.channelId,
        messageId,
        emoji: escapeEmoji(emoji),
        secret,
      },
    });

    await interaction.reply({
      content: "Added the reaction role.",
      ephemeral: true,
    });

    // リアクションロールオブジェクトを更新
    await fetchReactionRoles();
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Failed to add the reaction role.",
      ephemeral: true,
    });
  }
};

/**
 * リアクションロール設定を削除する。
 *
 * @param interaction
 */
export const removeReactionRole = async (
  interaction: ChatInputCommandInteraction
): Promise<void> => {
  const role = interaction.options.getRole("role", true);

  // リアクションロール設定を取得
  const reactionRoles = await loadReactionRoles();
  const reactionRole = reactionRoles.find((r) => r.roleId === role.id);

  // 指定のリアクションロール設定が見つからなければ終了
  if (reactionRole == null) {
    await interaction.reply({
      content: "The reaction role does not exist.",
      ephemeral: true,
    });
    return;
  }

  try {
    const channel = await interaction.client.channels.fetch(
      reactionRole.channelId
    );
    if (channel instanceof BaseGuildTextChannel) {
      try {
        // リアクションロールが設定されているメッセージを取得
        const message = await channel.messages.fetch(reactionRole.messageId);

        // 該当メッセージから設定したリアクションを削除
        const emoji = unescapeEmoji(reactionRole.emoji);
        const reaction = message.reactions.cache.find(
          (reaction) => reaction.emoji.toString() === emoji
        );
        await reaction?.remove();
      } catch (error) {
        console.error(
          "Failed to fetch the message while removing the reaction role."
        );
      }
    }

    // リアクションロール設定を削除
    await prisma.reactionRole.delete({
      where: {
        roleId: reactionRole.roleId,
      },
    });

    await interaction.reply({
      content: "Removed the reaction role.",
      ephemeral: true,
    });

    // リアクションロールオブジェクトを更新
    await fetchReactionRoles();
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "An unexpected error occurred.",
      ephemeral: true,
    });
  }
};

/**
 * リアクションロール設定一覧を表示する。
 *
 * @param interaction
 */
export const listReactionRole = async (
  interaction: ChatInputCommandInteraction
): Promise<void> => {
  const reactionRoles = await fetchReactionRoles();
  const descriptions = reactionRoles.map(
    (reactionRole) =>
      `${unescapeEmoji(reactionRole.emoji)} - <@&${reactionRole.roleId}>`
  );
  const embed = new EmbedBuilder()
    .setTitle("Reaction Roles")
    .setDescription(descriptions.join("\n"));
  await interaction.reply({ embeds: [embed], ephemeral: true });
};

const findReactionRole = async (
  reaction: MessageReaction
): Promise<ReactionRole | undefined> => {
  const reactionRoles = await loadReactionRoles();
  return reactionRoles.find((r) => {
    const emoji = unescapeEmoji(r.emoji);
    return (
      r.messageId === reaction.message.id && emoji === reaction.emoji.toString()
    );
  });
};

const isCustomEmoji = (emoji: string): boolean => {
  const regex = /^<a?:\w+:\d+>$/;
  return regex.test(emoji);
};

const emojiLength = (emoji: string): number => {
  const segmenter = new Intl.Segmenter();
  const segments = segmenter.segment(emoji);
  return [...segments].length;
};

const escapeEmoji = (emoji: string): string => {
  return emoji.startsWith("<") ? emoji : escapeUnicode(emoji);
};

const unescapeEmoji = (emoji: string): string => {
  return emoji.startsWith("\\u") ? unescapeUnicode(emoji) : emoji;
};

const escapeUnicode = (str: string): string => {
  return str
    .split("")
    .map((char) => {
      const codePoint = char.codePointAt(0);
      if (codePoint !== undefined && codePoint > 0xffff) {
        return `\\u{${codePoint.toString(16)}}`;
      } else {
        return `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
      }
    })
    .join("");
};

const unescapeUnicode = (str: string): string => {
  return str
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, codePoint: string) => {
      return String.fromCodePoint(parseInt(codePoint, 16));
    })
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, codePoint: string) => {
      return String.fromCharCode(parseInt(codePoint, 16));
    });
};
