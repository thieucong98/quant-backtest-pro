/**
 * RFC-003-TECH-v2.1 — Tier 3 SSE Copilot Stream Parser
 * Validates Chain-of-Thought chunked streaming, action_plan extraction
 * and validation gating against the institutional rule set.
 */

import {
  parseCopilotStream,
  tryParseActionPlan,
  validateActionPlanShape,
  type CopilotStreamMeta,
} from '../../src/engine/smc/sseCopilotStream';
import {
  ActionPlanValidator,
  type ValidationResult,
} from '../../src/engine/smc/actionPlanValidator';
import type {
  ActionPlan,
  CoTStreamChunk,
  MTFSemanticVector,
} from '../../src/types/smc';

interface Buffer {
  reasoning: string;
  action: string;
  meta: CopilotStreamMeta | null;
}

function emptyBuffer(): Buffer {
  return { reasoning: '', action: '', meta: null };
}

function assert(cond: boolean, msg: string, details?: unknown): void {
  if (!cond) {
    throw new Error(`[FAIL] ${msg}` + (details !== undefined ? ` :: ${JSON.stringify(details)}` : ''));
  }
  console.log(`  ✅ ${msg}`);
}

function makeVector(): MTFSemanticVector {
  return {
    bias: { h4: 'BULLISH', d1: 'BULLISH' },
    location: 'DISCOUNT',
    activeOB: { direction: 'BULLISH', state: 'UNMITIGATED', fillRatioBucket: 0 },
    activeFVG: { direction: 'BULLISH', state: 'OPEN', fillRatioBucket: 0 },
    recentSweep: { kind: 'BSL', barsAgo: 3 },
    recentCHoCH: { direction: 'BULLISH', barsAgo: 4 },
    volatility: { atrBucket: 'NORMAL', session: 'LONDON' },
  };
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Testing SSE Copilot stream parser + Chain-of-Thought...');

  // 1) parseCopilotStream dispatches reasoning deltas.
  const buf1 = emptyBuffer();
  const chunks1: string[] = [];
  parseCopilotStream(
    'data:{"type":"reasoning","delta":"Reading HTF bias...","timestamp":1}',
    buf1,
    { onReasoning: (d) => chunks1.push(d) }
  );
  assert(buf1.reasoning === 'Reading HTF bias...', 'Reasoning delta appended to buffer');
  assert(chunks1[0] === 'Reading HTF bias...', 'onReasoning callback fired');

  // 2) parseCopilotStream accumulates action deltas and parses action_plan JSON.
  const buf2 = emptyBuffer();
  let parsed: ActionPlan | null = null;
  parseCopilotStream('data:{"type":"action","delta":"<action_plan>{\\"side\\":\\"LONG\\",\\"entry\\":1.1","timestamp":1}', buf2, {});
  parseCopilotStream('data:{"type":"action","delta":",\\"stopLoss\\":1.05,\\"takeProfit\\":[1.2,1.25],\\"rrRatio\\":5,\\"confidence\\":0.7,\\"rationale\\":\\"test\\",\\"institutionalChecks\\":[\\"HTF_BIAS_ALIGNED\\",\\"KEY_POI_TAP\\"]}","timestamp":2}', buf2, {});
  parseCopilotStream('data:[DONE]', buf2, { onActionPlan: (p) => (parsed = p), onDone: () => undefined });
  assert(parsed !== null, 'SSE done handler parses assembled ActionPlan');
  if (parsed) {
    assert(parsed.side === 'LONG', 'Parsed ActionPlan side is LONG');
    assert(parsed.takeProfit.length === 2, 'Parsed ActionPlan take-profit count is preserved');
  }

  // 3) tryParseActionPlan returns null for invalid input.
  assert(tryParseActionPlan('not a plan') === null, 'tryParseActionPlan returns null for invalid');
  assert(tryParseActionPlan('') === null, 'tryParseActionPlan returns null for empty input');

  // 4) validateActionPlanShape catches missing fields.
  const bad = validateActionPlanShape({
    side: 'INVALID',
    entry: 0,
    stopLoss: 0,
    takeProfit: [],
    rrRatio: 0,
    rationale: '',
    institutionalChecks: [],
    confidence: 2,
  });
  assert(!bad.ok, 'validateActionPlanShape rejects invalid side and confidence');

  // 5) ActionPlanValidator rejects plans that violate institutional location rule.
  const validator = new ActionPlanValidator({ minRrRatio: 1.5, minConfidence: 0.55 });
  const plan: ActionPlan = {
    side: 'LONG',
    entry: 1.1,
    stopLoss: 1.05,
    takeProfit: [1.2, 1.25],
    rrRatio: 5,
    rationale: 'long setup aligned with HTF',
    institutionalChecks: ['HTF_BIAS_ALIGNED', 'KEY_POI_TAP', 'LIQUIDITY_SWEEP_CONFIRMED', 'LTF_CHOCH_CONFIRMED'],
    confidence: 0.7,
  };
  const okResult: ValidationResult = validator.validate(plan, makeVector());
  assert(okResult.ok, 'Plan aligned with HTF + DISCOUNT location passes validation', { okResult });

  // 6) Validator rejects LONG signal at PREMIUM (against discount rule).
  const premium = makeVector();
  premium.location = 'PREMIUM';
  const badResult = validator.validate(plan, premium);
  assert(!badResult.ok, 'Plan at PREMIUM location is rejected', { errors: badResult.errors });

  // 7) NO_TRADE plan always passes.
  const noTrade: ActionPlan = {
    side: 'NO_TRADE',
    entry: 0,
    stopLoss: 0,
    takeProfit: [],
    rrRatio: 0,
    rationale: 'No clean setup',
    institutionalChecks: [],
    confidence: 0.0,
  };
  const ntResult = validator.validate(noTrade, makeVector());
  assert(ntResult.ok, 'NO_TRADE plan passes institutional validator');

  // 8) Chunk array validation.
  const reasoningChunk: CoTStreamChunk = { type: 'reasoning', delta: 'a', timestamp: 1 };
  assert(reasoningChunk.type === 'reasoning', 'CoTStreamChunk reasoning type discriminator');

  console.log('\n🎉 AI Streaming tests passed.\n');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
