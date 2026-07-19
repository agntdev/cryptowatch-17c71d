import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { ownerMetrics, watchlists } from "../storage.js";

const composer = new Composer<Ctx>();

const ADMIN_IDS = process.env.ADMIN_IDS?.split(",").map(Number) ?? [];

function isAdmin(userId: number): boolean {
  return ADMIN_IDS.includes(userId);
}

composer.callbackQuery("admin:metrics", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId || !isAdmin(userId)) {
    await ctx.reply("Access denied.");
    return;
  }

  const metrics = await ownerMetrics.read("global") ?? {
    activeUsers: 0,
    watchlistEntries: 0,
    alertFiringCounts: {},
  };

  const alertCount = Object.values(metrics.alertFiringCounts).reduce((a, b) => a + b, 0);

  await ctx.editMessageText(
    `📊 Bot metrics:\n\n` +
    `👥 Active users: ${metrics.activeUsers}\n` +
    `📋 Watchlist entries: ${metrics.watchlistEntries}\n` +
    `🔔 Alerts fired: ${alertCount}`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
});

export default composer;
