import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Globe,
  Server,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ExternalLink,
  Lock,
  Radio,
  Cpu,
  Layers
} from 'lucide-react';
import { useBrokerStore } from '../../store/brokerStore';
import { useBacktestStore } from '../../store/backtestStore';
import { BrokerType, PositionMode } from '../../types/broker';
import { brokerApi } from '../../api/broker';
import { getTranslation } from '../../i18n';

export const BrokerConnectionModal: React.FC = () => {
  const {
    isBrokerModalOpen,
    setBrokerModalOpen,
    activeBroker,
    connectionStatus,
    statusMessage,
    pingLatency,
    config,
    updateConfig,
    connectBroker,
    disconnectBroker,
    account,
    isLiveTradingMode,
    setLiveTradingMode
  } = useBrokerStore();

  const language = useBacktestStore((s) => s.language);
  const t = getTranslation(language);

  const [activeTab, setActiveTab] = useState<'mt5' | 'xtb' | 'binance' | 'settings'>('mt5');
  const [isLocalGateway, setIsLocalGateway] = useState<boolean>(
    config.gatewayUrl.includes('127.0.0.1') || config.gatewayUrl.includes('localhost')
  );
  const [gatewayUrl, setGatewayUrl] = useState<string>(config.gatewayUrl || 'http://127.0.0.1:8765');
  const [accountNumber, setAccountNumber] = useState<string>(config.account || '');
  const [password, setPassword] = useState<string>(config.password || '');
  const [serverName, setServerName] = useState<string>(config.server || 'Exness-MT5Real');
  const [positionMode, setPositionMode] = useState<PositionMode>(config.positionMode || 'HEDGING');
  const [maxSlippage, setMaxSlippage] = useState<number>(config.maxSlippagePips || 20);

  // Health ping state
  const [healthStatus, setHealthStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [currentPing, setCurrentPing] = useState<number>(-1);
  const [gatewayInfo, setGatewayInfo] = useState<any>(null);

  // Check health on mount or URL change
  const checkHealth = async (urlToCheck?: string) => {
    setHealthStatus('checking');
    const target = urlToCheck || gatewayUrl;
    const res = await brokerApi.checkHealth(target);
    if (res.status === 'online') {
      setHealthStatus('online');
      setCurrentPing(res.pingMs);
      setGatewayInfo(res.gatewayData);
    } else {
      setHealthStatus('offline');
      setCurrentPing(-1);
      setGatewayInfo(null);
    }
  };

  useEffect(() => {
    if (isBrokerModalOpen) {
      checkHealth(gatewayUrl);
    }
  }, [isBrokerModalOpen, gatewayUrl]);

  if (!isBrokerModalOpen) return null;

  const isConnected = connectionStatus === 'CONNECTED';
  const isConnecting = connectionStatus === 'CONNECTING';

  const handleConnectMT5 = async () => {
    const finalUrl = isLocalGateway ? 'http://127.0.0.1:8765' : gatewayUrl;
    updateConfig({
      brokerType: 'MT5_EXNESS',
      gatewayUrl: finalUrl,
      account: accountNumber,
      password: password,
      server: serverName,
      positionMode,
      maxSlippagePips: maxSlippage
    });

    const success = await connectBroker({
      brokerType: 'MT5_EXNESS',
      gatewayUrl: finalUrl,
      account: accountNumber,
      password: password,
      server: serverName
    });

    if (success) {
      setLiveTradingMode(true);
    }
  };

  const handleDisconnect = async () => {
    await disconnectBroker();
    setLiveTradingMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f1420] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="px-6 py-4 bg-[#141a29] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Broker Connection Hub
                {isConnected && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE CONNECTED
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Direct low-latency bridge to Exness, MT5, XTB, and Binance
              </p>
            </div>
          </div>
          <button
            onClick={() => setBrokerModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-800 bg-[#111724] px-6 gap-2">
          <button
            onClick={() => setActiveTab('mt5')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'mt5'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Exness / MT5
          </button>
          <button
            onClick={() => setActiveTab('xtb')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'xtb'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            XTB (xAPI)
          </button>
          <button
            onClick={() => setActiveTab('binance')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'binance'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4 text-yellow-400" />
            Binance (BNB)
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Settings
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: MT5 / EXNESS */}
          {activeTab === 'mt5' && (
            <div className="space-y-4">
              {/* Gateway Health Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  healthStatus === 'online'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      healthStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2 font-mono">
                      MT5 Gateway: {healthStatus === 'online' ? 'ONLINE (Ready)' : 'OFFLINE'}
                      {currentPing > 0 && (
                        <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded text-slate-300">
                          Ping: {currentPing}ms
                        </span>
                      )}
                      {gatewayInfo?.has_native_mt5 && (
                        <span className="text-[10px] bg-indigo-900/80 px-2 py-0.5 rounded text-indigo-300 font-sans">
                          Native MetaTrader 5 Engine ✅
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {healthStatus === 'online'
                        ? 'Gateway bridge is active. You can connect to your Exness/MT5 account.'
                        : 'Run mt5_gateway/start_gateway.bat on Windows to start bridge.'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => checkHealth()}
                  className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title={t.checkGatewayBtn}
                >
                  <RefreshCw className={`w-4 h-4 ${healthStatus === 'checking' ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Gateway Mode: Local vs Remote VPS */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Gateway Bridge Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLocalGateway(true);
                      setGatewayUrl('http://127.0.0.1:8765');
                      checkHealth('http://127.0.0.1:8765');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isLocalGateway
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-indigo-400" />
                      Localhost MT5 Bridge
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">http://127.0.0.1:8765</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLocalGateway(false)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      !isLocalGateway
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-indigo-400" />
                      Remote VPS Gateway
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Cloud / Custom IP & Port</div>
                  </button>
                </div>
              </div>

              {/* Custom Gateway URL input if Remote VPS */}
              {!isLocalGateway && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Custom VPS Gateway URL</label>
                  <input
                    type="text"
                    value={gatewayUrl}
                    onChange={(e) => setGatewayUrl(e.target.value)}
                    placeholder="http://192.168.1.100:8765 or https://mt5.myvps.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              )}

              {/* Account Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Account Number (Login)</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 84920184"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Master Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Server Name Selection */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300">MT5 Broker Server</label>
                <div className="flex gap-2">
                  <select
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="Exness-MT5Real">Exness-MT5Real (Real Accounts)</option>
                    <option value="Exness-MT5Real2">Exness-MT5Real2</option>
                    <option value="Exness-MT5Trial">Exness-MT5Trial (Demo/Trial)</option>
                    <option value="Exness-MT5Trial2">Exness-MT5Trial2</option>
                    <option value="ICMarketsSC-MT5">IC Markets SC Live</option>
                    <option value="ICMarketsSC-MT5-Demo">IC Markets SC Demo</option>
                    <option value="Pepperstone-MT5-Live">Pepperstone Live</option>
                    <option value="XMGlobal-MT5">XMGlobal Live</option>
                    <option value="Custom">Custom Server Name...</option>
                  </select>
                </div>
              </div>

              {/* Connected Account Summary Card if Active */}
              {isConnected && account && (
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-indigo-300 flex items-center justify-between">
                    <span>{account.company || 'MetaTrader 5'} • {account.server}</span>
                    <span className="font-mono text-white">#{account.login}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                    <div>
                      <div className="text-[10px] text-slate-400">Balance:</div>
                      <div className="font-bold text-white">${account.balance.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Equity:</div>
                      <div className="font-bold text-emerald-400">${account.equity.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Margin Level:</div>
                      <div className="font-bold text-sky-400">
                        {account.marginLevel > 0 ? `${account.marginLevel.toFixed(1)}%` : '---'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: XTB */}
          {activeTab === 'xtb' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl text-amber-200 text-xs">
                <div className="font-bold mb-1">XTB xStation Open API (xAPI)</div>
                <div>Connects directly via JSON-RPC WebSocket over SSL without needing MT5.</div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">XTB User ID / Account</label>
                  <input
                    type="text"
                    placeholder="e.g. 1592014"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Environment</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none">
                    <option value="demo">Demo Account (xapi.xtb.com)</option>
                    <option value="real">Real Account (xapi.xtb.com)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BINANCE */}
          {activeTab === 'binance' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-yellow-950/30 border border-yellow-500/40 rounded-xl text-yellow-200 text-xs">
                <div className="font-bold mb-1">Binance Spot & USD-M Futures</div>
                <div>Connects with HMAC-SHA256 API Key for crypto live order execution.</div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">API Key</label>
                  <input
                    type="text"
                    placeholder="vmPUZE6mv9SD5VBs4EvddVoGmDATKNoWxmmBxgg..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">API Secret</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••••••••••••••••••••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Market Type</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none">
                    <option value="futures">USD-M Futures (fapi.binance.com)</option>
                    <option value="spot">Spot Trading (api.binance.com)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Position Accounting Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPositionMode('HEDGING')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      positionMode === 'HEDGING'
                        ? 'bg-indigo-950/60 border-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs">Hedging Mode (Forex/MT5)</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Multiple BUY and SELL tickets on same symbol
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPositionMode('NETTING')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      positionMode === 'NETTING'
                        ? 'bg-indigo-950/60 border-indigo-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs">Netting Mode (Crypto/Stocks)</div>
                    <div className="text-[10px] text-slate-400 mt-1">Single aggregated position per symbol</div>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Max Allowed Slippage (Pips)</label>
                <input
                  type="number"
                  value={maxSlippage}
                  onChange={(e) => setMaxSlippage(parseInt(e.target.value, 10) || 20)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-[#141a29] border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            Credentials encrypted with AES-256
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setBrokerModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Close
            </button>

            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                Disconnect Account
              </button>
            ) : (
              <button
                onClick={handleConnectMT5}
                disabled={isConnecting}
                className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Connect & Start Trading
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
