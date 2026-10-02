/**
 * Quant Backtest Pro — Multi-Timeframe Matrix Widget
 * Compact grid view of H4/D1 bias, OB/FVG state, sweeps, CHoCH and session.
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 */

import React, { useMemo } from 'react';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation } from '../../i18n';
import type { MTFSemanticVector, PremiumDiscountLocation } from '../../types/smc';

export interface MTFMatrixWidgetProps {
  mtf?: MTFSemanticVector | null;
  compact?: boolean;
}

function locClass(loc: PremiumDiscountLocation): string {
  return `mtf-loc mtf-loc-${loc.toLowerCase()}`;
}

function biasClass(b: 'BULLISH' | 'BEARISH' | 'NEUTRAL'): string {
  return `mtf-bias mtf-bias-${b.toLowerCase()}`;
}

export const MTFMatrixWidget: React.FC<MTFMatrixWidgetProps> = ({ mtf, compact = false }) => {
  const language = useBacktestStore(s => s.language) as 'vi' | 'en' | 'ja' | 'zh';
  const t = getTranslation(language);
  const labels = useMemo(() => ({
    title: t.apexCopilotMtfTitle,
    h4: t.apexCopilotMtfH4,
    d1: t.apexCopilotMtfD1,
    location: t.apexCopilotMtfLocation,
    ob: t.apexCopilotMtfOb,
    fvg: t.apexCopilotMtfFvg,
    sweep: t.apexCopilotMtfSweep,
    choch: t.apexCopilotMtfChoCh,
    volatility: t.apexCopilotMtfVolatility,
    session: t.apexCopilotMtfSession,
    premium: t.apexCopilotLocationPremium,
    discount: t.apexCopilotLocationDiscount,
    equilibrium: t.apexCopilotLocationEquilibrium,
    bull: t.apexCopilotBiasBullish,
    bear: t.apexCopilotBiasBearish,
    neutral: t.apexCopilotBiasNeutral,
    asia: t.apexCopilotSessionAsia,
    london: t.apexCopilotSessionLondon,
    ny: t.apexCopilotSessionNy,
    overlap: t.apexCopilotSessionOverlap,
    volLow: t.apexCopilotVolLow,
    volNormal: t.apexCopilotVolNormal,
    volHigh: t.apexCopilotVolHigh,
    volExtreme: t.apexCopilotVolExtreme,
    none: t.apexCopilotNone,
  }), [t]);

  if (!mtf) {
    return (
      <div className={`mtf-matrix-widget ${compact ? 'mtf-compact' : ''}`}>
        <header className="mtf-matrix-header">{labels.title}</header>
        <div className="mtf-matrix-empty">{labels.none}</div>
      </div>
    );
  }

  const locLabel = mtf.location === 'PREMIUM' ? labels.premium : mtf.location === 'DISCOUNT' ? labels.discount : labels.equilibrium;
  const biasH4 = mtf.bias.h4 === 'BULLISH' ? labels.bull : mtf.bias.h4 === 'BEARISH' ? labels.bear : labels.neutral;
  const biasD1 = mtf.bias.d1 === 'BULLISH' ? labels.bull : mtf.bias.d1 === 'BEARISH' ? labels.bear : labels.neutral;
  const sessionLabel = mtf.volatility.session === 'ASIA' ? labels.asia : mtf.volatility.session === 'LONDON' ? labels.london : mtf.volatility.session === 'NY' ? labels.ny : labels.overlap;
  const volLabel = mtf.volatility.atrBucket === 'LOW' ? labels.volLow : mtf.volatility.atrBucket === 'NORMAL' ? labels.volNormal : mtf.volatility.atrBucket === 'HIGH' ? labels.volHigh : labels.volExtreme;

  return (
    <div className={`mtf-matrix-widget ${compact ? 'mtf-compact' : ''}`}>
      <header className="mtf-matrix-header">{labels.title}</header>
      <div className="mtf-matrix-grid">
        <div className="mtf-cell">
          <span className="mtf-cell-label">{labels.h4}</span>
          <span className={biasClass(mtf.bias.h4)}>{biasH4}</span>
        </div>
        <div className="mtf-cell">
          <span className="mtf-cell-label">{labels.d1}</span>
          <span className={biasClass(mtf.bias.d1)}>{biasD1}</span>
        </div>
        <div className="mtf-cell">
          <span className="mtf-cell-label">{labels.location}</span>
          <span className={locClass(mtf.location)}>{locLabel}</span>
        </div>
        <div className="mtf-cell">
          <span className="mtf-cell-label">{labels.ob}</span>
          <span className="mtf-cell-value">{mtf.activeOB.direction} · {mtf.activeOB.state} · {mtf.activeOB.fillRatioBucket}%</span>
        </div>
        <div className="mtf-cell">
          <span className="mtf-cell-label">{labels.fvg}</span>
          <span className="mtf-cell-value">{mtf.activeFVG.direction} · {mtf.activeFVG.state} · {mtf.activeFVG.fillRatioBucket}%</span>
        </div>
        <div className="mtf-cell">
          <span className="mtf-cell-label">{labels.sweep}</span>
          <span className="mtf-cell-value">{mtf.recentSweep.kind} · {mtf.recentSweep.barsAgo}</span>
        </div>
        <div className="mtf-cell">
          <span className="mtf-cell-label">{labels.choch}</span>
          <span className="mtf-cell-value">{mtf.recentCHoCH.direction} · {mtf.recentCHoCH.barsAgo}</span>
        </div>
        <div className="mtf-cell">
          <span className="mtf-cell-label">{labels.volatility}</span>
          <span className="mtf-cell-value">{volLabel}</span>
        </div>
        <div className="mtf-cell">
          <span className="mtf-cell-label">{labels.session}</span>
          <span className="mtf-cell-value">{sessionLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default MTFMatrixWidget;
