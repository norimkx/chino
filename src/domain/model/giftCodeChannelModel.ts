import { type GiftCodeChannel } from "@prisma/client";
import { prisma } from "../prisma";

let giftCodeChannels: GiftCodeChannel[] | undefined;

export const fetchGiftCodeChannels = async (): Promise<GiftCodeChannel[]> => {
  giftCodeChannels = await prisma.giftCodeChannel.findMany();
  return giftCodeChannels;
};

export const loadGiftCodeChannels = async (): Promise<GiftCodeChannel[]> => {
  return giftCodeChannels ?? (await fetchGiftCodeChannels());
};
