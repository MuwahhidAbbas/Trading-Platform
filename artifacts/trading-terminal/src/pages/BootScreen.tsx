import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

const BOOT_SEQUENCE = [
  "Initializing market feed...",
  "Loading prediction layer...",
  "Bootstrapping agents...",
  "Calibrating reasoning engine...",
  "System ready."
];

export default function BootScreen() {
  const [, setLocation] = useLocation();
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < BOOT_SEQUENCE.length) {
        setLines(prev => [...prev, BOOT_SEQUENCE[currentLine]]);
        currentLine++;
        setProgress((currentLine / BOOT_SEQUENCE.length) * 100);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setLocation('/landing');
        }, 800);
      }
    }, 700);

    return () => clearInterval(interval);
  }, [setLocation]);

  return (
    <div className="min-h-screen w-full bg-[#040405] flex flex-col items-center justify-center p-8 selection:bg-primary">
      <div className="max-w-md w-full flex flex-col items-center gap-12">
        
        <div className="flex flex-col items-center gap-2 animate-in fade-in duration-1000">
          <h1 className="text-4xl font-light tracking-[0.2em] text-white/90">NEXUS</h1>
          <div className="text-[10px] tracking-widest text-white/30 uppercase font-mono">v0.1.0-alpha</div>
        </div>

        <div className="w-full flex flex-col gap-6">
          <div className="h-[1px] w-full bg-white/5 relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-white/40 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex flex-col gap-2 min-h-[120px] justify-end">
            {lines.map((line, i) => (
              <div 
                key={i} 
                className="font-mono text-[11px] text-white/40 uppercase tracking-wider animate-in slide-in-from-bottom-2 fade-in duration-300"
              >
                {line}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
