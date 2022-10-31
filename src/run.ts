import sequence from "promise-sequential";
import { getEntries, markNotified } from "./notion.js";
import { dispose, notifyEntry } from "./discord.js";

const entries = await getEntries();

console.log(entries);

await sequence(
  entries.map((entry) => async () => {
    await notifyEntry(entry);
    await markNotified(entry);
  })
);

await dispose();
