declare namespace NodeJS {
  interface ProcessEnv {
    readonly NOTION_TOKEN: string;
    readonly CALENDAR_ID: string;
    readonly DISCORD_TOKEN: string;
    readonly NOTIFY_CHANNEL: string;
    readonly TITLE: string;
  }
}
