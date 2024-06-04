import { Events, type Message } from "discord.js";
import * as xUrlService from "../domain/service/xUrlService";

export const event: Chino.Event = {
  name: Events.MessageDelete,
  once: false,
  execute: async (message: Message) => {
    if (message.author?.bot) return;
    await xUrlService.deleteXUrl(message);
  },
};
