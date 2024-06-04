import { Events, type Message } from "discord.js";
import * as giftCodeService from "../domain/service/giftCodeService";
import * as xMessageService from "../domain/service/xMessageService";

export const event: Chino.Event = {
  name: Events.MessageCreate,
  once: false,
  execute: async (message: Message) => {
    if (message.author.bot) return;
    await xMessageService.convertXMessage(message);
    await giftCodeService.createGiftCodeUrl(message);
  },
};
