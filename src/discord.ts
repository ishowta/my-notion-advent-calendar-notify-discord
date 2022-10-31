import { Client, MessagePayload, TextChannel } from "discord.js";
import { Entry } from "./types.js";

const client = new Client({
  intents: [],
});

let discordLoadPromiseResolver: (ch: TextChannel) => void;
const discordLoadPromise = new Promise<TextChannel>((res) => {
  discordLoadPromiseResolver = res;
});

client.on("ready", async () => {
  const ch = (await client.channels.fetch(
    process.env.NOTIFY_CHANNEL
  )) as TextChannel;
  discordLoadPromiseResolver(ch);
});

client.login(process.env.DISCORD_TOKEN);

export const dispose = async () => {
  await discordLoadPromiseResolver;
  client.destroy();
}

export const notifyEntry = async (entry: Entry) => {
  const ch = await discordLoadPromise;

  ch.send(
    MessagePayload.create(ch, {
      embeds: [
        {
          title: `:christmas_tree: | ${entry.title}`,
          url: entry.url,
          description: `${process.env.TITLE} ${entry.date}日目`,
          color: entry.imageColor,
        },
      ],
    })
  );
};
