import { Events, type Message } from "discord.js";
import * as xMessageService from "../domain/service/xMessageService";

export const event: Chino.Event = {
  name: Events.MessageDelete,
  once: false,
  execute: async (message: Message) => {
    if (message.author?.bot) return;
    await xMessageService.deleteXMessage(message);
  },
};
