import { Router, type IRouter } from "express";
import { GetAggregationResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const REGIMES = ["TRENDING", "RANGING", "VOLATILE", "BREAKOUT"] as const;
const SIGNAL_LABELS = ["STRONG_BUY", "BUY", "NEUTRAL", "SELL", "STRONG_SELL"] as const;

function pickRegime(): typeof REGIMES[number] {
  const r = Math.random();
  if (r < 0.3) return "TRENDING";
  if (r < 0.55) return "RANGING";
  if (r < 0.75) return "VOLATILE";
  return "BREAKOUT";
}

function signalToLabel(signal: number): typeof SIGNAL_LABELS[number] {
  if (signal > 0.5) return "STRONG_BUY";
  if (signal > 0.15) return "BUY";
  if (signal > -0.15) return "NEUTRAL";
  if (signal > -0.5) return "SELL";
  return "STRONG_SELL";
}

router.get("/aggregate", (req, res) => {
  const symbol = (req.query["symbol"] as string) || "BTC/USD";
  const regime = pickRegime();

  let lstmWeight: number;
  let neatWeight: number;
  let momentumWeight: number;
  let meanReversionWeight: number;

  if (regime === "TRENDING") {
    lstmWeight = 0.38;
    neatWeight = 0.3;
    momentumWeight = 0.24;
    meanReversionWeight = 0.08;
  } else if (regime === "RANGING") {
    lstmWeight = 0.22;
    neatWeight = 0.25;
    momentumWeight = 0.15;
    meanReversionWeight = 0.38;
  } else if (regime === "VOLATILE") {
    lstmWeight = 0.28;
    neatWeight = 0.36;
    momentumWeight = 0.2;
    meanReversionWeight = 0.16;
  } else {
    lstmWeight = 0.3;
    neatWeight = 0.32;
    momentumWeight = 0.28;
    meanReversionWeight = 0.1;
  }

  const perturbation = (base: number) =>
    Math.round(Math.max(0.05, base + (Math.random() - 0.5) * 0.1) * 1000) / 1000;

  const weights = {
    lstmWeight: perturbation(lstmWeight),
    neatWeight: perturbation(neatWeight),
    momentumWeight: perturbation(momentumWeight),
    meanReversionWeight: perturbation(meanReversionWeight),
  };

  const aggregatedSignal = Math.round(((Math.random() - 0.44) * 1.4) * 1000) / 1000;
  const clampedSignal = Math.max(-1, Math.min(1, aggregatedSignal));

  const data = GetAggregationResponse.parse({
    symbol,
    regime,
    weights,
    aggregatedSignal: clampedSignal,
    signalLabel: signalToLabel(clampedSignal),
    regimeConfidence: Math.round((0.55 + Math.random() * 0.38) * 1000) / 1000,
    timestamp: new Date().toISOString(),
  });

  res.json(data);
});

export default router;
