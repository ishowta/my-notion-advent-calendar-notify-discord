import { getEntries, markNotified } from "./notion.js";
import { getMainTextChannel, notifyEntry, withDiscord } from "./discord.js";

const sequence = async (arr: (() => Promise<void>)[]) => {
  return arr.reduce((p, c) => p.then(() => c()), Promise.resolve());
}

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
