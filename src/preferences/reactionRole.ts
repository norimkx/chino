import { type ReactionRole } from "@prisma/client";
import { type MessageReaction } from "discord.js";
import { prisma } from "../prisma";

let reactionRoles: ReactionRole[] | undefined;

export const fetchReactionRoles = async (): Promise<ReactionRole[]> => {
  reactionRoles = await prisma.reactionRole.findMany();
  return reactionRoles;
};

export const loadReactionRoles = async (): Promise<ReactionRole[]> => {
  return reactionRoles ?? (await fetchReactionRoles());
};

export const findMatch = (
  reactionRoles: ReactionRole[],
  reaction: MessageReaction
): ReactionRole | undefined => {
  return reactionRoles.find((r) => {
    let emoji = r.emoji;
    if (emoji.startsWith("\\u")) {
      emoji = unescapeUnicode(emoji);
    }
    return (
      r.messageId === reaction.message.id && emoji === reaction.emoji.toString()
    );
  });
};

export const getEmojiId = (emoji: string): string | undefined => {
  const regex = /^<:\w+:(\d+)>$/;
  const match = emoji.match(regex);
  return match?.[1];
};

export const emojiLength = (emoji: string): number => {
  const segmenter = new Intl.Segmenter();
  const segments = segmenter.segment(emoji);
  return [...segments].length;
};

export const escapeEmoji = (emoji: string, emojiId?: string): string => {
  return emojiId == null ? escapeUnicode(emoji) : emoji;
};

const escapeUnicode = (str: string): string => {
  return str
    .split("")
    .map((char) => {
      const codePoint = char.codePointAt(0);
      if (codePoint !== undefined && codePoint > 0xffff) {
        return `\\u{${codePoint.toString(16)}}`;
      } else {
        return `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
      }
    })
    .join("");
};

const unescapeUnicode = (str: string): string => {
  return str
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, codePoint: string) => {
      return String.fromCodePoint(parseInt(codePoint, 16));
    })
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, codePoint: string) => {
      return String.fromCharCode(parseInt(codePoint, 16));
    });
};
