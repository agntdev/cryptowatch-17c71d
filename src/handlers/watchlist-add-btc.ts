import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { watchlists, type WatchlistItem } from "../storage.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("watchlist:add:BTC", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const items = (await watchlists.read(key)) ?? [];

  if (items.some((item) => item.ticker === "BTC")) {
    await ctx.reply(
      "Bitcoin is already on your watchlist.",
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }

  const btc: WatchlistItem = {
    ticker: "BTC",
    name: "Bitcoin",
    alerts: [],
  };
  items.push(btc);
  await watchlists.write(key, items);

  await ctx.reply(
    "✅ Bitcoin added to your watchlist!",
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
});

export default composer;
