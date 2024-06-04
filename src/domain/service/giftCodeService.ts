import { type Message } from "discord.js";
import { loadGiftCodeChannels } from "../model/giftCodeChannelModel";
import { prisma } from "../prisma";

/**
 * ギフトコード交換用URLを生成して送信する。
 *
 * @param message
 */
export const createGiftCodeUrl = async (message: Message): Promise<void> => {
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
