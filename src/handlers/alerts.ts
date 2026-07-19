import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { watchlists, type AlertDefinition, type WatchlistItem } from "../storage.js";

const composer = new Composer<Ctx>();

composer.callbackQuery(/^alerts:show:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1];
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const items = (await watchlists.read(key)) ?? [];
  const item = items.find((i) => i.ticker === ticker);

  if (!item) {
    await ctx.editMessageText(
      `${ticker} isn't on your watchlist.`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) },
    );
    return;
  }

  if (item.alerts.length === 0) {
    await ctx.editMessageText(
      `🔔 No alerts for ${ticker} yet.`,
      {
        reply_markup: inlineKeyboard([
          [inlineButton("➕ Add alert", `alerts:add:${ticker}`)],
          [inlineButton("⬅️ Back", `watchlist:detail:${ticker}`)],
        ]),
      },
    );
    return;
  }

  const rows = item.alerts.map((alert) => {
    const label = formatAlertLabel(alert);
    return [
      inlineButton(label, `alerts:toggle:${ticker}:${alert.id}`),
      inlineButton("🗑", `alerts:delete:${ticker}:${alert.id}`),
    ];
  });

  rows.push([inlineButton("➕ Add alert", `alerts:add:${ticker}`)]);
  rows.push([inlineButton("⬅️ Back", `watchlist:detail:${ticker}`)]);

  await ctx.editMessageText(
    `🔔 Alerts for ${ticker} (${item.alerts.length}):`,
    { reply_markup: inlineKeyboard(rows) },
  );
});

composer.callbackQuery(/^alerts:add:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1];

  await ctx.editMessageText(
    `What kind of alert for ${ticker}?`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("📈 Price above…", `alerts:settype:price_above:${ticker}`)],
        [inlineButton("📉 Price below…", `alerts:settype:price_below:${ticker}`)],
        [inlineButton("📊 % change…", `alerts:settype:percent_change:${ticker}`)],
        [inlineButton("⬅️ Back", `alerts:show:${ticker}`)],
      ]),
    },
  );
});

composer.callbackQuery(/^alerts:settype:([^:]+):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const alertType = ctx.match![1];
  const ticker = ctx.match![2];
  await handleAlertType(ctx, alertType, ticker);
});

async function handleAlertType(ctx: Ctx, alertType: string, ticker: string) {
  const typeLabel = alertType === "price_above" ? "price above"
    : alertType === "price_below" ? "price below"
    : "percent change";

  await ctx.editMessageText(
    `Enter the ${typeLabel} threshold for ${ticker} (just the number, e.g. 50000):`,
    {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Cancel", `alerts:add:${ticker}`)]]),
    },
  );

  ctx.session.step = "awaiting_alert_value";
  ctx.session.flowData = { ticker, alertType };
}

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_alert_value") return next();

  const flowData = ctx.session.flowData as { ticker: string; alertType: string } | undefined;
  if (!flowData) {
    ctx.session.step = undefined;
    ctx.session.flowData = undefined;
    return next();
  }

  const value = parseFloat(ctx.message.text.trim());
  if (isNaN(value) || value <= 0) {
    await ctx.reply("Please enter a valid positive number.");
    return;
  }

  const { ticker, alertType } = flowData;
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const items = (await watchlists.read(key)) ?? [];
  const item = items.find((i) => i.ticker === ticker);

  if (!item) {
    await ctx.reply(`${ticker} isn't on your watchlist.`);
    ctx.session.step = undefined;
    ctx.session.flowData = undefined;
    return;
  }

  const alertId = `${alertType}_${Date.now()}`;
  const newAlert: AlertDefinition = {
    id: alertId,
    type: alertType as AlertDefinition["type"],
    value,
    enabled: true,
  };

  item.alerts.push(newAlert);
  await watchlists.write(key, items);

  ctx.session.step = undefined;
  ctx.session.flowData = undefined;

  const label = formatAlertLabel(newAlert);
  await ctx.reply(
    `✅ Alert created: ${label} for ${ticker}.`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("🔔 All alerts", `alerts:show:${ticker}`)],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery(/^alerts:toggle:(.+):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1];
  const alertId = ctx.match![2];
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const items = (await watchlists.read(key)) ?? [];
  const item = items.find((i) => i.ticker === ticker);
  if (!item) return;

  const alert = item.alerts.find((a) => a.id === alertId);
  if (!alert) return;

  alert.enabled = !alert.enabled;
  await watchlists.write(key, items);

  const status = alert.enabled ? "enabled" : "disabled";
  const label = formatAlertLabel(alert);
  await ctx.editMessageText(
    `🔔 ${label} ${status}.`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back", `alerts:show:${ticker}`)]]) },
  );
});

composer.callbackQuery(/^alerts:delete:(.+):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match![1];
  const alertId = ctx.match![2];
  const userId = ctx.from?.id;
  if (!userId) return;

  const key = String(userId);
  const items = (await watchlists.read(key)) ?? [];
  const item = items.find((i) => i.ticker === ticker);
  if (!item) return;

  item.alerts = item.alerts.filter((a) => a.id !== alertId);
  await watchlists.write(key, items);

  await ctx.editMessageText(
    `🗑 Alert deleted.`,
    { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back", `alerts:show:${ticker}`)]]) },
  );
});

function formatAlertLabel(alert: AlertDefinition): string {
  const icon = alert.enabled ? "🟢" : "🔴";
  if (alert.type === "price_above") return `${icon} Price above $${alert.value}`;
  if (alert.type === "price_below") return `${icon} Price below $${alert.value}`;
  return `${icon} ${alert.value}% change`;
}

export default composer;
