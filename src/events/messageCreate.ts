import { Events, type Message } from "discord.js";
import * as giftCodeService from "../domain/service/giftCodeService";
import * as xUrlService from "../domain/service/xUrlService";

export const event: Chino.Event = {
  name: Events.MessageCreate,
  once: false,
  execute: async (message: Message) => {
    if (message.author.bot) return;
    await xUrlService.replaceXUrl(message);
    await giftCodeService.createGiftCodeUrl(message);
  },
};
