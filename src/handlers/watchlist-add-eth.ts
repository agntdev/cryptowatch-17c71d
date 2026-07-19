import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { watchlists, type WatchlistItem } from "../storage.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("watchlist:add:ETH", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const items = (await watchlists.read(key)) ?? [];

  if (items.some((item) => item.ticker === "ETH")) {
    await ctx.reply(
      "Ethereum is already on your watchlist.",
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }

  const eth: WatchlistItem = {
    ticker: "ETH",
    name: "Ethereum",
    alerts: [],
  };
  items.push(eth);
  await watchlists.write(key, items);

  await ctx.reply(
    "✅ Ethereum added to your watchlist!",
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
});

export default composer;
