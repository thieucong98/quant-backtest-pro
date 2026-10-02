/**
 * Quant Backtest Pro — Apex AI Copilot
 * SMC (Smart Money Concepts) Perception Engine — Public Surface
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 * Author: Daedalus (CTO) & Vulcan (Senior SWE)
 */

export { SmcEngine, createSmcEngine } from './smcEngine';
export { ConfluenceGate, createConfluenceGate } from './confluenceGate';
export { MtfPromptRenderer, renderMtfPrompt } from './mtfPromptRenderer';
export { MTF_TOKEN_BUDGET, MTF_PROMPT_TARGET } from '../../types/smc';
export { SseCopilotStream, parseCopilotStream } from './sseCopilotStream';
export {
  ActionPlanValidator,
  validateActionPlan,
  assertInstitutionalRule
} from './actionPlanValidator';
export { SmcCanvasOverlayPainter, paintOverlayToCanvas } from './smcCanvasOverlayPainter';

export type { SmcEngineConfig, SmcEngineStats } from './smcEngine';
export type { ConfluenceGateConfig, GateDecision } from './confluenceGate';
export type { CopilotStreamHandlers, CopilotStreamMeta } from './sseCopilotStream';
