import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints.js";
import { sample } from "lodash-es";
import { addHours, formatISO, getDate, subMonths } from "date-fns";
import { Entry } from "./types.js";

type PageProperty = PageObjectResponse["properties"][string];
type PagePropertyMap = {
  [Type in PageProperty["type"]]: PageProperty & { type: Type };
};

const COLOR_CANDIDATES = [0xcd1c36, 0xe4ccaf, 0x395a32];

const client = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const getEntries = async (): Promise<Entry[]> => {
  const now = new Date();
  const willNotifyPosts = await client.databases.query({
    database_id: process.env.CALENDAR_ID,
    filter: {
      and: [
        {
          property: "🗓Date",
          date: {
            // Notionのカレンダーで日付を設定するとUTCの0時0分になってしまうため、9時間ずらす。
            after: formatISO(addHours(subMonths(now, 1), 9)),
          },
        },
        {
          property: "🗓Date",
          date: {
            // 同じく
            on_or_before: formatISO(addHours(now, 9)),
          },
        },
        {
          or: [
            {
              property: "💾Status",
              select: {
                equals: "Done",
              },
            },
            {
              property: "💾Status",
              select: {
                equals: "Free-Writing",
              },
            },
          ],
        },
        {
          property: "discord",
          select: {
            does_not_equal: "Done",
          },
        },
        {
          property: "通知",
          select: {
            does_not_equal: "しないで欲しい",
          },
        },
      ],
    },
    sorts: [
      {
        property: "🗓Date",
        direction: "ascending",
      },
    ],
  });

  const willNotifyEntries = willNotifyPosts.results.map((_post) => {
    const post = _post as PageObjectResponse;
    const date = post.properties["🗓Date"] as PagePropertyMap["date"];
    const title = post.properties["Title"] as PagePropertyMap["title"];
    const writer = post.properties[
      "✏️Writer(Option)"
    ] as PagePropertyMap["rich_text"];
    const externalArticle = post.properties[
      "📄Article(Option)"
    ] as PagePropertyMap["url"];
    const titleAsPlainText = title.title
      .map((frag) => frag.plain_text)
      .join("");
    const writerAsPlainText =
      writer.rich_text.length === 0
        ? undefined
        : writer.rich_text.map((frag) => frag.plain_text).join("");
    // notion.soのリンクだと書き込みモードになってしまう（よく分かっていない）のでカスタムドメインで置き換える
    const urlForRead = post.url.startsWith("https://www.notion.so/")
      ? post.url.replace(
          /^https:\/\/www\.notion\.so\//,
          `https://${process.env.DOMAIN}/`
        )
      : post.url;

    return {
      id: post.id,
      title: titleAsPlainText,
      url: externalArticle.url ?? urlForRead,
      writer: writerAsPlainText,
      date: getDate(new Date(`${date.date!.start}T00:00:00Z`)),
      imageColor: sample(COLOR_CANDIDATES)!,
    };
  });

  return willNotifyEntries;
};

export const markNotified = async (entry: Entry) => {
  await client.pages.update({
    page_id: entry.id,
    properties: {
      discord: {
        select: {
          name: "Done",
        },
      },
    },
  });
};
