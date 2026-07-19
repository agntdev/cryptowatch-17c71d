import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard, inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { userProfiles, type UserProfile } from "../storage.js";

registerMainMenuItem({ label: "📊 Price", data: "price:show", order: 10 });
registerMainMenuItem({ label: "📋 Watchlist", data: "watchlist:show", order: 20 });
registerMainMenuItem({ label: "⚙️ Settings", data: "settings:show", order: 30 });

const WELCOME = "👋 Welcome to CryptoWatch!\n\nTrack crypto prices, set alerts, and get daily summaries.\n\nTap a button below to get started.";

const TIMEZONES = [
  { label: "UTC", data: "tz:UTC" },
  { label: "US Eastern", data: "tz:America/New_York" },
  { label: "US Central", data: "tz:America/Chicago" },
  { label: "US Pacific", data: "tz:America/Los_Angeles" },
  { label: "London", data: "tz:Europe/London" },
  { label: "Berlin", data: "tz:Europe/Berlin" },
  { label: "Dubai", data: "tz:Asia/Dubai" },
  { label: "Singapore", data: "tz:Asia/Singapore" },
  { label: "Tokyo", data: "tz:Asia/Tokyo" },
  { label: "Sydney", data: "tz:Australia/Sydney" },
];

const composer = new Composer<Ctx>();

composer.command("start", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const existing = await userProfiles.read(key);

  if (!existing) {
    const profile: UserProfile = {
      userId,
      timezone: "UTC",
      cooldownMinutes: 60,
    };
    await userProfiles.write(key, profile);

    const tzKeyboard = inlineKeyboard(
      TIMEZONES.map((tz) => [inlineButton(tz.label, tz.data)]),
    );
    await ctx.reply(
      "Welcome to CryptoWatch! First, pick your timezone:",
      { reply_markup: tzKeyboard },
    );
    return;
  }

  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery(/^tz:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const tz = ctx.match![1];
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const profile = await userProfiles.read(key);
  if (profile) {
    profile.timezone = tz;
    await userProfiles.write(key, profile);
  }

  await ctx.editMessageText(
    `✅ Timezone set to ${tz}.\n\nYou're all set! Tap a button below.`,
    { reply_markup: mainMenuKeyboard() },
  );
});

export default composer;
