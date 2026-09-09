import React, { useState, useEffect } from 'react';
import {
  Globe,
  Radio,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Zap,
  Lock,
  RefreshCw,
  X,
  Smartphone,
  Server,
  AlertCircle
} from 'lucide-react';
import { useTunnelStore } from '../../store/tunnelStore';
import { useBacktestStore } from '../../store/backtestStore';
import { getTranslation } from '../../i18n';

export const TunnelModal: React.FC = () => {
  const isTunnelModalOpen = useTunnelStore(s => s.isTunnelModalOpen);
  const setTunnelModalOpen = useTunnelStore(s => s.setTunnelModalOpen);
  const isActive = useTunnelStore(s => s.isActive);
  const isLoading = useTunnelStore(s => s.isLoading);
  const publicUrl = useTunnelStore(s => s.publicUrl);
  const provider = useTunnelStore(s => s.provider);
  const port = useTunnelStore(s => s.port);
  const startedAt = useTunnelStore(s => s.startedAt);
  const pin = useTunnelStore(s => s.pin);
  const error = useTunnelStore(s => s.error);
  const fetchStatus = useTunnelStore(s => s.fetchStatus);
  const startTunnel = useTunnelStore(s => s.startTunnel);
  const stopTunnel = useTunnelStore(s => s.stopTunnel);
  const setPin = useTunnelStore(s => s.setPin);

  const { language } = useBacktestStore();
  const t = getTranslation(language);

  const [selectedProvider, setSelectedProvider] = useState<'CLOUDFLARE' | 'LOCALTUNNEL'>('CLOUDFLARE');
  const [pinInput, setPinInput] = useState(pin || '');
  const [copied, setCopied] = useState(false);
  const [localSeconds, setLocalSeconds] = useState(0);

  useEffect(() => {
    if (isTunnelModalOpen) {
      fetchStatus();
    }
  }, [isTunnelModalOpen, fetchStatus]);

  // Local Uptime ticker - ONLY active when modal is open
  useEffect(() => {
    if (!isTunnelModalOpen || !isActive || !startedAt) {
      setLocalSeconds(0);
      return;
    }
    const calc = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      setLocalSeconds(diff);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [isTunnelModalOpen, isActive, startedAt]);

  const uptimeDisplay = React.useMemo(() => {
    const mins = Math.floor(localSeconds / 60);
    const secs = localSeconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [localSeconds]);

  if (!isTunnelModalOpen) return null;

  const handleCopy = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleToggleTunnel = async () => {
    if (isActive) {
      await stopTunnel();
    } else {
      if (pinInput) {
        await setPin(pinInput);
      }
      await startTunnel(selectedProvider);
    }
  };

  // QR Code URL using standard HTTPS QR image service with dark theme styling
  const qrCodeUrl = publicUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicUrl)}&margin=8&color=10b981&bgcolor=0f172a`
    : '';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
              {isActive ? <Radio className="w-5 h-5 animate-pulse" /> : <Globe className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                {t.remoteTunnelTitle}
                {isActive && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-xs shadow-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {t.tunnelOnlineBadge}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 line-clamp-1">
                {t.remoteTunnelDesc}
              </p>
            </div>
          </div>
          <button
            onClick={() => setTunnelModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t.tunnelInitError}</p>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          )}

          {isActive && publicUrl ? (
            /* Active Tunnel State */
            <div className="space-y-5">
              {/* Public Link Box */}
              <div className="p-4 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    {t.publicUrlLabel}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Uptime: <strong className="text-slate-200 font-mono">{uptimeDisplay}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border border-slate-700 active:scale-95"
                    title={t.copyLink}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copied ? t.linkCopied : t.copyLink}</span>
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition active:scale-95 flex items-center justify-center"
                    title={t.openNewTab}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* QR Code & Mobile Instructions */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center gap-5">
                <div className="w-36 h-36 bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center justify-center shadow-lg shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="Tunnel QR Code"
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      // Fallback if external QR service fails
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-xs font-semibold text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    {t.scanQrCode}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t.tunnelQrHint}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-300">
                      {t.tunnelLocalPort}: <strong>:{port}</strong>
                    </span>
                    <span className="px-2 py-0.5 text-[10px] bg-indigo-950/60 border border-indigo-800/40 rounded text-indigo-300">
                      {t.tunnelProtocol}: <strong>{provider}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Inactive Tunnel Configuration */
            <div className="space-y-4">
              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-indigo-400" />
                  {t.tunnelProvider}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('CLOUDFLARE')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${selectedProvider === 'CLOUDFLARE' ? 'bg-indigo-600/15 border-indigo-500 text-indigo-200 shadow-sm' : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">Cloudflare Argo</span>
                      {selectedProvider === 'CLOUDFLARE' && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400">{t.tunnelCloudflareDesc}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProvider('LOCALTUNNEL')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${selectedProvider === 'LOCALTUNNEL' ? 'bg-indigo-600/15 border-indigo-500 text-indigo-200 shadow-sm' : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">Localtunnel</span>
                      {selectedProvider === 'LOCALTUNNEL' && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400">{t.tunnelLocaltunnelDesc}</p>
                  </button>
                </div>
              </div>

              {/* Optional Security PIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    {t.securityPin}
                  </span>
                  <span className="text-[10px] text-slate-500">{t.tunnelPinHint}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={8}
                    placeholder={t.tunnelPinPlaceholder}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono pl-9"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              {/* Features Overview */}
              <div className="p-3.5 bg-slate-950/30 border border-slate-800/80 rounded-xl space-y-2">
                <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {t.tunnelPerksTitle}
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>{t.tunnelPerk1}</li>
                  <li>{t.tunnelPerk2}</li>
                  <li>{t.tunnelPerk3}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50' : 'bg-slate-500'}`} />
            <span>{isActive ? t.tunnelActive : t.tunnelInactive}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTunnelModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              {t.closeModalBtn}
            </button>

            <button
              type="button"
              onClick={handleToggleTunnel}
              disabled={isLoading}
              className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${isActive ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold shadow-emerald-900/30'}`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t.tunnelInitializing}</span>
                </>
              ) : isActive ? (
                <>
                  <X className="w-4 h-4" />
                  <span>{t.stopTunnel}</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>{t.startTunnel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
