/**
 * Quant Backtest Pro — SMC Canvas Overlay
 * Bridges the SmcEngine primitives to a Lightweight Charts pane overlay canvas.
 * Renders OB / FVG / Sweep / R:R primitives with zero React re-renders on stream.
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation } from '../../i18n';
import type { OverlayPrimitive } from '../../types/smc';
import {
  SmcCanvasOverlayPainter,
  type CoordinateMapper,
} from '../../engine/smc/smcCanvasOverlayPainter';

export interface SmcCanvasOverlayProps {
  /** Forwarded Lightweight Chart reference for coordinate mapping. */
  chartRef: React.MutableRefObject<unknown>;
  /** Visible primitives stream from engine. */
  primitives: readonly OverlayPrimitive[];
  /** Height of the overlay pane. Accepts CSS length strings (e.g. "100%") or pixel numbers. */
  height?: number | string;
  /** Optional toggle overlay (e.g. hide all). */
  visible?: boolean;
  /** Optional toggles for each primitive kind. */
  show?: {
    ob?: boolean;
    fvg?: boolean;
    sweep?: boolean;
    rr?: boolean;
  };
}

export const SmcCanvasOverlay: React.FC<SmcCanvasOverlayProps> = ({ chartRef, primitives, height = 200, visible = true, show }) => {
  const language = useBacktestStore(s => s.language) as 'vi' | 'en' | 'ja' | 'zh';
  const t = getTranslation(language);
  const painterRef = useRef<SmcCanvasOverlayPainter>(new SmcCanvasOverlayPainter());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const flags = useMemo(() => ({ ob: true, fvg: true, sweep: true, rr: true, ...(show ?? {}) }), [show]);

  const visiblePrimitives = useMemo(() => {
    return primitives.filter(p => {
      if (p.kind === 'ORDER_BLOCK_BULLISH' || p.kind === 'ORDER_BLOCK_BEARISH') return flags.ob;
      if (p.kind === 'FVG_BULLISH' || p.kind === 'FVG_BEARISH') return flags.fvg;
      if (p.kind === 'SWEEP_BSL' || p.kind === 'SWEEP_SSL') return flags.sweep;
      if (p.kind === 'RR_TARGET') return flags.rr;
      return true;
    });
  }, [primitives, flags]);

  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const chart = chartRef.current as { timeScale?: () => { timeToCoordinate?: (t: number) => number | null }; priceScale?: (s: string) => { priceToCoordinate?: (p: number) => number | null } | undefined } | null;
    if (!canvas || !chart) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr) canvas.width = w * dpr;
    if (canvas.height !== h * dpr) canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!visible) return;

    const mapper: CoordinateMapper = {
      timeCoordinate(time: number): number | null {
        const ts = chart?.timeScale?.() ?? null;
        return ts?.timeToCoordinate ? ts.timeToCoordinate(time) : null;
      },
      priceCoordinate(price: number): number | null {
        const ps = chart?.priceScale?.('right') ?? null;
        return ps?.priceToCoordinate ? ps.priceToCoordinate(price) : null;
      },
    };
    painterRef.current.paintOverlay(ctx, mapper, visiblePrimitives);
  }, [chartRef, visiblePrimitives, visible]);

  useEffect(() => {
    repaint();
  }, [repaint]);

  useEffect(() => {
    const handle = () => repaint();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handle);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handle);
      }
    };
  }, [repaint]);

  return (
    <div
      ref={containerRef}
      className="smc-canvas-overlay"
      style={typeof height === 'number' ? { height: `${height}px` } : { height }}
      aria-label={t.apexCopilotOverlayToggle}
    >
      <canvas ref={canvasRef} className="smc-overlay-canvas" />
    </div>
  );
};

export default SmcCanvasOverlay;
