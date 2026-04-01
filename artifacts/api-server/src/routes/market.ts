import { Router, type IRouter } from "express";
import { GetMarketPriceResponse, GetMarketCandlesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const BASE_PRICES: Record<string, number> = {
  "BTC/USD": 67420,
  "ETH/USD": 3580,
  "SOL/USD": 158,
};

function getBasePrice(symbol: string): number {
  return BASE_PRICES[symbol] ?? 50000;
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateCandles(symbol: string, count: number) {
  const base = getBasePrice(symbol);
  const candles = [];
  let price = base * 0.92;
  const now = Date.now();
  const intervalMs = 15 * 60 * 1000;

  for (let i = count; i >= 0; i--) {
    const drift = (Math.random() - 0.475) * price * 0.012;
    const open = price;
    const volatility = price * randBetween(0.003, 0.018);
    const high = open + volatility;
    const low = open - volatility * randBetween(0.4, 0.9);
    const close = open + drift;
    const volume = randBetween(800, 4200);

    candles.push({
      timestamp: new Date(now - i * intervalMs).toISOString(),
      open: Math.max(open, 0.01),
      high: Math.max(high, open),
      low: Math.max(low, open * 0.95),
      close: Math.max(close, 0.01),
      volume: Math.round(volume),
    });

    price = close;
  }

  return candles;
}

router.get("/market/price", (req, res) => {
  const symbol = (req.query["symbol"] as string) || "BTC/USD";
  const base = getBasePrice(symbol);
  const change = (Math.random() - 0.46) * base * 0.035;
  const price = base + change;

  const data = GetMarketPriceResponse.parse({
    symbol,
    price: Math.round(price * 100) / 100,
    change24h: Math.round(change * 100) / 100,
    changePercent24h: Math.round((change / base) * 10000) / 100,
    volume24h: Math.round(randBetween(18000000, 62000000)),
    high24h: Math.round((price + price * 0.022) * 100) / 100,
    low24h: Math.round((price - price * 0.018) * 100) / 100,
    timestamp: new Date().toISOString(),
  });

  res.json(data);
});

router.get("/market/candles", (req, res) => {
  const symbol = (req.query["symbol"] as string) || "BTC/USD";
  const limit = Math.min(Number(req.query["limit"]) || 120, 300);

  const data = GetMarketCandlesResponse.parse({
    symbol,
    candles: generateCandles(symbol, limit),
  });

  res.json(data);
});

export default router;
