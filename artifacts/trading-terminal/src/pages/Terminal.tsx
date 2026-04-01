import React, { useMemo } from 'react';
import {
  useGetMarketPrice,
  useGetMarketCandles,
  useGetForecast,
  useGetAgentDecision,
  useGetAggregation,
  useGetReasoning,
  useGetFinalDecision
} from '../api-client/api';
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Bar,
} from 'recharts';
import { format } from 'date-fns';

const REFETCH_INTERVAL = 8000;

// Institutional color palette — data-semantic only, no neon
const COLOR_UP      = '#3FA37C';
const COLOR_DOWN    = '#C04A4A';
const COLOR_NEUTRAL = '#D1D5DB';
const COLOR_GRID    = 'rgba(255,255,255,0.06)';

interface Candle { open: number; close: number; high: number; low: number; volume: number; timestamp: string; }
interface BgRect  { x: number; y: number; width: number; height: number; }

// Candlestick shape — uses the plot-area bounds + pre-computed price domain
// to correctly position wicks and bodies without relying on internal Recharts scale refs
function makeCandleShape(pMin: number, pMax: number) {
  return function CandlestickBar(props: {
    x?: number; width?: number;
    background?: BgRect;
    payload?: Candle;
    [k: string]: unknown;
  }) {
    const { x = 0, width = 0, background, payload } = props;
    if (!payload || !background) return null;

    const range = pMax - pMin || 1;
    const scale = (price: number) =>
      background.y + (1 - (price - pMin) / range) * background.height;

    const { open, close, high, low } = payload;
    const isUp   = close >= open;
    const color  = isUp ? COLOR_UP : COLOR_DOWN;

    const yOpen  = scale(open);
    const yClose = scale(close);
    const yHigh  = scale(high);
    const yLow   = scale(low);

    const bodyTop    = Math.min(yOpen, yClose);
    const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1.5);
    const cx         = x + width / 2;
    const wickW      = Math.max(width * 0.1, 0.8);
    const bodyW      = Math.max(width * 0.62, 2);

    return (
      <g>
        <line x1={cx} y1={yHigh} x2={cx} y2={yLow}
          stroke={color} strokeWidth={wickW} opacity={0.7}
          style={{ transition: 'stroke 200ms ease' }} />
        <rect
          x={cx - bodyW / 2} y={bodyTop}
          width={bodyW} height={bodyHeight}
          fill={color} opacity={0.85}
          style={{ transition: 'fill 200ms ease' }} />
      </g>
    );
  };
}

// Volume bar with direction color
function VolumeBar(props: {
  x?: number; y?: number; width?: number; height?: number;
  payload?: Candle;
  [k: string]: unknown;
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload) return null;
  const isUp = payload.close >= payload.open;
  return (
    <rect x={x} y={y}
      width={Math.max(width - 1, 1)} height={height}
      fill={isUp ? COLOR_UP : COLOR_DOWN} opacity={0.28}
      style={{ transition: 'fill 200ms ease' }} />
  );
}

// Tooltip for chart
function ChartTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: Candle }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isUp  = d.close >= d.open;
  const color = isUp ? COLOR_UP : COLOR_DOWN;
  const fmt   = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div style={{ background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 14px', fontFamily: 'monospace', fontSize: 11 }}>
      <div style={{ color: '#888', marginBottom: 6 }}>{format(new Date(d.timestamp), 'HH:mm dd MMM')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
        <span style={{ color: '#666' }}>O</span><span style={{ color }}>{fmt(d.open)}</span>
        <span style={{ color: '#666' }}>H</span><span style={{ color: COLOR_UP }}>{fmt(d.high)}</span>
        <span style={{ color: '#666' }}>L</span><span style={{ color: COLOR_DOWN }}>{fmt(d.low)}</span>
        <span style={{ color: '#666' }}>C</span><span style={{ color }}>{fmt(d.close)}</span>
        <span style={{ color: '#666' }}>V</span><span style={{ color: COLOR_NEUTRAL }}>{d.volume.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function Terminal() {
  const symbol = "BTC/USD";

  const { data: priceData }    = useGetMarketPrice({ symbol }, { query: { refetchInterval: REFETCH_INTERVAL } });
  const { data: candlesData }  = useGetMarketCandles({ symbol, limit: 100 }, { query: { refetchInterval: REFETCH_INTERVAL } });
  const { data: forecast }     = useGetForecast({ symbol }, { query: { refetchInterval: REFETCH_INTERVAL } });
  const { data: agentDecisions } = useGetAgentDecision({ symbol }, { query: { refetchInterval: REFETCH_INTERVAL } });
  const { data: aggregation }  = useGetAggregation({ symbol }, { query: { refetchInterval: REFETCH_INTERVAL } });
  const { data: reasoning }    = useGetReasoning({ symbol }, { query: { refetchInterval: REFETCH_INTERVAL } });
  const { data: finalDecision } = useGetFinalDecision({ symbol }, { query: { refetchInterval: REFETCH_INTERVAL } });

  const isUp = (priceData?.changePercent24h ?? 0) >= 0;
  const priceColor = isUp ? COLOR_UP : COLOR_DOWN;

  // Prepare chart data — oldest first
  const chartData = candlesData ? [...candlesData.candles].reverse() : [];

  // Price domain for candlestick shape — adds 2% padding so wicks aren't clipped
  const { pMin, pMax } = useMemo(() => {
    if (!chartData.length) return { pMin: 0, pMax: 1 };
    let lo = Infinity, hi = -Infinity;
    for (const c of chartData) {
      if (c.low  < lo) lo = c.low;
      if (c.high > hi) hi = c.high;
    }
    const pad = (hi - lo) * 0.02;
    return { pMin: lo - pad, pMax: hi + pad };
  }, [chartData]);

  // Stable custom candlestick shape keyed to the current domain
  const CandleShape = useMemo(() => makeCandleShape(pMin, pMax), [pMin, pMax]);

  return (
    <div className="h-screen w-full bg-background flex flex-col font-sans text-sm overflow-hidden">

      {/* Top Bar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0 bg-card">
        <div className="flex items-center gap-6">
          <div className="font-mono tracking-widest text-xs font-semibold text-primary">NEXUS</div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-4">
            <span className="font-bold tracking-tight text-foreground">{symbol}</span>
            {priceData && (
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg">
                  ${priceData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="font-mono text-xs" style={{ color: priceColor, transition: 'color 200ms ease' }}>
                  {isUp ? '+' : ''}{priceData.changePercent24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
          <span>{new Date().toISOString().split('T')[1].substring(0, 8)} UTC</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: COLOR_UP }} />
            Connected
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel: Chart */}
        <div className="w-[60%] flex flex-col border-r border-border shrink-0">
          <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price Action</span>
            <span className="text-xs font-mono text-muted-foreground">15m · BTC/USD</span>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#040405' }}>
            {/* Price chart — 75% height */}
            <div style={{ flex: 3, minHeight: 0 }}>
              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 12, right: 56, left: 0, bottom: 0 }}
                    barCategoryGap="15%"
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke={COLOR_GRID}
                      strokeDasharray="0"
                    />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(t) => format(new Date(t), 'HH:mm')}
                      stroke="transparent"
                      tick={{ fill: '#444', fontSize: 9, fontFamily: 'monospace' }}
                      minTickGap={40}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="price"
                      domain={['auto', 'auto']}
                      orientation="right"
                      stroke="transparent"
                      tick={{ fill: '#555', fontSize: 9, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v.toLocaleString()}
                      width={54}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Bar
                      yAxisId="price"
                      dataKey="close"
                      shape={<CandleShape />}
                      isAnimationActive={false}
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Volume chart — 25% height */}
            <div style={{ flex: 1, minHeight: 0, borderTop: `1px solid ${COLOR_GRID}` }}>
              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 4, right: 56, left: 0, bottom: 4 }}
                    barCategoryGap="15%"
                  >
                    <XAxis dataKey="timestamp" hide />
                    <YAxis
                      orientation="right"
                      stroke="transparent"
                      tick={{ fill: '#444', fontSize: 8, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      width={54}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    />
                    <Bar
                      dataKey="volume"
                      shape={<VolumeBar />}
                      isAnimationActive={false}
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Intelligence Modules */}
        <div className="w-[40%] flex flex-col overflow-y-auto bg-background shrink-0">

          {/* L1: LSTM */}
          <ModuleWrapper label="L1 : LSTM Forecast" confidence={forecast?.modelConfidence}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="col-span-2">
                <div className="flex justify-between text-xs mb-1.5 font-mono text-muted-foreground">
                  <span>Down</span>
                  <span>Up</span>
                </div>
                <div className="h-1.5 w-full bg-border relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full"
                    style={{
                      width: `${(forecast?.directionProbability ?? 0) * 100}%`,
                      background: (forecast?.directionProbability ?? 0) > 0.5 ? COLOR_UP : COLOR_DOWN,
                      transition: 'width 600ms ease, background 200ms ease',
                    }}
                  />
                </div>
                <div className="text-center mt-1 font-mono text-xs text-muted-foreground">
                  {(forecast?.directionProbability ?? 0).toFixed(3)}
                </div>
              </div>
              <DataPoint label="Expected Range" value={`$${forecast?.expectedRange.toLocaleString()}`} />
              <DataPoint label="Horizon" value={forecast?.horizon || '-'} />
              <DataPoint label="Next High Dist" value={`+$${forecast?.nextHighDistance?.toLocaleString()}`} positive />
              <DataPoint label="Next Low Dist" value={`-$${forecast?.nextLowDistance?.toLocaleString()}`} negative />
            </div>
          </ModuleWrapper>

          {/* L2: NEAT */}
          <ModuleWrapper label="L2 : NEAT Agents" confidence={agentDecisions?.consensusScore}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Consensus Intent</span>
                <IntentBadge intent={agentDecisions?.consensusIntent} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {agentDecisions?.agents.map((agent) => (
                  <div key={agent.agentId} className="p-3 border border-border bg-card flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-muted-foreground">{agent.agentId}</span>
                      <IntentBadge intent={agent.tradeIntent} small />
                    </div>
                    <div className="h-0.5 w-full bg-border">
                      <div
                        className="h-full"
                        style={{
                          width: `${agent.fitness * 100}%`,
                          background: COLOR_NEUTRAL,
                          opacity: 0.6,
                          transition: 'width 400ms ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ModuleWrapper>

          {/* L3: Aggregation */}
          <ModuleWrapper label="L3 : Aggregation Weights" confidence={aggregation?.regimeConfidence}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Market Regime</span>
                <span className="text-xs font-mono tracking-wider" style={{ color: COLOR_NEUTRAL }}>{aggregation?.regime}</span>
              </div>
              {aggregation?.weights && (
                <div className="flex flex-col gap-2 font-mono text-xs">
                  <WeightBar label="LSTM"     value={aggregation.weights.lstmWeight} />
                  <WeightBar label="NEAT"     value={aggregation.weights.neatWeight} />
                  <WeightBar label="Momentum" value={aggregation.weights.momentumWeight} />
                  <WeightBar label="Mean Rev" value={aggregation.weights.meanReversionWeight} />
                </div>
              )}
              {aggregation && (
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Signal</span>
                  <IntentBadge intent={aggregation.signalLabel?.replace('_', ' ')} />
                </div>
              )}
            </div>
          </ModuleWrapper>

          {/* L4: Reasoning */}
          <ModuleWrapper label="L4 : Semantic Reasoning" confidence={reasoning?.confidenceScore}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Context</span>
                <span className="text-xs font-mono" style={{ color: COLOR_NEUTRAL }}>{reasoning?.contextLabel}</span>
              </div>
              <div className="text-xs leading-relaxed text-muted-foreground">
                {reasoning?.reasoningSummary}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {reasoning?.keyFactors.map((factor, i) => (
                  <span key={i} className="px-2 py-0.5 bg-card border border-border text-[10px] font-mono text-muted-foreground">
                    {factor}
                  </span>
                ))}
              </div>
              {reasoning?.riskWarnings && reasoning.riskWarnings.length > 0 && (
                <div className="p-3 border flex flex-col gap-1" style={{ borderColor: `${COLOR_DOWN}33`, background: `${COLOR_DOWN}08` }}>
                  <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: `${COLOR_DOWN}bb` }}>
                    Risk Warnings
                  </div>
                  {reasoning.riskWarnings.map((w, i) => (
                    <div key={i} className="text-[11px]" style={{ color: `${COLOR_DOWN}99` }}>· {w}</div>
                  ))}
                </div>
              )}
              {reasoning?.vetoSignal && (
                <div className="p-2 text-xs font-mono text-center uppercase tracking-widest border" style={{ borderColor: `${COLOR_DOWN}66`, color: COLOR_DOWN, background: `${COLOR_DOWN}12` }}>
                  Veto Active — {reasoning.vetoReason}
                </div>
              )}
            </div>
          </ModuleWrapper>

          {/* L5: Final Decision */}
          <div className="flex-1 min-h-[220px] border-b border-border p-6 flex flex-col gap-5 bg-card">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">L5 : Final Output</div>
            <div className="flex items-end justify-between">
              <div
                className="text-6xl font-light tracking-tighter"
                style={{
                  color: finalDecision?.action === 'BUY'  ? COLOR_UP
                       : finalDecision?.action === 'SELL' ? COLOR_DOWN
                       : finalDecision?.action === 'VETO' ? '#B8860B'
                       : COLOR_NEUTRAL,
                  transition: 'color 200ms ease',
                }}
              >
                {finalDecision?.action || 'HOLD'}
              </div>
              <div className="text-right pb-1">
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Confidence</div>
                <div className="text-xl font-mono">{(finalDecision?.confidence ?? 0).toFixed(3)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
              <div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase">Pos Size</div>
                <div className="text-sm font-mono mt-1">
                  {((finalDecision?.positionSize ?? 0) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase">Stop Loss</div>
                <div className="text-sm font-mono mt-1" style={{ color: COLOR_DOWN }}>
                  ${finalDecision?.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase">Take Profit</div>
                <div className="text-sm font-mono mt-1" style={{ color: COLOR_UP }}>
                  ${finalDecision?.takeProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {[
                { label: 'LSTM', vote: finalDecision?.layerVotes.lstmVote },
                { label: 'AGENTS', vote: finalDecision?.layerVotes.agentVote },
                { label: 'AGG', vote: finalDecision?.layerVotes.aggregationVote },
                { label: 'REASON', vote: finalDecision?.layerVotes.reasoningVote },
              ].map(({ label, vote }) => (
                <div key={label} className="flex flex-col gap-1 items-center p-2 border border-border">
                  <span className="text-[9px] text-muted-foreground font-mono uppercase">{label}</span>
                  <IntentBadge intent={vote} small />
                </div>
              ))}
            </div>

            {finalDecision?.executionRecommendation && (
              <div className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3 font-mono">
                {finalDecision.executionRecommendation}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModuleWrapper({ label, confidence, children }: {
  label: string;
  confidence?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        {confidence !== undefined && (
          <span style={{ opacity: 0.45 }}>CONF {confidence.toFixed(2)}</span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function DataPoint({ label, value, positive, negative }: {
  label: string;
  value: string | number;
  positive?: boolean;
  negative?: boolean;
}) {
  const color = positive ? COLOR_UP : negative ? COLOR_DOWN : undefined;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">{label}</span>
      <span className="font-mono text-sm" style={color ? { color } : undefined}>{value}</span>
    </div>
  );
}

function WeightBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-[10px] text-muted-foreground truncate">{label}</span>
      <div className="flex-1 h-1 bg-border">
        <div
          className="h-full"
          style={{
            width: `${value * 100}%`,
            background: COLOR_NEUTRAL,
            opacity: 0.55,
            transition: 'width 400ms ease',
          }}
        />
      </div>
      <span className="w-8 text-right text-[10px] font-mono">{value.toFixed(2)}</span>
    </div>
  );
}

function IntentBadge({ intent, small }: { intent?: string; small?: boolean }) {
  if (!intent) return null;
  const up   = intent === 'BUY'  || intent === 'STRONG BUY'  || intent === 'STRONG_BUY';
  const down = intent === 'SELL' || intent === 'STRONG SELL' || intent === 'STRONG_SELL';
  const veto = intent === 'VETO';

  const color = up ? COLOR_UP : down ? COLOR_DOWN : veto ? '#B8860B' : COLOR_NEUTRAL;

  return (
    <span
      className={`font-mono font-bold tracking-widest border ${small ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}
      style={{
        color,
        borderColor: `${color}44`,
        transition: 'color 200ms ease, border-color 200ms ease',
      }}
    >
      {intent}
    </span>
  );
}
