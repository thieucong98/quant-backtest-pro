/**
 * Quant Backtest Pro — Tier 2 MTF Semantic Vector Renderer
 * Encodes a structured MTFSemanticVector into a dense, deterministic token preamble.
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 * Output target: 220 tokens max (MTF_TOKEN_BUDGET).
 */

import type {
  MTFSemanticVector,
  BiasTag,
  PremiumDiscountLocation,
  OBDirection,
  OBState,
  OBFillBucket,
  FVGOriginKind,
  FVGState,
  SweepKind,
  StructureDirection,
  VolatilityBucket,
  TradingSession,
} from '../../types/smc';

export const MTF_TOKEN_BUDGET = 220;
export const MTF_PROMPT_TARGET = 218;

// Token-id vocabularies (deterministic & ordered)
const BIAS_VOCAB: Record<BiasTag, string> = {
  BULLISH: 'BIAS_BULL',
  BEARISH: 'BIAS_BEAR',
  NEUTRAL: 'BIAS_FLAT',
};
const LOCATION_VOCAB: Record<PremiumDiscountLocation, string> = {
  PREMIUM: 'LOC_PREM',
  DISCOUNT: 'LOC_DISC',
  EQUILIBRIUM: 'LOC_EQ',
};
const DIR_VOCAB: Record<OBDirection | FVGOriginKind, string> = {
  BULLISH: 'DIR_UP',
  BEARISH: 'DIR_DN',
};
const OB_STATE_VOCAB: Record<OBState, string> = {
  UNMITIGATED: 'OB_FRESH',
  MITIGATED: 'OB_HIT',
  PARTIAL: 'OB_TAP',
  FULLY_MITIGATED: 'OB_FULL',
  VIOLATED: 'OB_BUST',
  BREAKER: 'OB_BRK',
};
const FVG_STATE_VOCAB: Record<FVGState, string> = {
  OPEN: 'FVG_OPEN',
  PARTIAL: 'FVG_TAP',
  FILLED: 'FVG_DONE',
  INVERTED_IFVG: 'FVG_INV',
};
const FILL_VOCAB: Record<OBFillBucket, string> = {
  0: 'F0',
  25: 'F25',
  50: 'F50',
  75: 'F75',
  100: 'F100',
};
const SWEEP_VOCAB: Record<SweepKind, string> = {
  BSL: 'SWP_BSL',
  SSL: 'SWP_SSL',
  NONE: 'SWP_NONE',
};
const STRUCT_VOCAB: Record<StructureDirection, string> = {
  BULLISH: 'STR_UP',
  BEARISH: 'STR_DN',
  NONE: 'STR_NONE',
};
const VOL_VOCAB: Record<VolatilityBucket, string> = {
  LOW: 'VOL_LO',
  NORMAL: 'VOL_NM',
  HIGH: 'VOL_HI',
  EXTREME: 'VOL_XT',
};
const SESSION_VOCAB: Record<TradingSession, string> = {
  ASIA: 'SES_ASIA',
  LONDON: 'SES_LDN',
  NY: 'SES_NY',
  OVERLAP: 'SES_OVR',
};

/**
 * Renders a MTFSemanticVector into a deterministic comma-separated token string.
 * The output stays within MTF_TOKEN_BUDGET by using fixed-length token-ids.
 */
export function renderMtfPrompt(v: MTFSemanticVector): string {
  const tokens: string[] = [];
  tokens.push(BIAS_VOCAB[v.bias.h4]);
  tokens.push(BIAS_VOCAB[v.bias.d1]);
  tokens.push(LOCATION_VOCAB[v.location]);
  tokens.push(DIR_VOCAB[v.activeOB.direction]);
  tokens.push(OB_STATE_VOCAB[v.activeOB.state]);
  tokens.push(FILL_VOCAB[v.activeOB.fillRatioBucket]);
  tokens.push(DIR_VOCAB[v.activeFVG.direction]);
  tokens.push(FVG_STATE_VOCAB[v.activeFVG.state]);
  tokens.push(FILL_VOCAB[v.activeFVG.fillRatioBucket]);
  tokens.push(SWEEP_VOCAB[v.recentSweep.kind]);
  tokens.push(`BARS_${Math.min(v.recentSweep.barsAgo, 99)}`);
  tokens.push(STRUCT_VOCAB[v.recentCHoCH.direction]);
  tokens.push(`BARS_${Math.min(v.recentCHoCH.barsAgo, 99)}`);
  tokens.push(VOL_VOCAB[v.volatility.atrBucket]);
  tokens.push(SESSION_VOCAB[v.volatility.session]);

  // Padding to MTF_TOKEN_BUDGET via deterministic context envelope
  const base = tokens.join(' ');
  const wrapped = `[MTF] ${base} [END]`;
  if (wrapped.split(/\s+/).length <= MTF_TOKEN_BUDGET) {
    return wrapped;
  }
  // truncate trailing tokens until under budget
  const parts = wrapped.split(/\s+/);
  return parts.slice(0, MTF_TOKEN_BUDGET).join(' ');
}

export class MtfPromptRenderer {
  render(v: MTFSemanticVector): string {
    return renderMtfPrompt(v);
  }
  budget(): number {
    return MTF_TOKEN_BUDGET;
  }
}
