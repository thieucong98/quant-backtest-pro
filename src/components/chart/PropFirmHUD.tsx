import React, { useState } from 'react';
import { Shield, ChevronUp, ChevronDown } from 'lucide-react';
import { AccountState } from '../../types/order';
import { getTranslation } from '../../i18n';
import { useBacktestStore } from '../../store/backtestStore';

interface PropFirmHUDProps {
  account: AccountState;
  propFirmDailyLossLimit: number;
  propFirmMaxDrawdownLimit: number;
  propFirmProfitTarget: number;
  propFirmStartingDayBalance: number;
}

export const PropFirmHUD: React.FC<PropFirmHUDProps> = ({
  account,
  propFirmDailyLossLimit,
  propFirmMaxDrawdownLimit,
  propFirmProfitTarget,
  propFirmStartingDayBalance
}) => {
  const [isShieldExpanded, setIsShieldExpanded] = useState<boolean>(false);
  const language = useBacktestStore((s) => s.language);
  const t = getTranslation(language);

  // Prop firm calculations
  const dailyLossMax = (propFirmStartingDayBalance * propFirmDailyLossLimit) / 100;
  const currentDailyLoss = Math.max(0, propFirmStartingDayBalance - account.equity);
  const dailyLossPercent = (currentDailyLoss / propFirmStartingDayBalance) * 100;
  const isDailyBreached = dailyLossPercent >= propFirmDailyLossLimit;

  const maxDDMax = (account.initialBalance * propFirmMaxDrawdownLimit) / 100;
  const currentMaxDD = Math.max(0, account.initialBalance - account.equity);
  const maxDDPercent = (currentMaxDD / account.initialBalance) * 100;
  const isMaxDDBreached = maxDDPercent >= propFirmMaxDrawdownLimit;

  const profitTargetMax = (account.initialBalance * propFirmProfitTarget) / 100;
  const currentProfit = Math.max(0, account.equity - account.initialBalance);
  const profitProgressPercent = Math.min(100, (currentProfit / profitTargetMax) * 100);
  const isPassed = currentProfit >= profitTargetMax;

  return (
    <div className="bg-[#111622]/95 border border-slate-700/90 backdrop-blur-md rounded-xl p-2 shadow-2xl text-xs space-y-2 w-full transition-all duration-200 pointer-events-auto">
      {/* Header / Pill */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Shield
            className={`w-4 h-4 ${
              isDailyBreached || isMaxDDBreached
                ? 'text-rose-500'
                : isPassed
                ? 'text-emerald-400'
                : 'text-indigo-400'
            }`}
          />
          <span className="text-xs">{t.propFirmShieldTitle}</span>
        </div>
        <div className="flex items-center gap-1">
          {isPassed && (
            <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded text-[9px] font-bold">
              {t.passChallengeBadge}
            </span>
          )}
          {(isDailyBreached || isMaxDDBreached) && (
            <span className="px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-500/40 rounded text-[9px] font-bold">
              {t.violatedBadge}
            </span>
          )}
          <button
            onClick={() => setIsShieldExpanded(!isShieldExpanded)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded transition-colors"
            title={t.toggleShieldTooltip}
          >
            {isShieldExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isShieldExpanded && (
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          {/* Metric 1: Daily Loss Limit */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">
                {t.dailyLossLabel} ({propFirmDailyLossLimit}%):
              </span>
              <span className={`font-bold ${dailyLossPercent >= 4.0 ? 'text-rose-400' : 'text-slate-300'}`}>
                ${currentDailyLoss.toFixed(1)} / ${dailyLossMax.toFixed(0)} ({dailyLossPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  dailyLossPercent >= 4.0 ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, (dailyLossPercent / propFirmDailyLossLimit) * 100)}%` }}
              />
            </div>
          </div>

          {/* Metric 2: Max Drawdown Limit */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">
                {t.maxDrawdownLabel} ({propFirmMaxDrawdownLimit}%):
              </span>
              <span className={`font-bold ${maxDDPercent >= 8.0 ? 'text-rose-400' : 'text-slate-300'}`}>
                ${currentMaxDD.toFixed(1)} / ${maxDDMax.toFixed(0)} ({maxDDPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  maxDDPercent >= 8.0 ? 'bg-rose-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, (maxDDPercent / propFirmMaxDrawdownLimit) * 100)}%` }}
              />
            </div>
          </div>

          {/* Metric 3: Target Profit Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">
                {t.profitTargetLabel} (+{propFirmProfitTarget}%):
              </span>
              <span className="font-bold text-emerald-400">
                +${currentProfit.toFixed(1)} / ${profitTargetMax.toFixed(0)} ({profitProgressPercent.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${profitProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
