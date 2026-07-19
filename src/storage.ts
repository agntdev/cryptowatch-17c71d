import { createRequire } from "node:module";
import type { StorageAdapter } from "grammy";
import { MemorySessionStorage } from "./toolkit/index.js";

export interface UserProfile {
  userId: number;
  timezone: string;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  summaryTime?: string;
  cooldownMinutes: number;
}

export interface AlertDefinition {
  id: string;
  type: "price_above" | "price_below" | "percent_change";
  direction?: "up" | "down";
  value: number;
  windowMinutes?: number;
  enabled: boolean;
}

export interface WatchlistItem {
  ticker: string;
  name: string;
  lastPrice?: number;
  alerts: AlertDefinition[];
  lastAlertTimestamp?: number;
}

export interface OwnerMetrics {
  activeUsers: number;
  watchlistEntries: number;
  alertFiringCounts: Record<string, number>;
}

function createRedisStorage<T>(prefix: string): StorageAdapter<T> | null {
  if (!process.env.REDIS_URL) return null;
  try {
    const require = createRequire(import.meta.url);
    const ioredis = require("ioredis");
    const Redis = ioredis.default ?? ioredis.Redis ?? ioredis;
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: false,
    });
    const { RedisSessionStorage } = require("./toolkit/session/redis.js") as typeof import("./toolkit/session/redis.js");
    return new RedisSessionStorage<T>(client, prefix);
  } catch {
    return null;
  }
}

function createStorage<T>(prefix: string): StorageAdapter<T> {
  return createRedisStorage<T>(prefix) ?? new MemorySessionStorage<T>();
}

export const userProfiles = createStorage<UserProfile>("cw:profile:");
export const watchlists = createStorage<WatchlistItem[]>("cw:watch:");
export const ownerMetrics = createStorage<OwnerMetrics>("cw:metrics:");

export function now(): number {
  return Date.now();
}

export function getTimezoneOffset(tz: string): number {
  try {
    const d = new Date();
    const utc = d.toLocaleString("en-US", { timeZone: "UTC" });
    const local = d.toLocaleString("en-US", { timeZone: tz });
    return (new Date(local).getTime() - new Date(utc).getTime()) / 3600000;
  } catch {
    return 0;
  }
}
