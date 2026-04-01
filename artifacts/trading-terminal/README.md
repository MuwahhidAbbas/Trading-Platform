# NEXUS — Quantitative Trading Intelligence Platform

A premium multi-layer AI trading intelligence system. Designed as an internal prototype from a quantitative research team.

---

## Local Development (Git Bash / Windows)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd <repo-name>

# 2. Install dependencies for the trading terminal
cd artifacts/trading-terminal
npm install

# 3. Start the development server
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Deploying to Netlify via GitHub

The repo root contains a `netlify.toml` that configures everything automatically.

### Step 1 — Push to GitHub (Git Bash)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2 — Import into Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**
2. Connect GitHub and select your repository
3. Netlify auto-detects the `netlify.toml` at the repo root:
   - **Base directory**: `artifacts/trading-terminal`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `dist/public`
4. Click **Deploy site**

No manual configuration required.

---

## Architecture — 5-Layer Intelligence Stack

| Layer | Name | Description |
|-------|------|-------------|
| L1 | LSTM Forecast | Deep learning price direction prediction |
| L2 | NEAT Agents | Multi-agent neuroevolution trade decisions |
| L3 | Aggregation | Regime-based multi-agent signal weighting |
| L4 | Semantic Reasoning | LLM-style context and veto analysis |
| L5 | Final Decision Engine | Unified cross-layer decision synthesis |

## Tech Stack

- **Frontend**: React 19 + Vite + TailwindCSS v4
- **Charts**: Recharts
- **State**: TanStack React Query (8-second auto-refresh)
- **Routing**: Wouter
- **UI**: Radix UI primitives + custom quant research design system

---

## Adding a Custom API Backend

To point the frontend at your own backend, create a `.env` file in `artifacts/trading-terminal/`:

```bash
echo "VITE_API_BASE_URL=https://your-api.example.com" > artifacts/trading-terminal/.env
```

Or add it as an environment variable in the Netlify dashboard under **Site settings > Environment variables**.
