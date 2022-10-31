import { Client, MessagePayload, TextChannel } from "discord.js";
import { Entry } from "./types.js";

export const withDiscord = <T>(f: (cli: Client) => Promise<T>): Promise<T> => {
  return new Promise((res) => {
    const client = new Client({
      intents: [],
    });

    client.on("ready", async () => {
      const result = await f(client);

      client.destroy();

      res(result);
    });

    client.login(process.env.DISCORD_TOKEN);
  });
};

export const getMainTextChannel = async (cli: Client) => {
  const ch = (await cli.channels.fetch(
    process.env.NOTIFY_CHANNEL
  )) as TextChannel;

  return ch;
};

export const notifyEntry = async (ch: TextChannel, entry: Entry) => {
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
