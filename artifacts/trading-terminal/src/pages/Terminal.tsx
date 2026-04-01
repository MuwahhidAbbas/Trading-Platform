import React from 'react';
import { 
  useGetMarketPrice, 
  useGetMarketCandles, 
  useGetForecast, 
  useGetAgentDecision, 
  useGetAggregation, 
  useGetReasoning, 
  useGetFinalDecision 
} from '../api-client/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { format } from 'date-fns';

const REFETCH_INTERVAL = 8000;

export default function Terminal() {
  const symbol = "BTC/USD";
  
  const { data: priceData } = useGetMarketPrice({ symbol }, { query: { refetchInterval: REFETCH_INTERVAL } });
  const { data: candlesData } = useGetMarketCandles({ symbol, limit: 100 }, { query: { refetchInterval: REFETCH_INTERVAL } });
  const { data: forecast } = useGetForecast({ symbol }, { query: { refetchInterval: REFETCH_INTERVAL } });
  const { data: agentDecisions } = useGetAgentDecision({ symbol }, { query: { refetchInterval: REFETCH_INTERVAL } });
  const { data: aggregation } = useGetAggregation({ symbol }, { query: { refetchInterval: REFETCH_INTERVAL } });
  const { data: reasoning } = useGetReasoning({ symbol }, { query: { refetchInterval: REFETCH_INTERVAL } });
  const { data: finalDecision } = useGetFinalDecision({ symbol }, { query: { refetchInterval: REFETCH_INTERVAL } });

  const isUp = (priceData?.changePercent24h ?? 0) >= 0;

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
                <span className="font-mono text-lg">${priceData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`font-mono text-xs ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isUp ? '+' : ''}{priceData.changePercent24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">
          <span>{new Date().toISOString().split('T')[1].substring(0,8)} UTC</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Chart */}
        <div className="w-[60%] flex flex-col border-r border-border shrink-0">
          <div className="h-10 border-b border-border flex items-center px-4 bg-card shrink-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price Action</span>
          </div>
          <div className="flex-1 p-4 pb-0 bg-[#040405]">
            {candlesData?.candles && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={[...candlesData.candles].reverse()} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(tick) => format(new Date(tick), 'HH:mm')}
                    stroke="hsl(var(--border))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'monospace' }}
                    minTickGap={30}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="price"
                    domain={['auto', 'auto']} 
                    orientation="right"
                    stroke="hsl(var(--border))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val.toLocaleString()}
                  />
                  <YAxis yAxisId="volume" hide domain={[0, 'dataMax * 4']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 0 }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <Area 
                    yAxisId="price"
                    type="step" 
                    dataKey="close" 
                    stroke="hsl(var(--muted-foreground))" 
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    isAnimationActive={false}
                  />
                  <Bar yAxisId="volume" dataKey="volume" fill="hsl(var(--border))" isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Panel: Intelligence Modules */}
        <div className="w-[40%] flex flex-col overflow-y-auto bg-background shrink-0">
          
          {/* L1: LSTM */}
          <ModuleWrapper label="L1 : LSTM Forecast" confidence={forecast?.modelConfidence}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="col-span-2">
                <div className="flex justify-between text-xs mb-1 font-mono text-muted-foreground">
                  <span>Down Probability</span>
                  <span>Up Probability</span>
                </div>
                <div className="h-1.5 w-full bg-border relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-emerald-500/50" 
                    style={{ width: `${(forecast?.directionProbability ?? 0) * 100}%` }}
                  />
                </div>
                <div className="text-center mt-1 font-mono text-xs">{(forecast?.directionProbability ?? 0).toFixed(3)}</div>
              </div>
              <DataPoint label="Expected Range" value={`$${forecast?.expectedRange.toLocaleString()}`} />
              <DataPoint label="Horizon" value={forecast?.horizon || '-'} />
              <DataPoint label="Next High Dist" value={`+$${forecast?.nextHighDistance.toLocaleString()}`} />
              <DataPoint label="Next Low Dist" value={`-$${forecast?.nextLowDistance.toLocaleString()}`} />
            </div>
          </ModuleWrapper>

          {/* L2: NEAT */}
          <ModuleWrapper label="L2 : NEAT Agents" confidence={agentDecisions?.consensusScore}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Consensus Intent</span>
                <div className={`px-2 py-0.5 text-xs font-bold tracking-widest border font-mono
                  ${agentDecisions?.consensusIntent === 'BUY' ? 'border-emerald-500/30 text-emerald-500' : 
                    agentDecisions?.consensusIntent === 'SELL' ? 'border-rose-500/30 text-rose-500' : 
                    'border-border text-muted-foreground'}`}>
                  {agentDecisions?.consensusIntent || 'UNKNOWN'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {agentDecisions?.agents.map((agent) => (
                  <div key={agent.agentId} className="p-3 border border-border bg-card flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-muted-foreground">{agent.agentId.substring(0,8)}</span>
                      <span className={`text-[10px] font-bold ${agent.tradeIntent === 'BUY' ? 'text-emerald-500' : agent.tradeIntent === 'SELL' ? 'text-rose-500' : 'text-muted-foreground'}`}>{agent.tradeIntent}</span>
                    </div>
                    <div className="h-1 w-full bg-border">
                      <div className="h-full bg-primary" style={{ width: `${agent.fitness * 100}%` }} />
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
                <span className="text-xs font-mono">{aggregation?.regime}</span>
              </div>
              {aggregation?.weights && (
                <div className="flex flex-col gap-2 font-mono text-xs">
                  <WeightBar label="LSTM" value={aggregation.weights.lstmWeight} />
                  <WeightBar label="NEAT" value={aggregation.weights.neatWeight} />
                  <WeightBar label="Momentum" value={aggregation.weights.momentumWeight} />
                  <WeightBar label="Mean Rev" value={aggregation.weights.meanReversionWeight} />
                </div>
              )}
            </div>
          </ModuleWrapper>

          {/* L4: Reasoning */}
          <ModuleWrapper label="L4 : Semantic Reasoning" confidence={reasoning?.confidenceScore}>
            <div className="flex flex-col gap-4">
              <div className="text-sm leading-relaxed text-foreground/90">
                {reasoning?.reasoningSummary}
              </div>
              <div className="flex flex-wrap gap-2">
                {reasoning?.keyFactors.map((factor, i) => (
                  <span key={i} className="px-2 py-1 bg-card border border-border text-[10px] font-mono text-muted-foreground">
                    {factor}
                  </span>
                ))}
              </div>
              {reasoning?.riskWarnings && reasoning.riskWarnings.length > 0 && (
                <div className="p-3 border border-rose-500/20 bg-rose-500/5 flex flex-col gap-1">
                  <div className="text-[10px] font-mono text-rose-500/80 uppercase tracking-widest mb-1">Risk Warnings</div>
                  {reasoning.riskWarnings.map((w, i) => (
                    <div key={i} className="text-xs text-rose-500/70">• {w}</div>
                  ))}
                </div>
              )}
              {reasoning?.vetoSignal && (
                <div className="p-2 bg-rose-500 text-white text-xs font-bold text-center uppercase tracking-widest">
                  Veto Override Active: {reasoning.vetoReason}
                </div>
              )}
            </div>
          </ModuleWrapper>

          {/* L5: Final Decision */}
          <div className="flex-1 min-h-[200px] border-b border-border p-6 flex flex-col justify-center bg-card">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">L5 : Final Output</div>
            <div className="flex items-end justify-between mb-6">
              <div className={`text-6xl font-light tracking-tighter
                ${finalDecision?.action === 'BUY' ? 'text-emerald-500' : 
                  finalDecision?.action === 'SELL' ? 'text-rose-500' : 
                  finalDecision?.action === 'VETO' ? 'text-amber-500' : 
                  'text-foreground'}`}>
                {finalDecision?.action || 'HOLD'}
              </div>
              <div className="text-right pb-1">
                <div className="text-xs text-muted-foreground font-mono">CONFIDENCE</div>
                <div className="text-xl font-mono">{(finalDecision?.confidence ?? 0).toFixed(3)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
              <div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase">Pos Size</div>
                <div className="text-sm font-mono mt-1">{(finalDecision?.positionSize ?? 0) * 100}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase">Stop Loss</div>
                <div className="text-sm font-mono mt-1">${finalDecision?.stopLoss.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase">Take Profit</div>
                <div className="text-sm font-mono mt-1">${finalDecision?.takeProfit.toLocaleString()}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ModuleWrapper({ label, confidence, children }: { label: string, confidence?: number, children: React.ReactNode }) {
  return (
    <div className="border-b border-border p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        {confidence !== undefined && (
          <span className="opacity-50">CONF {(confidence).toFixed(2)}</span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function DataPoint({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

function WeightBar({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-[10px] text-muted-foreground truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-border">
        <div className="h-full bg-primary" style={{ width: `${value * 100}%` }} />
      </div>
      <span className="w-10 text-right text-[10px]">{value.toFixed(2)}</span>
    </div>
  );
}
