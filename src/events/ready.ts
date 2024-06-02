import { ActivityType, Events, type Client } from "discord.js";

export const event: Chino.Event = {
  name: Events.ClientReady,
  once: true,
  execute: async (client: Client) => {
    console.log(`Logged in as ${client.user?.tag}.`);
    client.user?.setActivity("ティッピーをもふもふ中", {
      type: ActivityType.Custom,
    });
  },
};
