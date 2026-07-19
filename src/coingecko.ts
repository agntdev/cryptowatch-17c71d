const BASE_URL = "https://api.coingecko.com/api/v3";

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  usd: number;
}

export interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
}

const COIN_MAP: Record<string, CoinInfo> = {
  BTC: { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  ETH: { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  SOL: { id: "solana", symbol: "SOL", name: "Solana" },
  ADA: { id: "cardano", symbol: "ADA", name: "Cardano" },
  DOT: { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  DOGE: { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  XRP: { id: "ripple", symbol: "XRP", name: "XRP" },
  AVAX: { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  LINK: { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  MATIC: { id: "matic-network", symbol: "MATIC", name: "Polygon" },
  UNI: { id: "uniswap", symbol: "UNI", name: "Uniswap" },
  ATOM: { id: "cosmos", symbol: "ATOM", name: "Cosmos" },
  LTC: { id: "litecoin", symbol: "LTC", name: "Litecoin" },
  BCH: { id: "bitcoin-cash", symbol: "BCH", name: "Bitcoin Cash" },
  XLM: { id: "stellar", symbol: "XLM", name: "Stellar" },
  ALGO: { id: "algorand", symbol: "ALGO", name: "Algorand" },
  FIL: { id: "filecoin", symbol: "FIL", name: "Filecoin" },
  APT: { id: "aptos", symbol: "APT", name: "Aptos" },
  ARB: { id: "arbitrum", symbol: "ARB", name: "Arbitrum" },
  OP: { id: "optimism", symbol: "OP", name: "Optimism" },
};

export function resolveCoinId(ticker: string): CoinInfo | null {
  const upper = ticker.toUpperCase();
  if (COIN_MAP[upper]) return COIN_MAP[upper];
  const entries = Object.values(COIN_MAP);
  const exact = entries.find((c) => c.symbol === upper || c.name.toUpperCase() === upper);
  if (exact) return exact;
  const lower = upper.toLowerCase();
  const partial = entries.find(
    (c) => c.id.includes(lower) || c.name.toLowerCase().includes(lower),
  );
  return partial ?? null;
}

export async function fetchPrice(coinId: string): Promise<number | null> {
  try {
    const res = await fetch(`${BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd`);
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, { usd?: number }>;
    return data[coinId]?.usd ?? null;
  } catch {
    return null;
  }
}

export async function fetchPrices(
  coinIds: string[],
): Promise<Record<string, number>> {
  if (coinIds.length === 0) return {};
  try {
    const ids = coinIds.join(",");
    const res = await fetch(`${BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd`);
    if (!res.ok) return {};
    const data = (await res.json()) as Record<string, { usd?: number }>;
    const result: Record<string, number> = {};
    for (const [id, val] of Object.entries(data)) {
      if (val.usd !== undefined) result[id] = val.usd;
    }
    return result;
  } catch {
    return {};
  }
}

export function formatPrice(price: number): string {
  if (price >= 1) {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${price.toFixed(6)}`;
}

export function percentChange(oldPrice: number, newPrice: number): number {
  if (oldPrice === 0) return 0;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}
