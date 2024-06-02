import { Events, type Message } from "discord.js";
import { prisma } from "../prisma";

export const event: Chino.Event = {
  name: Events.MessageDelete,
  once: false,
  execute: async (message: Message) => {
    if (message.author?.bot) return;
    await deleteXUrlReplacedMessage(message);
  },
};

const deleteXUrlReplacedMessage = async (message: Message): Promise<void> => {
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
