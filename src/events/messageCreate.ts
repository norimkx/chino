import { Events, MessageFlags, type Message } from "discord.js";
import { loadGiftCodeChannels } from "../preferences/giftCodeChannel";
import { prisma } from "../prisma";

export const event: Chino.Event = {
  name: Events.MessageCreate,
  once: false,
  execute: async (message: Message) => {
    if (message.author.bot) return;
    await replaceXUrl(message);
    await createGiftCodeUrl(message);
  },
};

const replaceXUrl = async (message: Message): Promise<void> => {
  // 「twitter.com」「x.com」を「fxtwitter.com」に変換、ついでにクエリパラメータを削除
  const regexp = /(https:\/\/)(twitter|x)(.com\/[\w]+\/status\/\d+)(\?\S*)?/g;
  const matches = message.content.matchAll(regexp);
  const urls: string[] = [];
  for (const match of matches) {
    urls.push(`${match[1]}fxtwitter${match[3]}`);
  }

  // XのURLが含まれていなければ終了
  if (urls.length === 0) return;

  // URLを5個ずつに分割
  const splittedUrls = splitArray(urls);

  const data: Array<{ sourceId: string; targetId: string }> = [];

  try {
    // 元メッセージの埋め込みを抑制
    await message.edit({ flags: MessageFlags.SuppressEmbeds });

    // 変換したURLを送信
    for (const u of splittedUrls) {
      const target = await message.channel.send(u.join("\n"));
      data.push({ sourceId: message.id, targetId: target.id });
    }

    // 永続化
    await prisma.xMessage.createMany({ data });
  } catch (error) {
    console.error(error);
  }
};

const splitArray = (arr: string[]): string[][] => {
  const maxLength = 5;
  const result: string[][] = [];
  for (let i = 0; i < arr.length; i += maxLength) {
    result.push(arr.slice(i, i + maxLength));
  }
  return result;
};

const createGiftCodeUrl = async (message: Message): Promise<void> => {
  const giftCodeChannels = await loadGiftCodeChannels();
  const channel = giftCodeChannels.find((c) => c.id === message.channelId);
  if (channel == null) return;

  // 大文字英数字以外が含まれていたら終了
  if (/[^A-Z0-9\s]/.test(message.content)) return;

  // ギフトコードは6文字以上
  const regexp = /\b[A-Z0-9]{6,}\b/g;
  const rawCodes = message.content.match(regexp);
  if (rawCodes == null) return;

  const codes = [...new Set(rawCodes)];
  const newCodes: string[] = [];
  const existingCodes: string[] = [];

  // ギフトコードが新規か既出かを確認して分類
  try {
    const giftCodes = await prisma.giftCode.findMany({
      where: { channelId: channel.id },
      select: { code: true },
    });
    for (const code of codes) {
      if (giftCodes.some((c) => c.code === code)) {
        existingCodes.push(code);
      } else {
        newCodes.push(code);
      }
    }
  } catch (error) {
    console.error(error);
    return;
  }

  // 新規コードをURLに変換、既出コードはそのまま出力
  const urls = newCodes.map((code) => `<${channel.baseUrl}${code}>`);
  let text = urls.join("\n");
  if (existingCodes.length > 0) {
    text += `\n既出コード: ${existingCodes.join(", ")}`;
  }

  try {
    // URL等を送信
    await message.channel.send(text);

    if (newCodes.length === 0) return;

    // 永続化
    const data: Array<{ code: string; channelId: string }> = [];
    for (const code of newCodes) {
      data.push({ code, channelId: channel.id });
    }
    await prisma.giftCode.createMany({ data: [...data] });
  } catch (error) {
    console.error(error);
  }
};
