import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { watchlists } from "../storage.js";

const composer = new Composer<Ctx>();

composer.command("mywatchlist", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const items = await watchlists.read(key);

  if (!items || items.length === 0) {
    await ctx.reply(
      "Your watchlist is empty — tap a coin below to add it.",
      {
        reply_markup: inlineKeyboard([
          [inlineButton("➕ Bitcoin", "watchlist:add:BTC"), inlineButton("➕ Ethereum", "watchlist:add:ETH")],
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }

  const rows = items.map((item) => [
    inlineButton(`${item.name} (${item.ticker})`, `watchlist:detail:${item.ticker}`),
    inlineButton("❌", `watchlist:remove:${item.ticker}`),
  ]);

  rows.push([inlineButton("➕ Add Bitcoin", "watchlist:add:BTC"), inlineButton("➕ Add Ethereum", "watchlist:add:ETH")]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);

  await ctx.reply(
    `📋 Your watchlist (${items.length} coin${items.length === 1 ? "" : "s"}):`,
    { reply_markup: inlineKeyboard(rows) },
  );
});

composer.callbackQuery("watchlist:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const items = await watchlists.read(key);

  if (!items || items.length === 0) {
    await ctx.editMessageText(
      "Your watchlist is empty — tap a coin below to add it.",
      {
        reply_markup: inlineKeyboard([
          [inlineButton("➕ Bitcoin", "watchlist:add:BTC"), inlineButton("➕ Ethereum", "watchlist:add:ETH")],
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }

  const rows = items.map((item) => [
    inlineButton(`${item.name} (${item.ticker})`, `watchlist:detail:${item.ticker}`),
    inlineButton("❌", `watchlist:remove:${item.ticker}`),
  ]);

  rows.push([inlineButton("➕ Add Bitcoin", "watchlist:add:BTC"), inlineButton("➕ Add Ethereum", "watchlist:add:ETH")]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);

  await ctx.editMessageText(
    `📋 Your watchlist (${items.length} coin${items.length === 1 ? "" : "s"}):`,
    { reply_markup: inlineKeyboard(rows) },
  );
});

composer.callbackQuery(/^watchlist:remove:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1];
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const items = await watchlists.read(key);
  if (!items) return;

  const filtered = items.filter((item) => item.ticker !== ticker);
  await watchlists.write(key, filtered);

  if (filtered.length === 0) {
    await ctx.editMessageText(
      `${ticker} removed. Your watchlist is empty.`,
      {
        reply_markup: inlineKeyboard([
          [inlineButton("➕ Bitcoin", "watchlist:add:BTC"), inlineButton("➕ Ethereum", "watchlist:add:ETH")],
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }

  const rows = filtered.map((item) => [
    inlineButton(`${item.name} (${item.ticker})`, `watchlist:detail:${item.ticker}`),
    inlineButton("❌", `watchlist:remove:${item.ticker}`),
  ]);

  rows.push([inlineButton("➕ Add Bitcoin", "watchlist:add:BTC"), inlineButton("➕ Add Ethereum", "watchlist:add:ETH")]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);

  await ctx.editMessageText(
    `📋 ${ticker} removed. Your watchlist (${filtered.length} coin${filtered.length === 1 ? "" : "s"}):`,
    { reply_markup: inlineKeyboard(rows) },
  );
});

composer.callbackQuery(/^watchlist:detail:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1];
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const items = await watchlists.read(key);
  const item = items?.find((i) => i.ticker === ticker);

  if (!item) {
    await ctx.editMessageText(
      `${ticker} isn't on your watchlist.`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }

  const alertCount = item.alerts.length;
  const alertText = alertCount === 0 ? "No alerts" : `${alertCount} alert${alertCount === 1 ? "" : "s"}`;

  await ctx.editMessageText(
    `📊 ${item.name} (${item.ticker})\n\n🔔 ${alertText}`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("🔔 Alerts", `alerts:show:${ticker}`)],
        [inlineButton("❌ Remove", `watchlist:remove:${ticker}`)],
        [inlineButton("⬅️ Back", "watchlist:show")],
      ]),
    },
  );
});

export default composer;
