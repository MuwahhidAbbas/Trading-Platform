import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Activity, Network, Layers, BrainCircuit, PlaySquare } from 'lucide-react';
import IntelligenceCore from '../components/IntelligenceCore';

export default function Landing() {
  const [isTerminalHovered, setIsTerminalHovered] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background text-foreground selection:bg-primary/30">
      <div className="max-w-5xl mx-auto px-6 py-24 flex flex-col gap-24">

        {/* Hero — position:relative so the absolutely placed core stays contained */}
        <div
          className="animate-in fade-in slide-in-from-bottom-4 duration-1000"
          style={{ position: 'relative', overflow: 'hidden', minHeight: '420px' }}
        >
          {/* Intelligence Core — pure atmospheric background, never affects layout */}
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '600px',
              height: '500px',
              maxWidth: '100vw',
              zIndex: 0,
              pointerEvents: 'none',
              opacity: 0.6,
            }}
          >
            <IntelligenceCore isTerminalHovered={isTerminalHovered} className="w-full h-full" />
          </div>

          {/* Hero text — sits in front, owns its own space, never moved by core */}
          <div style={{ position: 'relative', zIndex: 2 }} className="flex flex-col gap-8 max-w-3xl pt-48">
            <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground tracking-widest uppercase">
              <div className="w-2 h-2 rounded-full bg-primary/80" />
              Internal Prototype
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1] text-foreground/90">
              Multi-layered intelligence for quantitative market reasoning.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl font-light">
              NEXUS is an experimental architecture that stacks predictive modeling, multi-agent reinforcement learning, and LLM-based reasoning into a single cohesive decision engine. Built for deep market analysis, not for trading UI flash.
            </p>
            <div className="pt-4">
              <Link
                href="/terminal"
                className="inline-flex items-center gap-3 bg-white text-black px-6 py-3 text-sm font-medium hover:bg-white/90 transition-colors"
                onMouseEnter={() => setIsTerminalHovered(true)}
                onMouseLeave={() => setIsTerminalHovered(false)}
              >
                Enter Terminal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="w-full h-[1px] bg-border" />

        {/* Architecture */}
        <div className="flex flex-col gap-12">
          <h2 className="text-xl font-medium tracking-tight">System Architecture</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-border">
            {[
              {
                icon: Activity,
                name: "Layer 1: LSTM",
                desc: "Deep sequential forecasting. Processes raw market tick data to identify short-term statistical price movements."
              },
              {
                icon: Network,
                name: "Layer 2: NEAT",
                desc: "NeuroEvolution of Augmenting Topologies. A competitive roster of agents that evolve trading policies based on varied risk profiles."
              },
              {
                icon: Layers,
                name: "Layer 3: Aggregation",
                desc: "Dynamic weight adjustment based on current market regimes. Rewards models that perform well in current volatility conditions."
              },
              {
                icon: BrainCircuit,
                name: "Layer 4: Reasoning",
                desc: "Semantic context evaluation. Large language models interpret the numerical outputs and evaluate against macroeconomic risk logic."
              },
              {
                icon: PlaySquare,
                name: "Layer 5: Decision",
                desc: "The final execution layer. Synthesizes inputs into concrete sizing, stops, and risk/reward targeting."
              }
            ].map((layer, i) => (
              <div key={i} className="bg-background flex flex-col p-6 gap-6 relative group">
                <div className="w-10 h-10 border border-border flex items-center justify-center bg-card">
                  <layer.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold">{layer.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{layer.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-12 flex justify-between items-center text-xs text-muted-foreground font-mono uppercase tracking-widest border-t border-border">
          <span>NEXUS Research</span>
          <span>Confidential</span>
        </div>

      </div>
    </div>
  );
}
