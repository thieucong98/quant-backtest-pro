/**
 * Quant Backtest Pro — Apex AI Copilot Architecture Specification v2.1
 * Canvas Overlay Painter — Direct Lightweight Charts projection
 *
 * Renders Order Block / FVG / Liquidity Sweep / R:R target primitives
 * directly on the chart canvas, bypassing React entirely to guarantee
 * 60 FPS interaction even during streaming.
 *
 * Standard: RFC-003-TECH-v2.1
 * Author: Daedalus (CTO) & Vulcan (Senior SWE)
 */

import { OverlayPrimitive, OverlayPrimitiveKind } from '../../types/smc';

export interface CoordinateMapper {
  /** Convert a unix-seconds timestamp to an X coordinate on the canvas. */
  timeCoordinate(time: number): number | null;
  /** Convert a price to a Y coordinate on the canvas. */
  priceCoordinate(price: number): number | null;
}

export interface OverlayProjectionContext {
  /** Convert a unix-seconds timestamp to an X coordinate on the canvas. */
  timeToX: (time: number) => number;
  /** Convert a price to a Y coordinate on the canvas. */
  priceToY: (price: number) => number;
  /** Canvas width in pixels. */
  width: number;
  /** Canvas height in pixels. */
  height: number;
  /** dpr/devicePixelRatio (for HiDPI). */
  dpr: number;
}

export class SmcCanvasOverlayPainter {
  private ctx: CanvasRenderingContext2D | null = null;
  private primitives: OverlayPrimitive[] = [];
  private visibleFlags: Record<OverlayPrimitiveKind, boolean> = {
    ORDER_BLOCK_BULLISH: true,
    ORDER_BLOCK_BEARISH: true,
    FVG_BULLISH: true,
    FVG_BEARISH: true,
    SWEEP_BSL: true,
    SWEEP_SSL: true,
    RR_TARGET: true
  };

  constructor(canvasCtx?: CanvasRenderingContext2D) {
    this.ctx = canvasCtx ?? null;
  }

  /** Toggle visibility of an overlay kind. */
  setKindVisible(kind: OverlayPrimitiveKind, visible: boolean): void {
    this.visibleFlags[kind] = visible;
  }

  /** Replace the entire primitive list (called per snapshot). */
  setPrimitives(prims: readonly OverlayPrimitive[]): void {
    this.primitives = prims.slice();
  }

  /** Append a single primitive (e.g. as LLM streams a new zone). */
  append(p: OverlayPrimitive): void {
    this.primitives.push(p);
  }

  /** Drop primitives older than `cutoff` ms. */
  prune(cutoffMs: number): void {
    // For OverlayPrimitive the id encodes origin time; we use an id-based
    // approach: keep last 256.
    if (this.primitives.length > 256) {
      this.primitives = this.primitives.slice(-256);
    }
    void cutoffMs;
  }

  /** Render all primitives using the supplied canvas context. */
  paintOverlay(ctx: CanvasRenderingContext2D, mapper: CoordinateMapper, primitives: readonly OverlayPrimitive[]): void {
    this.ctx = ctx;
    this.setPrimitives(primitives);
    this.paint({
      timeToX: (time) => mapper.timeCoordinate(time) ?? 0,
      priceToY: (price) => mapper.priceCoordinate(price) ?? 0,
      width: ctx.canvas.width,
      height: ctx.canvas.height,
      dpr: 1,
    });
  }

  /** Render all primitives onto the supplied context. */
  paint(context: OverlayProjectionContext): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    for (const p of this.primitives) {
      if (!this.visibleFlags[p.kind]) continue;
      this.drawPrimitive(p, context);
    }
  }

  // -------------------------------------------------------------------------
  // Internal — primitive drawing
  // -------------------------------------------------------------------------

  private drawPrimitive(
    p: OverlayPrimitive,
    context: OverlayProjectionContext
  ): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const x1 = context.timeToX(p.timeStart);
    const x2 = context.timeToX(p.timeEnd);
    const y1 = context.priceToY(p.priceHigh);
    const y2 = context.priceToY(p.priceLow);
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.max(1, Math.abs(x2 - x1));
    const height = Math.max(1, Math.abs(y2 - y1));

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1;

    if (p.kind === 'ORDER_BLOCK_BULLISH' || p.kind === 'ORDER_BLOCK_BEARISH') {
      ctx.fillRect(left, top, width, height);
      ctx.globalAlpha = Math.min(1, p.alpha + 0.2);
      ctx.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1);
      this.drawLabel(p, left + 6, top + 12);
    } else if (p.kind === 'FVG_BULLISH' || p.kind === 'FVG_BEARISH') {
      // FVG: thin horizontal band
      ctx.fillRect(left, top, width, height);
      this.drawLabel(p, left + 6, top + 10);
    } else if (p.kind === 'SWEEP_BSL' || p.kind === 'SWEEP_SSL') {
      // Sweep: dotted horizontal line at the pool level + arrow
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(left, y1);
      ctx.lineTo(left + width, y1);
      ctx.stroke();
      ctx.setLineDash([]);
      this.drawLabel(p, left + 6, y1 - 4);
    } else if (p.kind === 'RR_TARGET') {
      // R:R target: dashed line + tick marker
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(left, y1);
      ctx.lineTo(left + width, y1);
      ctx.stroke();
      ctx.setLineDash([]);
      this.drawLabel(p, left + 6, y1 - 4);
    }

    ctx.restore();
  }

  private drawLabel(p: OverlayPrimitive, x: number, y: number): void {
    if (!p.label || !this.ctx) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p.label, x, y);
    ctx.restore();
  }
}

/** Functional helper to paint onto an arbitrary canvas context. */
export function paintOverlayToCanvas(
  primitives: readonly OverlayPrimitive[],
  ctx: CanvasRenderingContext2D,
  context: OverlayProjectionContext
): void {
  const painter = new SmcCanvasOverlayPainter(ctx);
  painter.setPrimitives(primitives);
  painter.paint(context);
}
