import { useEffect, useRef, useCallback } from 'react';

interface Props {
  isTerminalHovered?: boolean;
  className?: string;
}

interface Node {
  ringIndex: number;
  angle: number;
  baseRadius: number;
  radius: number;
  size: number;
  speed: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
}

interface Ring {
  baseRadius: number;
  radius: number;
  speed: number;
  direction: 1 | -1;
  nodeCount: number;
  opacity: number;
}

const RINGS: Ring[] = [
  { baseRadius: 52,  radius: 52,  speed: 0.00018, direction: 1,  nodeCount: 3, opacity: 0.55 },
  { baseRadius: 100, radius: 100, speed: 0.00011, direction: -1, nodeCount: 5, opacity: 0.38 },
  { baseRadius: 155, radius: 155, speed: 0.00007, direction: 1,  nodeCount: 7, opacity: 0.24 },
  { baseRadius: 210, radius: 210, speed: 0.00004, direction: -1, nodeCount: 4, opacity: 0.14 },
];

const CONNECTION_THRESHOLD = 90;
const MOUSE_INFLUENCE_RADIUS = 180;
const MOUSE_REPEL_STRENGTH = 22;
const INERTIA = 0.88;
const BREATH_AMPLITUDE = 0.018;
const BREATH_SPEED = 0.0006;
const CONVERGE_SPEED = 0.07;
const CONVERGE_TARGET = 0.55;
const EXPAND_SPEED = 0.04;

export default function IntelligenceCore({ isTerminalHovered = false, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const scrollRef = useRef(0);
  const lastTimeRef = useRef(0);
  const breathPhaseRef = useRef(0);
  const convergenceRef = useRef(1.0);
  const isHoveredRef = useRef(false);

  // Build nodes once
  const buildNodes = useCallback(() => {
    const nodes: Node[] = [];
    RINGS.forEach((ring, ri) => {
      for (let i = 0; i < ring.nodeCount; i++) {
        const angle = (i / ring.nodeCount) * Math.PI * 2 + ri * 0.7;
        nodes.push({
          ringIndex: ri,
          angle,
          baseRadius: ring.baseRadius,
          radius: ring.baseRadius,
          size: ri === 0 ? 3.5 : ri === 1 ? 2.8 : ri === 2 ? 2.2 : 1.8,
          speed: ring.speed * ring.direction,
          x: 0, y: 0,
          vx: 0, vy: 0,
          opacity: ring.opacity,
        });
      }
    });
    return nodes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    nodesRef.current = buildNodes();

    // Resize handler
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Mouse handler — local to canvas
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    // Scroll handler
    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Draw
    const draw = (time: number) => {
      rafRef.current = requestAnimationFrame(draw);

      const dt = Math.min(time - lastTimeRef.current, 33); // cap at 33ms (~30fps floor)
      lastTimeRef.current = time;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const cx = w / 2;
      const cy = h / 2;

      // Convergence
      const targetConv = isHoveredRef.current ? CONVERGE_TARGET : 1.0;
      const convSpeed = isHoveredRef.current ? CONVERGE_SPEED : EXPAND_SPEED;
      convergenceRef.current += (targetConv - convergenceRef.current) * convSpeed;
      const conv = convergenceRef.current;

      // Breathing
      breathPhaseRef.current += BREATH_SPEED * dt;
      const breath = 1 + Math.sin(breathPhaseRef.current) * BREATH_AMPLITUDE;

      // Scroll tilt
      const scrollTilt = Math.min(scrollRef.current * 0.0003, 0.18);
      const tiltX = Math.sin(scrollTilt) * 18;
      const tiltY = -scrollTilt * 12;

      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      const mouse = mouseRef.current;

      // Update nodes
      for (const node of nodes) {
        node.angle += node.speed * dt;
        const ring = RINGS[node.ringIndex];

        const targetRadius = ring.baseRadius * conv * breath;
        node.radius += (targetRadius - node.radius) * 0.06;

        // Ideal position
        const idealX = Math.cos(node.angle) * node.radius + tiltX * (node.ringIndex / RINGS.length);
        const idealY = Math.sin(node.angle) * node.radius + tiltY * (node.ringIndex / RINGS.length);

        // Mouse influence
        const dx = idealX - mouse.x;
        const dy = idealY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let pushX = 0, pushY = 0;
        if (dist < MOUSE_INFLUENCE_RADIUS && dist > 0) {
          const strength = (1 - dist / MOUSE_INFLUENCE_RADIUS) * MOUSE_REPEL_STRENGTH;
          pushX = (dx / dist) * strength;
          pushY = (dy / dist) * strength;
        }

        // Apply inertia
        node.vx = node.vx * INERTIA + (idealX + pushX - node.x) * (1 - INERTIA);
        node.vy = node.vy * INERTIA + (idealY + pushY - node.y) * (1 - INERTIA);
        node.x += node.vx * 0.12;
        node.y += node.vy * 0.12;
      }

      // Draw connecting lines between close nodes
      ctx.save();
      ctx.translate(cx, cy);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_THRESHOLD) {
            const alpha = (1 - dist / CONNECTION_THRESHOLD) * 0.18 * Math.min(a.opacity, b.opacity);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(200, 200, 200, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
        // Connect each node to center with faint line
        const a = nodes[i];
        const distToCenter = Math.sqrt(a.x * a.x + a.y * a.y);
        if (a.ringIndex <= 1) {
          const alpha = (1 - distToCenter / 220) * 0.09 * a.opacity;
          if (alpha > 0) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(a.x, a.y);
            ctx.strokeStyle = `rgba(200, 200, 200, ${alpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }

      // Draw ring paths (faint arcs)
      RINGS.forEach((ring, ri) => {
        const r = ring.baseRadius * conv * breath + (ri === 0 ? tiltX * 0.1 : 0);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 180, 180, ${ring.opacity * 0.08})`;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw nodes
      for (const node of nodes) {
        const alpha = node.opacity;
        // Outer soft halo
        const halo = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 3.5);
        halo.addColorStop(0, `rgba(220, 220, 220, ${alpha * 0.12})`);
        halo.addColorStop(1, `rgba(220, 220, 220, 0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210, 210, 210, ${alpha})`;
        ctx.fill();
      }

      // Center core
      const coreBreath = 1 + Math.sin(breathPhaseRef.current * 1.3) * 0.025;
      const coreSize = 5 * coreBreath * conv;

      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize * 4);
      coreGrad.addColorStop(0, `rgba(230, 230, 230, 0.6)`);
      coreGrad.addColorStop(0.4, `rgba(200, 200, 200, 0.15)`);
      coreGrad.addColorStop(1, `rgba(200, 200, 200, 0)`);
      ctx.beginPath();
      ctx.arc(0, 0, coreSize * 4, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240, 240, 240, 0.85)`;
      ctx.fill();

      ctx.restore();
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, [buildNodes]);

  // Sync hover state to ref (no re-render needed)
  useEffect(() => {
    isHoveredRef.current = isTerminalHovered;
  }, [isTerminalHovered]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  );
}
