import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints.js";
import { sample } from "lodash-es";
import { getDate } from "date-fns";
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
  /**
   * 日付が過去一ヶ月以内で
   * 書き込みが完了済みかつ
   * 通知状態が完了済みではないポスト
   */
  const willNotifyPosts = await client.databases.query({
    database_id: process.env.CALENDAR_ID,
    filter: {
      and: [
        {
          property: "Date",
          date: {
            past_month: {},
          },
        },
        {
          property: "Status",
          select: {
            equals: "Done",
          },
        },
        {
          property: "NotifyStatus",
          select: {
            does_not_equal: "Done",
          },
        },
      ],
    },
    sorts: [
      {
        property: "Date",
        direction: "ascending",
      },
    ],
  });

  const willNotifyEntries = willNotifyPosts.results.map((_post) => {
    const post = _post as PageObjectResponse;
    const date = post.properties["Date"] as PagePropertyMap["date"];
    const title = post.properties["Name"] as PagePropertyMap["title"];
    const writer = post.properties[
      "Writer(option)"
    ] as PagePropertyMap["rich_text"];
    const titleAsPlainText = title.title
      .map((frag) => frag.plain_text)
      .join("");
    const writerAsPlainText =
      writer.rich_text.length === 0
        ? undefined
        : writer.rich_text.map((frag) => frag.plain_text).join("");

    return {
      id: post.id,
      title: titleAsPlainText,
      url: post.url,
      writer: writerAsPlainText,
      date: getDate(new Date(date.date!.start)), // FIXME: タイムゾーンたぶんずれてるけど+9なので日付がずれてない
      imageColor: sample(COLOR_CANDIDATES)!,
    };
  });

  return willNotifyEntries;
};

export const markNotified = async (entry: Entry) => {
  await client.pages.update({
    page_id: entry.id,
    properties: {
      NotifyStatus: {
        select: {
          name: "Done",
        },
      },
    },
  });
};
