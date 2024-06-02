import {
  type ChatInputCommandInteraction,
  type ClientEvents,
  type Collection,
  type SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Chino.SlashCommand>;
    cooldowns: Collection<string, Collection<string, number>>;
  }
}

declare global {
  namespace Chino {
    interface CommandModule {
      command: SlashCommand;
    }

    interface SlashCommand {
      cooldown?: number;
      data:
        | SlashCommandBuilder
        | SlashCommandOptionsOnlyBuilder
        | SlashCommandSubcommandsOnlyBuilder;
      execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    }

    interface EventModule {
      event: Event;
    }

    interface Event {
      name: keyof ClientEvents;
      once: boolean;
      execute: (...args: any[]) => Promise<void>;
    }
  }
}
