import {
  REST,
  Routes,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

const main = async (global: boolean = false): Promise<void> => {
  // 環境変数読み込み
  const token = global ? process.env.CHINO_TOKEN : process.env.FUYU_TOKEN;
  const clientId = global ? process.env.CHINO_APP_ID : process.env.FUYU_APP_ID;
  const guildId = global ? "" : process.env.GUILD_ID;

  if (token == null || clientId == null || guildId == null) {
    throw new Error("Could not get environment variables.");
  }

  // スラッシュコマンド読み込み
  const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const { command }: Chino.CommandModule = await import(filePath);
    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }

  const rest = new REST().setToken(token);

  // コマンドをデプロイ
  try {
    console.log(`Deploy commands ${global ? "globally" : "to the guild"}.`);
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );
    const data = await rest.put(
      global
        ? Routes.applicationCommands(clientId)
        : Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log(
      `Successfully reloaded ${(data as any[]).length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
};

const argv = process.argv;
const global = argv[2] === "global";

void main(global);
