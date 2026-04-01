import { Router, type IRouter } from "express";
import { GetAgentDecisionResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const AGENT_IDS = ["NEAT-α", "NEAT-β", "NEAT-γ", "NEAT-δ", "NEAT-ε"];
const INTENTS = ["BUY", "SELL", "HOLD"] as const;

function weightedRandom(): "BUY" | "SELL" | "HOLD" {
  const r = Math.random();
  if (r < 0.42) return "BUY";
  if (r < 0.72) return "HOLD";
  return "SELL";
}

router.get("/agents/decision", (req, res) => {
  const symbol = (req.query["symbol"] as string) || "BTC/USD";

  const agents = AGENT_IDS.map((agentId) => {
    const tradeIntent = weightedRandom();
    const directionBias =
      tradeIntent === "BUY"
        ? 0.1 + Math.random() * 0.8
        : tradeIntent === "SELL"
        ? -(0.1 + Math.random() * 0.8)
        : (Math.random() - 0.5) * 0.4;

    return {
      agentId,
      tradeIntent,
      directionBias: Math.round(directionBias * 1000) / 1000,
      riskScore: Math.round((0.15 + Math.random() * 0.7) * 1000) / 1000,
      exitBias: Math.round(Math.random() * 0.6 * 1000) / 1000,
      fitness: Math.round((0.3 + Math.random() * 0.65) * 1000) / 1000,
    };
  });

  const buyVotes = agents.filter((a) => a.tradeIntent === "BUY").length;
  const sellVotes = agents.filter((a) => a.tradeIntent === "SELL").length;
  const holdVotes = agents.filter((a) => a.tradeIntent === "HOLD").length;

  let consensusIntent: "BUY" | "SELL" | "HOLD" = "HOLD";
  if (buyVotes > sellVotes && buyVotes > holdVotes) consensusIntent = "BUY";
  else if (sellVotes > buyVotes && sellVotes > holdVotes) consensusIntent = "SELL";

  const maxVotes = Math.max(buyVotes, sellVotes, holdVotes);
  const consensusScore = Math.round((maxVotes / agents.length) * 1000) / 1000;

  const data = GetAgentDecisionResponse.parse({
    symbol,
    agents,
    consensusIntent,
    consensusScore,
    timestamp: new Date().toISOString(),
  });

  res.json(data);
});

export default router;
