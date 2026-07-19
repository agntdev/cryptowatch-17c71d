import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { watchlists, userProfiles } from "../storage.js";
import { fetchPrices, formatPrice, resolveCoinId, percentChange } from "../coingecko.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("summary:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const items = await watchlists.read(key);

  if (!items || items.length === 0) {
    await ctx.editMessageText(
      "Your watchlist is empty — add some coins first.",
      {
        reply_markup: inlineKeyboard([
          [inlineButton("📋 Watchlist", "watchlist:show")],
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }

  const coinIds = items.map((item) => {
    const coin = resolveCoinId(item.ticker);
    return coin?.id ?? item.ticker.toLowerCase();
  });

  const prices = await fetchPrices(coinIds);

  const lines = items.map((item) => {
    const coin = resolveCoinId(item.ticker);
    const coinId = coin?.id ?? item.ticker.toLowerCase();
    const price = prices[coinId];
    const lastPrice = item.lastPrice;

    if (price !== undefined) {
      let changeText = "";
      if (lastPrice !== undefined && lastPrice !== 0) {
        const pct = percentChange(lastPrice, price);
        const arrow = pct > 0 ? "📈" : pct < 0 ? "📉" : "➡️";
        changeText = ` ${arrow} ${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
      }
      return `${item.name} (${item.ticker}): ${formatPrice(price)}${changeText}`;
    }
    return `${item.name} (${item.ticker}): price unavailable`;
  });

  await ctx.editMessageText(
    `📊 Daily summary:\n\n${lines.join("\n")}`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
});

export default composer;
