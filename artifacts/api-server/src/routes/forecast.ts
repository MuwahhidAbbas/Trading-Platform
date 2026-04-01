import { Router, type IRouter } from "express";
import { GetForecastResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const BASE_PRICES: Record<string, number> = {
  "BTC/USD": 67420,
  "ETH/USD": 3580,
  "SOL/USD": 158,
};

function getBasePrice(symbol: string): number {
  return BASE_PRICES[symbol] ?? 50000;
}

router.get("/forecast", (req, res) => {
  const symbol = (req.query["symbol"] as string) || "BTC/USD";
  const base = getBasePrice(symbol);

  const directionProbability = 0.42 + Math.random() * 0.32;
  const modelConfidence = 0.55 + Math.random() * 0.38;
  const expectedRange = base * (0.008 + Math.random() * 0.024);

  const data = GetForecastResponse.parse({
    symbol,
    directionProbability: Math.round(directionProbability * 1000) / 1000,
    expectedRange: Math.round(expectedRange * 100) / 100,
    nextHighDistance: Math.round(base * (0.004 + Math.random() * 0.018) * 100) / 100,
    nextLowDistance: Math.round(base * (0.003 + Math.random() * 0.014) * 100) / 100,
    modelConfidence: Math.round(modelConfidence * 1000) / 1000,
    horizon: "4h",
    timestamp: new Date().toISOString(),
  });

  res.json(data);
});

export default router;
