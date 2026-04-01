import { Router, type IRouter } from "express";
import { GetFinalDecisionResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const LAYER_VOTES = ["BUY", "SELL", "HOLD"] as const;
const REASONING_VOTES = ["BUY", "SELL", "HOLD", "VETO"] as const;
const ACTIONS = ["BUY", "SELL", "HOLD", "VETO"] as const;

const BASE_PRICES: Record<string, number> = {
  "BTC/USD": 67420,
  "ETH/USD": 3580,
  "SOL/USD": 158,
};

function getBasePrice(symbol: string): number {
  return BASE_PRICES[symbol] ?? 50000;
}

function weightedVote(): "BUY" | "SELL" | "HOLD" {
  const r = Math.random();
  if (r < 0.42) return "BUY";
  if (r < 0.72) return "HOLD";
  return "SELL";
}

const EXECUTION_RECOMMENDATIONS = [
  "Enter long position with 2% portfolio allocation. Scale in across two tranches. Set hard stop below nearest structural support.",
  "Await confirmation candle before entry. Current setup shows asymmetric risk-reward. Position sizing reduced due to regime uncertainty.",
  "Stand aside. Multi-layer signal conflict detected. Monitor for regime resolution before initiating directional exposure.",
  "VETO applied. Reasoning layer detected high-risk conditions. No new positions recommended. Existing positions — tighten stops.",
  "Momentum building — consider adding to existing long exposure on pullback to key level. Trail stop to breakeven.",
  "Soft short setup identified. Enter on strength, not weakness. Size conservatively — regime not fully confirmed bearish.",
];

function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

router.get("/decision", (req, res) => {
  const symbol = (req.query["symbol"] as string) || "BTC/USD";
  const base = getBasePrice(symbol);

  const lstmVote = weightedVote();
  const agentVote = weightedVote();
  const aggregationVote = weightedVote();
  const reasoningVote: "BUY" | "SELL" | "HOLD" | "VETO" =
    Math.random() < 0.1 ? "VETO" : weightedVote();

  const votes = [lstmVote, agentVote, aggregationVote, reasoningVote];
  const isVeto = reasoningVote === "VETO";

  let action: "BUY" | "SELL" | "HOLD" | "VETO";
  if (isVeto) {
    action = "VETO";
  } else {
    const nonVetoVotes = votes.filter((v) => v !== "VETO") as ("BUY" | "SELL" | "HOLD")[];
    const buys = nonVetoVotes.filter((v) => v === "BUY").length;
    const sells = nonVetoVotes.filter((v) => v === "SELL").length;
    const holds = nonVetoVotes.filter((v) => v === "HOLD").length;

    if (buys > sells && buys > holds) action = "BUY";
    else if (sells > buys && sells > holds) action = "SELL";
    else action = "HOLD";
  }

  const confidence = isVeto
    ? 0
    : Math.round((0.5 + Math.random() * 0.45) * 1000) / 1000;

  const positionSize = isVeto ? 0 : Math.round((0.01 + Math.random() * 0.04) * 1000) / 1000;

  const atr = base * 0.015;
  const stopDistance = atr * (1.2 + Math.random() * 1.5);
  const profitDistance = stopDistance * (1.5 + Math.random() * 2.5);

  const stopLoss =
    action === "BUY"
      ? Math.round((base - stopDistance) * 100) / 100
      : Math.round((base + stopDistance) * 100) / 100;

  const takeProfit =
    action === "BUY"
      ? Math.round((base + profitDistance) * 100) / 100
      : Math.round((base - profitDistance) * 100) / 100;

  const riskRewardRatio = Math.round((profitDistance / stopDistance) * 100) / 100;

  const data = GetFinalDecisionResponse.parse({
    symbol,
    action,
    confidence,
    positionSize,
    stopLoss,
    takeProfit,
    riskRewardRatio,
    layerVotes: {
      lstmVote,
      agentVote,
      aggregationVote,
      reasoningVote,
    },
    executionRecommendation: sample(EXECUTION_RECOMMENDATIONS),
    timestamp: new Date().toISOString(),
  });

  res.json(data);
});

export default router;
