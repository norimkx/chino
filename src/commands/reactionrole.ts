import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import * as reactionRoleService from "../domain/service/reactionRoleService";

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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a reaction role")
        .addRoleOption((option) =>
          option.setName("role").setDescription("Role").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("Check the list of reaction roles")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (interaction.options.getSubcommand() === "add") {
      await reactionRoleService.addReactionRole(interaction);
    } else if (interaction.options.getSubcommand() === "remove") {
      await reactionRoleService.removeReactionRole(interaction);
    } else if (interaction.options.getSubcommand() === "list") {
      await reactionRoleService.listReactionRole(interaction);
    }
  },
};
