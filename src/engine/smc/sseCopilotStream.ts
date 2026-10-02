/**
 * Quant Backtest Pro — Apex AI Copilot Architecture Specification v2.1
 * Tier 3 — SSE Copilot Stream Parser
 *
 * Parses Server-Sent Events from the AI Gateway `/v1/copilot/stream` endpoint
 * and dispatches discriminated chunks: reasoning, action, done, error.
 * Renders the Chain-of-Thought progressively and assembles the ActionPlan
 * JSON inside `<action_plan>` tags.
 *
 * Standard: RFC-003-TECH-v2.1
 * Author: Daedalus (CTO) & Vulcan (Senior SWE)
 */

import {
  ActionPlan,
  CoTStreamChunk,
  InstitutionalCheckTag
} from '../../types/smc';

export interface CopilotStreamMeta {
  readonly model: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly costUSD: number;
}

export interface CopilotStreamHandlers {
  onReasoning?: (delta: string) => void;
  onActionPlan?: (plan: ActionPlan) => void;
  onDone?: (meta: CopilotStreamMeta) => void;
  onError?: (err: Error) => void;
}

interface InternalBuffer {
  reasoning: string;
  action: string;
  meta: CopilotStreamMeta | null;
}

const EMPTY_META: CopilotStreamMeta = {
  model: '',
  promptTokens: 0,
  completionTokens: 0,
  costUSD: 0
};

/**
 * Parses a single SSE line and dispatches the appropriate handler.
 * Returns `true` when the stream is finished (done or error).
 */
export function parseCopilotStream(
  line: string,
  buffer: InternalBuffer,
  handlers: CopilotStreamHandlers
): boolean {
  if (!line.startsWith('data:')) return false;
  const payload = line.slice(5).trim();
  if (payload === '[DONE]') {
    // Attempt to parse the assembled action_plan now (best-effort).
    const plan = tryParseActionPlan(buffer.action);
    if (plan) handlers.onActionPlan?.(plan);
    handlers.onDone?.(buffer.meta ?? EMPTY_META);
    return true;
  }
  let chunk: CoTStreamChunk;
  try {
    chunk = JSON.parse(payload) as CoTStreamChunk;
  } catch {
    handlers.onError?.(new Error(`Malformed SSE payload: ${payload.slice(0, 80)}`));
    return true;
  }
  if (chunk.type === 'reasoning') {
    buffer.reasoning += chunk.delta;
    handlers.onReasoning?.(chunk.delta);
    return false;
  }
  if (chunk.type === 'action') {
    buffer.action += chunk.delta;
    return false;
  }
  if (chunk.type === 'done') {
    // The done payload may also include usage meta inline.
    const meta = (chunk as CoTStreamChunk & {
      usage?: { prompt?: number; completion?: number; cost_usd?: number; model?: string };
    }).usage;
    if (meta) {
      buffer.meta = {
        model: meta.model ?? '',
        promptTokens: meta.prompt ?? 0,
        completionTokens: meta.completion ?? 0,
        costUSD: meta.cost_usd ?? 0
      };
    }
    // Attempt to parse the assembled action_plan now.
    const plan = tryParseActionPlan(buffer.action);
    if (plan) handlers.onActionPlan?.(plan);
    handlers.onDone?.(buffer.meta ?? EMPTY_META);
    return true;
  }
  if (chunk.type === 'error') {
    handlers.onError?.(new Error(chunk.delta || 'Unknown LLM error'));
    return true;
  }
  return false;
}

/**
 * Best-effort parser for the `<action_plan>` JSON block.
 * Returns null if no valid JSON object can be extracted.
 */
export function tryParseActionPlan(rawText: string): ActionPlan | null {
  if (!rawText) return null;
  const stripped = rawText.replace(/<\/?action_plan>/g, '');
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Partial<ActionPlan>;
    return normalizeActionPlan(parsed);
  } catch {
    return null;
  }
}

/** Validate an ActionPlan against the institutional rule set. */
export function validateActionPlanShape(plan: ActionPlan | null): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!plan) {
    return { ok: false, errors: ['No plan parsed'] };
  }
  if (!['LONG', 'SHORT', 'NO_TRADE'].includes(plan.side)) {
    errors.push(`Invalid side: ${plan.side}`);
  }
  if (plan.side !== 'NO_TRADE') {
    if (typeof plan.entry !== 'number' || plan.entry <= 0) errors.push('Invalid entry');
    if (typeof plan.stopLoss !== 'number' || plan.stopLoss <= 0) errors.push('Invalid stopLoss');
    if (!Array.isArray(plan.takeProfit) || plan.takeProfit.length === 0) {
      errors.push('Missing takeProfit array');
    }
  }
  if (typeof plan.confidence !== 'number' || plan.confidence < 0 || plan.confidence > 1) {
    errors.push('Invalid confidence');
  }
  if (!Array.isArray(plan.institutionalChecks) || plan.institutionalChecks.length === 0) {
    errors.push('Missing institutionalChecks');
  }
  return { ok: errors.length === 0, errors };
}

function normalizeActionPlan(p: Partial<ActionPlan>): ActionPlan | null {
  if (!p) return null;
  if (!p.side || !['LONG', 'SHORT', 'NO_TRADE'].includes(p.side)) return null;
  const checks = Array.isArray(p.institutionalChecks)
    ? p.institutionalChecks.filter((c): c is InstitutionalCheckTag =>
        ['HTF_BIAS_ALIGNED', 'KEY_POI_TAP', 'LIQUIDITY_SWEEP_CONFIRMED', 'LTF_CHOCH_CONFIRMED'].includes(
          c as string
        )
      )
    : [];
  return {
    side: p.side,
    entry: typeof p.entry === 'number' ? p.entry : 0,
    stopLoss: typeof p.stopLoss === 'number' ? p.stopLoss : 0,
    takeProfit: Array.isArray(p.takeProfit) ? p.takeProfit.filter((n) => typeof n === 'number') : [],
    rrRatio: typeof p.rrRatio === 'number' ? p.rrRatio : 0,
    rationale: typeof p.rationale === 'string' ? p.rationale : '',
    institutionalChecks: checks,
    confidence: typeof p.confidence === 'number' ? p.confidence : 0,
    mtfVector: p.mtfVector
  };
}

/**
 * Wraps a fetch Response stream into a parsed `CoTStreamChunk` stream
 * (generator).
 */
export async function* consumeCopilotStream(
  response: Response,
  handlers: CopilotStreamHandlers = {}
): AsyncGenerator<CoTStreamChunk, void, void> {
  if (!response.body) {
    handlers.onError?.(new Error('Empty response body from AI Gateway'));
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const buffer: InternalBuffer = { reasoning: '', action: '', meta: null };
  let pending = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) {
        if (line.trim() === '') continue;
        const finished = parseCopilotStream(line, buffer, handlers);
        // Try to extract delta and yield as CoTStreamChunk
        const delta = extractDelta(line);
        if (delta) {
          yield delta;
        }
        if (finished) {
          return;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function extractDelta(line: string): CoTStreamChunk | null {
  if (!line.startsWith('data:')) return null;
  const payload = line.slice(5).trim();
  if (payload === '[DONE]') return null;
  try {
    return JSON.parse(payload) as CoTStreamChunk;
  } catch {
    return null;
  }
}

export class SseCopilotStream {
  private handlers: CopilotStreamHandlers;
  private buffer: InternalBuffer = { reasoning: '', action: '', meta: null };

  constructor(handlers: CopilotStreamHandlers = {}) {
    this.handlers = handlers;
  }

  /** Feed one line; returns true when stream should terminate. */
  push(line: string): boolean {
    return parseCopilotStream(line, this.buffer, this.handlers);
  }

  /** Returns the accumulated reasoning text. */
  reasoning(): string {
    return this.buffer.reasoning;
  }

  /** Returns the accumulated action-plan JSON (or partial). */
  action(): string {
    return this.buffer.action;
  }

  /** Returns the parsed ActionPlan if the stream is done. */
  plan(): ActionPlan | null {
    return tryParseActionPlan(this.buffer.action);
  }

  /** Returns the meta block, if a done event was emitted. */
  meta(): CopilotStreamMeta | null {
    return this.buffer.meta;
  }
}
