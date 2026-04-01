import { Router, type IRouter } from "express";
import { GetReasoningResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const CONTEXT_LABELS = [
  "Bullish Continuation",
  "Bearish Reversal Setup",
  "Range Compression",
  "Momentum Exhaustion",
  "Breakout Consolidation",
  "Macro Risk-Off",
  "Liquidity Hunt",
  "Accumulation Phase",
];

const KEY_FACTORS_POOL = [
  "LSTM sequence confidence elevated",
  "Agent consensus strong",
  "Volume profile bullish divergence",
  "RSI momentum building",
  "Market structure intact",
  "Funding rates elevated — caution",
  "Open interest expansion",
  "Historical volatility contracting",
  "Correlation to BTC weakening",
  "Order flow imbalance detected",
  "Smart money accumulation pattern",
  "Regime shift probability elevated",
];

const RISK_WARNINGS_POOL = [
  "High volatility regime — reduce position size",
  "Funding rates elevated — watch for squeeze",
  "Low liquidity window — wider spreads",
  "Upcoming macro event — model uncertainty elevated",
  "Correlation breakdown may signal regime change",
];

const REASONING_SUMMARIES = [
  "LSTM directional signal aligns with NEAT agent consensus. Aggregation weights favor trend-following in current regime. Key risk: elevated funding rates may signal near-term reversion. Reasoning layer maintains bullish positioning with reduced leverage recommendation.",
  "Multi-agent consensus diverges from LSTM forecast. Regime classifier indicates ranging environment — mean reversion strategies assigned higher weight. Signal confidence insufficient for directional trade. Neutral positioning recommended pending resolution.",
  "Breakout setup detected with expanding volume profile. NEAT agents converging on long bias. Aggregation signal crosses threshold for BUY. Reasoning veto declined — fundamental regime conditions support continuation. Monitoring funding rate expansion closely.",
  "Momentum signals conflict with structural support analysis. LSTM confidence below threshold. Agent variance elevated — indicating market uncertainty. Reasoning layer assigning elevated risk score. Reduced position sizing with tight stop recommended.",
];

function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sampleN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

router.get("/reasoning", (req, res) => {
  const symbol = (req.query["symbol"] as string) || "BTC/USD";
  const confidenceScore = 0.48 + Math.random() * 0.42;
  const vetoSignal = Math.random() < 0.12;

  const data = GetReasoningResponse.parse({
    symbol,
    contextLabel: sample(CONTEXT_LABELS),
    confidenceScore: Math.round(confidenceScore * 1000) / 1000,
    vetoSignal,
    vetoReason: vetoSignal
      ? "Insufficient multi-layer consensus — signal conflict detected"
      : null,
    reasoningSummary: sample(REASONING_SUMMARIES),
    keyFactors: sampleN(KEY_FACTORS_POOL, 3 + Math.floor(Math.random() * 3)),
    riskWarnings: sampleN(RISK_WARNINGS_POOL, Math.floor(Math.random() * 3)),
    timestamp: new Date().toISOString(),
  });

  res.json(data);
});

export default router;
