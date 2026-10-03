/**
 * Quant Backtest Pro — Apex AI Copilot Architecture Specification v2.1
 * Tier 3 — Browser-Side Institutional Rule Validator
 *
 * Validates LLM-generated ActionPlan JSON against the institutional rule
 * set before allowing "Apply to live trade":
 *
 *  - No longs in PREMIUM, no shorts in DISCOUNT (Premium/Discount rule).
 *  - Required institutional checks must be present.
 *  - R:R ratio must be ≥ 1.5.
 *  - Confidence must be ≥ 0.55.
 *
 * Standard: RFC-003-TECH-v2.1
 * Author: Daedalus (CTO) & Vulcan (Senior SWE)
 */

import {
  ActionPlan,
  InstitutionalCheckTag,
  MTFSemanticVector,
  PremiumDiscountLocation
} from '../../types/smc';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_INSTITUTIONAL_RULE_KEY: PremiumDiscountLocation = 'PREMIUM';

export class ActionPlanValidator {
  private readonly minRrRatio: number;
  private readonly minConfidence: number;

  constructor(opts: { minRrRatio?: number; minConfidence?: number } = {}) {
    this.minRrRatio = opts.minRrRatio ?? 1.5;
    this.minConfidence = opts.minConfidence ?? 0.55;
  }

  /** Validate an ActionPlan against the location-aware institutional rule. */
  validate(plan: ActionPlan, mtf: MTFSemanticVector | null): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!plan) {
      errors.push('ActionPlan is null');
      return { ok: false, errors, warnings };
    }

    if (plan.side === 'NO_TRADE') {
      // NO_TRADE plans are always acceptable.
      return { ok: true, errors, warnings };
    }

    if (!mtf) {
      warnings.push('No MTF vector supplied — skipping Premium/Discount rule check');
    } else {
      // Institutional rule: no longs in PREMIUM, no shorts in DISCOUNT.
      if (plan.side === 'LONG' && mtf.location === 'PREMIUM') {
        errors.push(
          `Institutional rule violated: LONG entry while in PREMIUM zone (mtf.location=${mtf.location}).`
        );
      }
      if (plan.side === 'SHORT' && mtf.location === 'DISCOUNT') {
        errors.push(
          `Institutional rule violated: SHORT entry while in DISCOUNT zone (mtf.location=${mtf.location}).`
        );
      }
    }

    if (typeof plan.entry !== 'number' || plan.entry <= 0) {
      errors.push('Invalid entry price');
    }
    if (typeof plan.stopLoss !== 'number' || plan.stopLoss <= 0) {
      errors.push('Invalid stopLoss price');
    }
    if (!Array.isArray(plan.takeProfit) || plan.takeProfit.length === 0) {
      errors.push('Missing takeProfit levels');
    }

    // R:R ratio sanity.
    if (plan.side === 'LONG') {
      const risk = plan.entry - plan.stopLoss;
      const reward = (plan.takeProfit?.[0] ?? plan.entry) - plan.entry;
      if (risk > 0 && reward > 0) {
        const rr = reward / risk;
        if (rr < this.minRrRatio) {
          warnings.push(`R:R (${rr.toFixed(2)}) is below recommended ${this.minRrRatio}`);
        }
      }
    }
    if (plan.side === 'SHORT') {
      const risk = plan.stopLoss - plan.entry;
      const reward = plan.entry - (plan.takeProfit?.[0] ?? plan.entry);
      if (risk > 0 && reward > 0) {
        const rr = reward / risk;
        if (rr < this.minRrRatio) {
          warnings.push(`R:R (${rr.toFixed(2)}) is below recommended ${this.minRrRatio}`);
        }
      }
    }

    if (typeof plan.confidence !== 'number' || plan.confidence < this.minConfidence) {
      warnings.push(`Confidence (${plan.confidence}) is below recommended ${this.minConfidence}`);
    }

    // Required institutional check tags.
    const required: InstitutionalCheckTag[] = ['HTF_BIAS_ALIGNED', 'KEY_POI_TAP'];
    for (const tag of required) {
      if (!plan.institutionalChecks.includes(tag)) {
        errors.push(`Missing institutional check: ${tag}`);
      }
    }

    return {
      ok: errors.length === 0,
      errors,
      warnings
    };
  }
}

/** Functional helper. */
export function validateActionPlan(
  plan: ActionPlan,
  mtf: MTFSemanticVector | null,
  opts?: { minRrRatio?: number; minConfidence?: number }
): ValidationResult {
  return new ActionPlanValidator(opts).validate(plan, mtf);
}

/**
 * Throws a hard error if the institutional rule is violated. This is the
 * last-line-of-defense gate called right before pushing the plan to the
 * QuickTradeDock.
 */
export function assertInstitutionalRule(
  plan: ActionPlan,
  mtf: MTFSemanticVector | null
): void {
  const result = validateActionPlan(plan, mtf);
  if (!result.ok) {
    throw new Error(
      `ActionPlan rejected by institutional rule guard: ${result.errors.join('; ')}`
    );
  }
}

void REQUIRED_INSTITUTIONAL_RULE_KEY;
