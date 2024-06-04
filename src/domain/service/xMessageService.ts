import { MessageFlags, type Message } from "discord.js";
import { prisma } from "../prisma";

/**
 * X（旧Twitter）のリンクが含まれるメッセージに反応して、FxTwitterのリンクを送信する。
 *
 * @param message
 */
export const convertXMessage = async (message: Message): Promise<void> => {
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

/**
 * FxTwitterに変換後のメッセージを削除する。
 *
 * @param message
 */
export const deleteXMessage = async (message: Message): Promise<void> => {
  try {
    const xMessages = await prisma.xMessage.findMany({
      where: { sourceId: message.id },
    });

    for (const xMessage of xMessages) {
      const target = await message.channel.messages.fetch(xMessage.targetId);
      await target.delete();
    }

    await prisma.xMessage.deleteMany({ where: { sourceId: message.id } });
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
