import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const HELP =
  "ℹ️ CryptoWatch — your crypto price tracker.\n\n" +
  "📊 Price — check current prices for your watchlist\n" +
  "📋 Watchlist — add or remove coins you track\n" +
  "⚙️ Settings — set your timezone, quiet hours, and summary time\n" +
  "🔔 Alerts — get notified when prices hit your targets\n\n" +
  "Everything is button-driven — just tap /start to open the menu.";

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("help", async (ctx) => {
  await ctx.reply(HELP);
});

composer.callbackQuery("menu:help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(HELP, { reply_markup: backToMenu });
});

export default composer;
