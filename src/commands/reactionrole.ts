import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type Message,
} from "discord.js";
import {
  emojiLength,
  escapeEmoji,
  fetchReactionRoles,
  getEmojiId,
} from "../preferences/reactionRole";
import { prisma } from "../prisma";

export const command: Chino.SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Configure reaction roles")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a reaction role")
        .addRoleOption((option) =>
          option.setName("role").setDescription("Role").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("message_id")
            .setDescription("Message ID")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("emoji").setDescription("Emoji").setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("secret")
            .setDescription(
              "Remove a reaction after adding a role or not (default: False)"
            )
        )
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (interaction.options.getSubcommand() === "add") {
      const messageId = interaction.options.getString("message_id", true);
      const emoji = interaction.options.getString("emoji", true);
      const role = interaction.options.getRole("role", true);
      const secret = interaction.options.getBoolean("secret") ?? false;

      // リアクションロールがすでに存在していないかチェック
      try {
        const reactionRole = await prisma.reactionRole.findUnique({
          where: { roleId: role.id },
        });
        if (reactionRole != null) {
          await interaction.reply({
            content: "The reaction role already exists.",
            ephemeral: true,
          });
          return;
        }
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "An unexpected error occurred.",
          ephemeral: true,
        });
        return;
      }

      // 絵文字チェック
      const emojiId = getEmojiId(emoji);
      if (emojiId != null) {
        // カスタム絵文字が使用可能かチェック
        const customEmoji = interaction.client.emojis.cache.get(emojiId);
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

      // 同じメッセージに同じ絵文字で登録しようとした場合エラーにする
      try {
        const reactionRoles = await prisma.reactionRole.findMany({
          where: { messageId, emoji: escapeEmoji(emoji, emojiId) },
        });
        if (reactionRoles.length > 0) {
          await interaction.reply({
            content: "Duplicate emoji in the message.",
            ephemeral: true,
          });
          return;
        }
      } catch (error) {
        console.error(error);
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

        // 永続化
        await prisma.reactionRole.create({
          data: {
            roleId: role.id,
            guildId,
            channelId: interaction.channelId,
            messageId,
            emoji: escapeEmoji(emoji, emojiId),
            secret,
          },
        });

        // リアクションロールオブジェクトを更新
        await fetchReactionRoles();

        // リアクション付与
        await message.react(emoji);

        await interaction.reply({
          content: "Added a reaction role.",
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "Failed to add the reaction role.",
          ephemeral: true,
        });
      }
    }
  },
};
