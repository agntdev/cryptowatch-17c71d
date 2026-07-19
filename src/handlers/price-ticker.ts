import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { watchlists } from "../storage.js";
import { fetchPrices, formatPrice, resolveCoinId } from "../coingecko.js";

const composer = new Composer<Ctx>();

composer.command("price", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !ctx.message) return;

  const args = ctx.message.text.split(/\s+/).slice(1);
  const ticker = args[0]?.toUpperCase();

  if (ticker) {
    const coin = resolveCoinId(ticker);
    if (!coin) {
      await ctx.reply(
        `Couldn't find "${ticker}". Check the spelling and try again.`,
        { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
      );
      return;
    }

    const price = await fetchPrice(coin.id);
    if (price === null) {
      await ctx.reply(
        "Couldn't fetch the price right now. Try again in a moment.",
        { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
      );
      return;
    }

    await ctx.reply(
      `📊 ${coin.name} (${coin.symbol}): ${formatPrice(price)}`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }

  const key = String(userId);
  const items = await watchlists.read(key);
  if (!items || items.length === 0) {
    await ctx.reply(
      "Your watchlist is empty — tap 📋 Watchlist to add some coins.",
      { reply_markup: inlineKeyboard([[inlineButton("📋 Watchlist", "watchlist:show")]]) },
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
    if (price !== undefined) {
      return `${item.name} (${item.ticker}): ${formatPrice(price)}`;
    }
    return `${item.name} (${item.ticker}): price unavailable`;
  });

  await ctx.reply(
    `📊 Your watchlist:\n\n${lines.join("\n")}`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
});

composer.callbackQuery("price:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const items = await watchlists.read(key);
  if (!items || items.length === 0) {
    await ctx.editMessageText(
      "Your watchlist is empty — tap 📋 Watchlist to add some coins.",
      { reply_markup: inlineKeyboard([[inlineButton("📋 Watchlist", "watchlist:show")]]) },
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
    if (price !== undefined) {
      return `${item.name} (${item.ticker}): ${formatPrice(price)}`;
    }
    return `${item.name} (${item.ticker}): price unavailable`;
  });

  await ctx.editMessageText(
    `📊 Your watchlist:\n\n${lines.join("\n")}`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
  );
});

async function fetchPrice(coinId: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, { usd?: number }>;
    return data[coinId]?.usd ?? null;
  } catch {
    return null;
  }
}

export default composer;
