# NEXUS — Quantitative Trading Intelligence Platform

## Overview

A premium multi-layer AI trading intelligence platform. Designed as an internal prototype from a quantitative research team. Features a cinematic boot screen, editorial landing page, and a full trading terminal with 5 intelligence layers that auto-refresh every 8 seconds.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite + TailwindCSS v4
- **Charts**: Recharts
- **State management**: TanStack React Query
- **Routing**: Wouter
- **UI components**: Radix UI primitives
- **API framework**: Express 5
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (API) + Vite (frontend)

## Deployment Flow

```
Developer → VS Code (Git Bash) → GitHub → Netlify (auto-deploy)
```

The root `netlify.toml` configures Netlify to build from `artifacts/trading-terminal/`.

## Structure

```
artifacts/
  trading-terminal/     # React + Vite frontend (Netlify deployable)
    src/
      api-client/       # Inlined generated API client (no workspace deps)
      pages/
        BootScreen.tsx  # Cinematic loading screen (/ route)
        Landing.tsx     # System overview / landing page (/landing)
        Terminal.tsx    # Main trading terminal (/terminal)
    netlify.toml        # Netlify build config (also at root)
    README.md           # Git Bash setup and deployment guide
  api-server/           # Express API server (Node.js backend)
    src/routes/
      market.ts         # /api/market/price + /api/market/candles
      forecast.ts       # /api/forecast (LSTM layer)
      agents.ts         # /api/agents/decision (NEAT agents)
      aggregation.ts    # /api/aggregate (regime weighting)
      reasoning.ts      # /api/reasoning (LLM reasoning layer)
      decision.ts       # /api/decision (final decision engine)
lib/
  api-spec/openapi.yaml # OpenAPI spec (single source of truth)
  api-client-react/     # Generated React Query hooks
  api-zod/              # Generated Zod validation schemas
netlify.toml            # Root Netlify config (base: artifacts/trading-terminal)
```

## Intelligence Layers

| Layer | Endpoint | Description |
|-------|----------|-------------|
| L1 | /api/forecast | LSTM price direction probability |
| L2 | /api/agents/decision | NEAT multi-agent trade intent |
| L3 | /api/aggregate | Regime-based signal aggregation |
| L4 | /api/reasoning | Structured reasoning + veto |
| L5 | /api/decision | Final cross-layer decision |

## Root Scripts

- `pnpm run build` — typecheck + build all packages
- `pnpm run typecheck` — full TypeScript check via project references

## Codegen

Run after changing `lib/api-spec/openapi.yaml`:
```
pnpm --filter @workspace/api-spec run codegen
```

## Netlify Deployment (Git Bash Commands)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <github-url>
git push -u origin main
```

Then import repo in Netlify — it reads `netlify.toml` automatically.
No manual Netlify configuration needed.
