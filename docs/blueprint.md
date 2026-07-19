# CryptoWatch — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A private Telegram bot for tracking crypto prices with customizable alerts (price thresholds and percentage moves) and optional daily summaries. Users manage watchlists via buttons/commands, set alert rules, and configure quiet hours/cooldowns. The bot owner receives aggregated usage metrics and operational warnings.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Individual crypto traders and hobbyists
- Bot owner/operator

## Success criteria

- Users can add/remove coins to watchlists with inline buttons/commands
- Price alerts trigger accurately with cooldown suppression
- Owner receives weekly metrics and critical warnings in admin chat
- Morning summaries deliver at user-specified local times

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Initialize user profile and show onboarding flow
- **/price** (command, actor: user, command: /price [TICKER]) — Show current price for specified ticker or full watchlist
- **/help** (command, actor: user, command: /help) — Display usage summary and examples
- **/settings** (command, actor: user, command: /settings) — Configure timezone, quiet hours, summary time, and cooldown duration
- **/mywatchlist** (command, actor: user, command: /mywatchlist) — Display current watchlist with inline controls
- **Add Bitcoin** (button, actor: user, callback: watchlist:add:BTC) — Add popular coin to watchlist
  - inputs: ticker symbol
  - outputs: watchlist item
- **Add Ethereum** (button, actor: user, callback: watchlist:add:ETH) — Add popular coin to watchlist
  - inputs: ticker symbol
  - outputs: watchlist item

## Flows

### Onboarding
_Trigger:_ /start

1. Request timezone selection
2. Save user profile
3. Show initial watchlist with popular coin buttons

_Data touched:_ user profile

### Price Alert Creation
_Trigger:_ Inline 'Alerts' button

1. Display alert type options
2. Collect threshold values
3. Save alert definition to watchlist item

_Data touched:_ alert definition, watchlist item

### Morning Summary
_Trigger:_ User-configured local time

1. Check watchlist prices
2. Format summary with notable moves
3. Send digest message

_Data touched:_ user profile, watchlist items

### Alert Suppression
_Trigger:_ Quiet hours period

1. Queue alerts
2. Deliver digest after quiet hours end

_Data touched:_ alert definition, user profile

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User Profile** _(retention: persistent)_ — User-specific preferences and settings
  - fields: telegram user id, timezone, quiet hours, summary time, cooldown duration
- **Watchlist Item** _(retention: persistent)_ — Tracked cryptocurrency with alert rules
  - fields: ticker symbol, friendly name, last-known price, alert definitions, last-alert timestamp
- **Alert Definition** _(retention: persistent)_ — Price alert rules with thresholds
  - fields: type, direction, value, time window, enabled flag
- **Owner Metrics** _(retention: persistent)_ — Aggregated operational statistics
  - fields: active users, watchlist entries, alert firing counts

## Integrations

- **Telegram** (required) — Private chat messaging and alert delivery
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Admin chat for weekly metrics and warnings
- On-demand user count reporting
- Alert type/behavior configuration overrides

## Notifications

- Price alerts to user private chats
- Daily summaries at configured times
- Owner admin warnings for price feed failures
- Post-quiet-hours alert digests

## Permissions & privacy

- All data stored per user with no sharing
- User can delete data via /stop command
- Price feed failures handled without exposing raw data

## Edge cases

- Unknown ticker fuzzy matching
- Price feed outages with silent retries
- Alert suppression during quiet hours
- Multiple alert types on same ticker

## Required tests

- End-to-end alert triggering with cooldown suppression
- Quiet hours digest delivery validation
- Price summary formatting with percent changes
- Admin metrics aggregation accuracy

## Assumptions

- Telegram locale used as default timezone
- 1-hour default cooldown and percent window
- Fuzzy ticker matching for typos
