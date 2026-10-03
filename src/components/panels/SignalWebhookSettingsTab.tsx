import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertTriangle, ShieldCheck, Radio, Sparkles, RefreshCw, Key } from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation } from '../../i18n';
import { SignalWebhookDispatcher, WebhookConfig, DEFAULT_WEBHOOK_CONFIG } from '../../engine/signalWebhookDispatcher';

export const SignalWebhookSettingsTab: React.FC = () => {
  const language = useBacktestStore((s) => s.language);
  const t = getTranslation(language);

  const [config, setConfig] = useState<WebhookConfig>(DEFAULT_WEBHOOK_CONFIG);
  const [testingStatus, setTestingStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [testResultMsg, setTestResultMsg] = useState<string>('');
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    setConfig(SignalWebhookDispatcher.loadConfig());
  }, []);

  const handleSave = () => {
    SignalWebhookDispatcher.saveConfig(config);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleTestPing = async () => {
    setTestingStatus('TESTING');
    setTestResultMsg('');
    const res = await SignalWebhookDispatcher.testPing(config);
    if (res.success) {
      setTestingStatus('SUCCESS');
      setTestResultMsg(t.webhookPingSuccess);
    } else {
      setTestingStatus('ERROR');
      setTestResultMsg(res.message || t.webhookPingFailed);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 font-sans text-xs text-slate-200">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">{t.webhookSettingsTitle}</h3>
            <p className="text-slate-400 text-[11px]">
              Direct Real-Time Telegram & Discord Alert Dispatcher
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="font-bold text-xs text-slate-300">
            {config.enabled ? 'DISPATCHER ON' : 'DISPATCHER OFF'}
          </span>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Telegram Configuration */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
          <Key className="w-4 h-4" />
          <span>Telegram Bot Settings</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {t.webhookTelegramToken}
            </label>
            <input
              type="password"
              placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={config.telegramToken}
              onChange={(e) => setConfig({ ...config, telegramToken: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {t.webhookTelegramChatId}
            </label>
            <input
              type="text"
              placeholder="e.g. -1001234567890 or @channel"
              value={config.telegramChatId}
              onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Discord Configuration */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
          <Send className="w-4 h-4" />
          <span>Discord Webhook Settings</span>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {t.webhookDiscordUrl}
          </label>
          <input
            type="password"
            placeholder="https://discord.com/api/webhooks/..."
            value={config.discordWebhookUrl}
            onChange={(e) => setConfig({ ...config, discordWebhookUrl: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
          />
        </div>
      </div>

      {/* Options */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.autoDispatchOnOrder}
            onChange={(e) => setConfig({ ...config, autoDispatchOnOrder: e.target.checked })}
            className="w-4 h-4 accent-indigo-500 rounded"
          />
          <span className="text-slate-300">{t.webhookAutoDispatch}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.attachChartSnapshot}
            onChange={(e) => setConfig({ ...config, attachChartSnapshot: e.target.checked })}
            className="w-4 h-4 accent-indigo-500 rounded"
          />
          <span className="text-slate-300">{t.webhookAttachSnapshot}</span>
        </label>
      </div>

      {/* Action Buttons & Feedback */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={testingStatus === 'TESTING'}
            onClick={handleTestPing}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold flex items-center gap-1.5 transition-colors border border-slate-700 active:scale-95"
          >
            {testingStatus === 'TESTING' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{t.webhookTestPing}</span>
          </button>

          {testResultMsg && (
            <span
              className={`text-[11px] font-semibold flex items-center gap-1 ${
                testingStatus === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {testingStatus === 'SUCCESS' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {testResultMsg}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-xs active:scale-95"
        >
          {saveToast ? t.snapshotSaved : t.saveChanges}
        </button>
      </div>
    </div>
  );
};
