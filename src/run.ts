import sequence from "promise-sequential";
import { getEntries, markNotified } from "./notion.js";
import { getMainTextChannel, notifyEntry, withDiscord } from "./discord.js";

const entries = await getEntries();

console.log(entries);

await withDiscord(async (discord) => {
  const ch = await getMainTextChannel(discord);

  await sequence(
    entries.map((entry) => async () => {
      await notifyEntry(ch, entry);
      await markNotified(entry);
    })
  );
});
