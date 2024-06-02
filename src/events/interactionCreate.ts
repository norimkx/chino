import {
  Collection,
  Events,
  type CacheType,
  type Interaction,
} from "discord.js";

export const event: Chino.Event = {
  name: Events.InteractionCreate,
  once: false,
  execute: async (interaction: Interaction<CacheType>) => {
    if (!interaction.isChatInputCommand()) return;

    // 呼び出されたコマンドを取得
    const command = interaction.client.commands.get(interaction.commandName);
    if (command == null) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    // クールダウン情報を取得
    const { cooldowns } = interaction.client;
    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const defaultCooldown = 3;
    const cooldownAmount = (command.cooldown ?? defaultCooldown) * 1000;
    const timestamps = cooldowns.get(command.data.name);

    // クールダウン中の場合はコマンドを実行しない
    if (timestamps?.has(interaction.user.id) ?? false) {
      const timestamp = timestamps?.get(interaction.user.id);
      if (timestamp != null) {
        const expirationTime = timestamp + cooldownAmount;
        if (now < expirationTime) {
          const expiredTimestamp = Math.round(expirationTime / 1000);
          await interaction.reply({
            content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
            ephemeral: true,
          });
          return;
        }
      }
    }

    // コマンド使用時刻を記録し、クールダウン経過後に情報を削除する
    timestamps?.set(interaction.user.id, now);
    setTimeout(() => timestamps?.delete(interaction.user.id), cooldownAmount);

    // コマンド実行
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command.",
          ephemeral: true,
        });
      }
    }
  },
};
