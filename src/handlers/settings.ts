import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { userProfiles } from "../storage.js";

const composer = new Composer<Ctx>();

const TIMEZONES = [
  { label: "UTC", data: "set:tz:UTC" },
  { label: "US Eastern", data: "set:tz:America/New_York" },
  { label: "US Central", data: "set:tz:America/Chicago" },
  { label: "US Pacific", data: "set:tz:America/Los_Angeles" },
  { label: "London", data: "set:tz:Europe/London" },
  { label: "Berlin", data: "set:tz:Europe/Berlin" },
  { label: "Dubai", data: "set:tz:Asia/Dubai" },
  { label: "Singapore", data: "set:tz:Asia/Singapore" },
  { label: "Tokyo", data: "set:tz:Asia/Tokyo" },
  { label: "Sydney", data: "set:tz:Australia/Sydney" },
];

const COOLDOWNS = [
  { label: "30 min", data: "set:cooldown:30" },
  { label: "1 hour", data: "set:cooldown:60" },
  { label: "2 hours", data: "set:cooldown:120" },
  { label: "4 hours", data: "set:cooldown:240" },
  { label: "12 hours", data: "set:cooldown:720" },
];

const SUMMARY_TIMES = [
  { label: "7:00 AM", data: "set:summary:07:00" },
  { label: "8:00 AM", data: "set:summary:08:00" },
  { label: "9:00 AM", data: "set:summary:09:00" },
  { label: "10:00 AM", data: "set:summary:10:00" },
  { label: "None", data: "set:summary:none" },
];

composer.command("settings", async (ctx) => {
  await showSettings(ctx);
});

composer.callbackQuery("settings:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  await editSettings(ctx);
});

composer.callbackQuery("settings:timezone", async (ctx) => {
  await ctx.answerCallbackQuery();
  const tzKeyboard = inlineKeyboard(
    TIMEZONES.map((tz) => [inlineButton(tz.label, tz.data)]),
  );
  await ctx.editMessageText("Pick your timezone:", { reply_markup: tzKeyboard });
});

composer.callbackQuery("settings:cooldown", async (ctx) => {
  await ctx.answerCallbackQuery();
  const kb = inlineKeyboard(
    COOLDOWNS.map((c) => [inlineButton(c.label, c.data)]),
  );
  await ctx.editMessageText(
    "How long between alerts for the same coin?",
    { reply_markup: kb },
  );
});

composer.callbackQuery("settings:summary", async (ctx) => {
  await ctx.answerCallbackQuery();
  const kb = inlineKeyboard(
    SUMMARY_TIMES.map((s) => [inlineButton(s.label, s.data)]),
  );
  await ctx.editMessageText(
    "What time should you get your daily summary?",
    { reply_markup: kb },
  );
});

composer.callbackQuery(/^set:tz:(.+)$/, async (ctx) => {
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

  await ctx.editMessageText(`✅ Timezone updated to ${tz}.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Settings", "settings:show")]]),
  });
});

composer.callbackQuery(/^set:cooldown:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const minutes = parseInt(ctx.match![1], 10);
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const profile = await userProfiles.read(key);
  if (profile) {
    profile.cooldownMinutes = minutes;
    await userProfiles.write(key, profile);
  }

  const label = minutes >= 60 ? `${minutes / 60} hour${minutes === 60 ? "" : "s"}` : `${minutes} min`;
  await ctx.editMessageText(`✅ Cooldown set to ${label}.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Settings", "settings:show")]]),
  });
});

composer.callbackQuery(/^set:summary:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const time = ctx.match![1];
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const profile = await userProfiles.read(key);
  if (profile) {
    profile.summaryTime = time === "none" ? undefined : time;
    await userProfiles.write(key, profile);
  }

  const msg = time === "none"
    ? "✅ Daily summary disabled."
    : `✅ Daily summary set for ${time}.`;
  await ctx.editMessageText(msg, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Settings", "settings:show")]]),
  });
});

async function showSettings(ctx: Ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const profile = await userProfiles.read(key);
  const tz = profile?.timezone ?? "UTC";
  const cooldown = profile?.cooldownMinutes ?? 60;
  const summary = profile?.summaryTime ?? "Not set";

  const cooldownLabel = cooldown >= 60 ? `${cooldown / 60}h` : `${cooldown}m`;

  const text =
    `⚙️ Your settings:\n\n` +
    `🌍 Timezone: ${tz}\n` +
    `🔇 Cooldown: ${cooldownLabel}\n` +
    `📊 Summary: ${summary}\n\n` +
    `Tap to change:`;

  const kb = inlineKeyboard([
    [inlineButton("🌍 Timezone", "settings:timezone")],
    [inlineButton("🔇 Alert cooldown", "settings:cooldown")],
    [inlineButton("📊 Daily summary", "settings:summary")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);

  await ctx.reply(text, { reply_markup: kb });
}

async function editSettings(ctx: Ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const profile = await userProfiles.read(key);
  const tz = profile?.timezone ?? "UTC";
  const cooldown = profile?.cooldownMinutes ?? 60;
  const summary = profile?.summaryTime ?? "Not set";

  const cooldownLabel = cooldown >= 60 ? `${cooldown / 60}h` : `${cooldown}m`;

  const text =
    `⚙️ Your settings:\n\n` +
    `🌍 Timezone: ${tz}\n` +
    `🔇 Cooldown: ${cooldownLabel}\n` +
    `📊 Summary: ${summary}\n\n` +
    `Tap to change:`;

  const kb = inlineKeyboard([
    [inlineButton("🌍 Timezone", "settings:timezone")],
    [inlineButton("🔇 Alert cooldown", "settings:cooldown")],
    [inlineButton("📊 Daily summary", "settings:summary")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);

  await ctx.editMessageText(text, { reply_markup: kb });
}

export default composer;
