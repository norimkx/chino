import axios from "axios";
import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";

export const command: Chino.SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("songwhip")
    .setDescription("Make a music link")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("Source music URL (Spotify, Apple Music, YouTube, etc)")
        .setRequired(true)
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    const url = interaction.options.getString("url", true);
    try {
      const response = await axios.post("https://songwhip.com/", { url });
      await interaction.editReply(response.data.url as string);
    } catch (error) {
      console.error(error);
      let message = "An unexpected error occurred.";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error?.message ?? message;
      }
      await interaction.editReply(`${message}\n${url}`);
    }
  },
};
