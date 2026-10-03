import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Code2,
  Play,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Sparkles,
  Zap,
  Save,
  RefreshCw
} from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation } from '../../i18n';
import {
  VisualBlockCompiler,
  VisualRuleBlock,
  VisualStrategyModel,
  DEFAULT_VISUAL_STRATEGY,
  IndicatorTriggerType,
  ComparisonOperator,
  TradeActionType
} from '../../engine/visualBlockCompiler';

interface VisualStrategyBuilderProps {
  onLoadStrategyCode: (name: string, description: string, code: string) => void;
  onSaveToDB?: (name: string, description: string, code: string) => void;
}

export const VisualStrategyBuilderModal: React.FC<VisualStrategyBuilderProps> = ({
  onLoadStrategyCode,
  onSaveToDB
}) => {
  const language = useBacktestStore((s) => s.language);
  const t = getTranslation(language);

  const [strategyModel, setStrategyModel] = useState<VisualStrategyModel>(DEFAULT_VISUAL_STRATEGY);
  const [activeTab, setActiveTab] = useState<'designer' | 'code'>('designer');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const compiledCode = VisualBlockCompiler.compileBlocksToJs(strategyModel);

  const handleAddRule = () => {
    const newRule: VisualRuleBlock = {
      id: 'rule_' + Date.now(),
      trigger: 'RSI_THRESHOLD',
      operator: 'LESS_THAN',
      action: 'BUY',
      param1: 14,
      param2: 30,
      lotSize: 0.1,
      slPips: 25,
      tpPips: 50,
      comment: 'Custom Rule ' + (strategyModel.rules.length + 1)
    };
    setStrategyModel({
      ...strategyModel,
      rules: [...strategyModel.rules, newRule]
    });
  };

  const handleRemoveRule = (id: string) => {
    setStrategyModel({
      ...strategyModel,
      rules: strategyModel.rules.filter((r) => r.id !== id)
    });
  };

  const handleUpdateRule = (id: string, updates: Partial<VisualRuleBlock>) => {
    setStrategyModel({
      ...strategyModel,
      rules: strategyModel.rules.map((r) => (r.id === id ? { ...r, ...updates } : r))
    });
  };

  const handleApplyToStudio = () => {
    onLoadStrategyCode(strategyModel.name, strategyModel.description, compiledCode);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0e1320] text-slate-200 font-sans text-xs">
      {/* Top Action Bar */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              {t.visualBuilderTitle}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-500/30">
                No-Code Quant v2.2
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">{t.visualBuilderSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              type="button"
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'designer'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('designer')}
            >
              {t.visualBuilderTab} ({strategyModel.rules.length})
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('code')}
            >
              {t.visualCompileToJs}
            </button>
          </div>

          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
            onClick={handleApplyToStudio}
          >
            {copiedSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{copiedSuccess ? t.visualCompiledSuccess : 'Send to Studio'}</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
        {activeTab === 'designer' ? (
          <div className="space-y-3 max-w-4xl mx-auto">
            {/* Strategy Meta Input */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Strategy Name
                </label>
                <input
                  type="text"
                  value={strategyModel.name}
                  onChange={(e) => setStrategyModel({ ...strategyModel, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold focus:outline-hidden focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={strategyModel.description}
                  onChange={(e) => setStrategyModel({ ...strategyModel, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* List of Rule Blocks */}
            <div className="space-y-3">
              {strategyModel.rules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="p-3.5 rounded-xl bg-[#121829] border border-indigo-500/20 shadow-md space-y-3 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-200 text-xs">
                        Rule #{idx + 1}: {rule.action} when {rule.trigger.replace('_', ' ')}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      onClick={() => handleRemoveRule(rule.id)}
                      title="Remove rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    {/* Trigger Selector */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">
                        {t.visualBlockTrigger}
                      </label>
                      <select
                        value={rule.trigger}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, {
                            trigger: e.target.value as IndicatorTriggerType
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs focus:outline-hidden focus:border-indigo-500"
                      >
                        <option value="EMA_CROSS">EMA Cross</option>
                        <option value="RSI_THRESHOLD">RSI Level</option>
                        <option value="MACD_CROSS">MACD Cross</option>
                        <option value="SMC_ORDER_BLOCK">SMC Order Block</option>
                      </select>
                    </div>

                    {/* Condition / Operator */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">
                        {t.visualBlockOperator}
                      </label>
                      <select
                        value={rule.operator}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, {
                            operator: e.target.value as ComparisonOperator
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs focus:outline-hidden focus:border-indigo-500"
                      >
                        {rule.trigger === 'EMA_CROSS' && (
                          <>
                            <option value="CROSS_ABOVE">{t.visualBlockEmaBullCross}</option>
                            <option value="CROSS_BELOW">{t.visualBlockEmaBearCross}</option>
                          </>
                        )}
                        {rule.trigger === 'RSI_THRESHOLD' && (
                          <>
                            <option value="LESS_THAN">{t.visualBlockRsiOversold}</option>
                            <option value="GREATER_THAN">{t.visualBlockRsiOverbought}</option>
                          </>
                        )}
                        {rule.trigger === 'MACD_CROSS' && (
                          <>
                            <option value="CROSS_ABOVE">MACD Bullish Cross</option>
                            <option value="CROSS_BELOW">MACD Bearish Cross</option>
                          </>
                        )}
                        {rule.trigger === 'SMC_ORDER_BLOCK' && (
                          <>
                            <option value="PRICE_TAPS">{t.visualBlockSmcObBuy}</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Action Selector */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">
                        {t.visualBlockAction}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className={`flex-1 py-1 rounded-md font-bold text-xs transition-colors ${
                            rule.action === 'BUY'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                          onClick={() => handleUpdateRule(rule.id, { action: 'BUY' })}
                        >
                          {t.buy}
                        </button>
                        <button
                          type="button"
                          className={`flex-1 py-1 rounded-md font-bold text-xs transition-colors ${
                            rule.action === 'SELL'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                          onClick={() => handleUpdateRule(rule.id, { action: 'SELL' })}
                        >
                          {t.sell}
                        </button>
                      </div>
                    </div>

                    {/* Risk / Reward Config */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">
                        SL / TP (pips)
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          title="Stop Loss (pips)"
                          value={rule.slPips}
                          onChange={(e) => handleUpdateRule(rule.id, { slPips: Number(e.target.value) })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-rose-300 font-mono text-xs focus:outline-hidden"
                        />
                        <span className="text-slate-600">/</span>
                        <input
                          type="number"
                          title="Take Profit (pips)"
                          value={rule.tpPips}
                          onChange={(e) => handleUpdateRule(rule.id, { tpPips: Number(e.target.value) })}
                          className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-teal-300 font-mono text-xs focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Rule Button */}
            <button
              type="button"
              className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300 font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
              onClick={handleAddRule}
            >
              <Plus className="w-4 h-4" />
              <span>{t.visualAddCondition}</span>
            </button>
          </div>
        ) : (
          /* Live JavaScript Code Preview */
          <div className="space-y-2 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-400" />
                Compiled JavaScript Strategy
              </span>
              <button
                type="button"
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
                onClick={handleApplyToStudio}
              >
                <Play className="w-3.5 h-3.5" />
                <span>{t.visualCompiledSuccess}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-200 overflow-x-auto leading-relaxed max-h-[500px]">
              <code>{compiledCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
