import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
  Zap,
  Globe,
  RefreshCw,
  ArrowDownToLine,
  Layers,
  Activity,
  Calendar,
  Clock,
  ShieldCheck,
  Table,
  Trash2,
  HardDrive,
  FileCheck,
  Check,
  Star,
  Play,
  Filter,
  Download
} from 'lucide-react';
import { generateRealisticCandles } from '../../config/sampleData';
import { CSVDataParser, CSVParseResult } from '../../engine/csvParser';
import { DataCrawler, CrawlProgress } from '../../engine/dataCrawler';
import { datasetsApi } from '../../api';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { INSTRUMENTS } from '../../config/instruments';
import { Timeframe } from '../../types/market';

// Local-First dataset helpers
const getLocalDatasets = (): any[] => {
  try {
    const raw = localStorage.getItem('quant_local_datasets');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalDataset = (dataset: any) => {
  try {
    const current = getLocalDatasets();
    const filtered = current.filter((d: any) => !(d.symbol === dataset.symbol && d.timeframe === dataset.timeframe));
    filtered.unshift(dataset);
    localStorage.setItem('quant_local_datasets', JSON.stringify(filtered.slice(0, 15)));
  } catch (e) {}
};

const deleteLocalDataset = (id: string) => {
  try {
    const current = getLocalDatasets();
    const filtered = current.filter((d: any) => d.id !== id);
    localStorage.setItem('quant_local_datasets', JSON.stringify(filtered));
  } catch (e) {}
};

export const DataImportModal: React.FC = () => {
  const {
    isDataModalOpen,
    setDataModalOpen,
    loadCandles,
    setInstrument,
    instrument,
    language
  } = useBacktestStore();

  const t = translations[language] || translations.vi;

  const [activeTab, setActiveTab] = useState<'crawler' | 'library' | 'csv' | 'presets'>('crawler');
  const [isParsing, setIsParsing] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState<CrawlProgress | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // CSV Import Configuration
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sliceLimit, setSliceLimit] = useState<number>(200000);
  const [targetSymbol, setTargetSymbol] = useState<string>(instrument.symbol);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);

  // Crawler State
  const [crawlMode, setCrawlMode] = useState<'count' | 'dateRange'>('count');
  const [crawlSymbol, setCrawlSymbol] = useState<string>('BTCUSDT');
  const [crawlInterval, setCrawlInterval] = useState<string>('5m');
  const [crawlLimit, setCrawlLimit] = useState<number>(5000);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );

  // Dataset Library State
  const [dbDatasets, setDbDatasets] = useState<any[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(false);
  const [defaultDatasetId, setDefaultDatasetId] = useState<string>(
    localStorage.getItem('quant_default_dataset_id') || ''
  );

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seed sample datasets if empty
  const seedDefaultDatasets = () => {
    const btc = generateRealisticCandles('BTCUSD', 68500, 5000, 5);
    const xau = generateRealisticCandles('XAUUSD', 2650, 5000, 5);
    const eur = generateRealisticCandles('EURUSD', 1.0850, 5000, 5);
    const eth = generateRealisticCandles('ETHUSD', 3500, 3000, 15);

    const initialPacks = [
      {
        id: 'seed_btc',
        symbol: 'BTCUSD',
        timeframe: 'M5',
        candleCount: 5000,
        startDate: btc[0].timestamp,
        endDate: btc[btc.length - 1].timestamp,
        candles: btc,
        source: 'Binance Feed (Seed)',
        createdAt: new Date().toISOString()
      },
      {
        id: 'seed_xau',
        symbol: 'XAUUSD',
        timeframe: 'M5',
        candleCount: 5000,
        startDate: xau[0].timestamp,
        endDate: xau[xau.length - 1].timestamp,
        candles: xau,
        source: 'Institutional Gold (Seed)',
        createdAt: new Date().toISOString()
      },
      {
        id: 'seed_eur',
        symbol: 'EURUSD',
        timeframe: 'M5',
        candleCount: 5000,
        startDate: eur[0].timestamp,
        endDate: eur[eur.length - 1].timestamp,
        candles: eur,
        source: 'Forex Spot (Seed)',
        createdAt: new Date().toISOString()
      }
    ];

    try {
      localStorage.setItem('quant_local_datasets', JSON.stringify(initialPacks));
    } catch (e) {}

    return initialPacks;
  };

  const fetchDBDatasets = async () => {
    setIsLoadingDB(true);
    try {
      let localList = getLocalDatasets();
      if (localList.length === 0) {
        localList = seedDefaultDatasets();
      }

      // Sync with server SQLite if available
      try {
        const serverList = await datasetsApi.list();
        if (serverList && Array.isArray(serverList) && serverList.length > 0) {
          const merged = [...serverList];
          localList.forEach((local) => {
            if (!merged.some((s) => s.id === local.id)) {
              merged.push(local);
            }
          });
          setDbDatasets(merged);
          return;
        }
      } catch (err) {}

      setDbDatasets(localList);
    } catch (e) {
      setDbDatasets(getLocalDatasets());
    } finally {
      setIsLoadingDB(false);
    }
  };

  useEffect(() => {
    if (isDataModalOpen) {
      fetchDBDatasets();
    }
  }, [isDataModalOpen]);

  if (!isDataModalOpen) return null;

  // Auto-detect symbol from file name
  const autoDetectSymbol = (fileName: string): string => {
    const upper = fileName.toUpperCase();
    if (upper.includes('XAU') || upper.includes('GOLD')) return 'XAUUSD';
    if (upper.includes('BTC')) return 'BTCUSD';
    if (upper.includes('ETH')) return 'ETHUSD';
    if (upper.includes('EUR')) return 'EURUSD';
    if (upper.includes('GBP')) return 'GBPUSD';
    if (upper.includes('JPY')) return 'USDJPY';
    if (upper.includes('US30') || upper.includes('DOW')) return 'US30';
    if (upper.includes('DXY') || upper.includes('USDX')) return 'DXY';
    return instrument.symbol;
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setImportStatus(null);
    setParseResult(null);

    const detected = autoDetectSymbol(file.name);
    setTargetSymbol(detected);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const parsed = CSVDataParser.parse(text, {
        maxCandles: sliceLimit > 0 ? sliceLimit : undefined
      });

      setIsParsing(false);

      if (parsed.error || parsed.candles.length === 0) {
        setImportStatus({
          success: false,
          message: parsed.error || t.crawlingFailedMsg
        });
        return;
      }

      setParseResult(parsed);
      setImportStatus({
        success: true,
        message: `${t.importSuccessCount.replace('{count}', parsed.candles.length.toLocaleString())} (${parsed.detectedTimeframe})`
      });
    };

    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleApplyToChart = async () => {
    if (!parseResult || parseResult.candles.length === 0) return;

    const detectedTf = (parseResult.detectedTimeframe || 'M1') as Timeframe;
    loadCandles(parseResult.candles, 0, targetSymbol, detectedTf);

    const newDataset = {
      id: 'ds_' + Date.now(),
      symbol: targetSymbol,
      timeframe: detectedTf,
      candleCount: parseResult.candles.length,
      startDate: parseResult.startTime || parseResult.candles[0]?.timestamp,
      endDate: parseResult.endTime || parseResult.candles[parseResult.candles.length - 1]?.timestamp,
      candles: parseResult.candles,
      source: 'CSV Import',
      createdAt: new Date().toISOString()
    };
    saveLocalDataset(newDataset);

    try {
      await datasetsApi.save(newDataset);
    } catch (e) {}

    setImportStatus({
      success: true,
      message: t.crawlingSuccessMsg.replace('{count}', parseResult.candles.length.toLocaleString())
    });

    setTimeout(() => {
      setDataModalOpen(false);
    }, 600);
  };

  const handleLoadFromDB = async (dataset: any) => {
    try {
      let candlesToLoad = dataset.candles;

      if (!candlesToLoad || candlesToLoad.length === 0) {
        const full = await datasetsApi.get(dataset.id);
        if (full?.candles && Array.isArray(full.candles)) {
          candlesToLoad = full.candles;
        }
      }

      if (!candlesToLoad || candlesToLoad.length === 0) {
        setImportStatus({
          success: false,
          message: t.noDatasetsInDB
        });
        return;
      }

      const dsTf = (dataset.timeframe || 'M5') as Timeframe;
      loadCandles(candlesToLoad, 0, dataset.symbol, dsTf);
      setImportStatus({
        success: true,
        message: t.crawlingSuccessMsg.replace('{count}', candlesToLoad.length.toLocaleString())
      });

      setTimeout(() => {
        setDataModalOpen(false);
      }, 500);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || t.crawlingFailedMsg
      });
    }
  };

  const handleDownloadCSV = (dataset: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dataset.candles || dataset.candles.length === 0) return;
    let csv = 'Timestamp,Date,Open,High,Low,Close,Volume\n';
    dataset.candles.forEach((c: any) => {
      const d = new Date(c.timestamp * 1000).toISOString().replace('T', ' ').substring(0, 19);
      csv += `${c.timestamp},${d},${c.open},${c.high},${c.low},${c.close},${c.volume || 0}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${dataset.symbol}_${dataset.timeframe}_Cleaned_${dataset.candles.length}bars.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSetDefault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultDatasetId(id);
    localStorage.setItem('quant_default_dataset_id', id);
  };

  const handleDeleteFromDB = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteLocalDataset(id);
    try {
      await datasetsApi.delete(id);
    } catch (err) {}
    fetchDBDatasets();
  };

  const handleCrawlOnline = async () => {
    setIsCrawling(true);
    setImportStatus(null);
    setCrawlProgress({
      currentCandles: 0,
      targetCandles: crawlMode === 'count' ? crawlLimit : 10000,
      percent: 5,
      currentBatch: 1,
      totalBatches: Math.ceil((crawlMode === 'count' ? crawlLimit : 10000) / 1000),
      statusText: `${t.crawlingBtn} (${crawlSymbol} ${crawlInterval})...`
    });

    try {
      let result;
      if (crawlMode === 'count') {
        result = await DataCrawler.crawlHistoricalCandles(
          crawlSymbol,
          crawlInterval,
          crawlLimit,
          (prog: CrawlProgress) => setCrawlProgress(prog)
        );
      } else {
        const startTs = new Date(startDate).getTime();
        const endTs = new Date(endDate).getTime();
        if (startTs >= endTs) {
          throw new Error(t.invalidDateRangeMsg);
        }
        result = await DataCrawler.crawlDateRange(
          crawlSymbol,
          crawlInterval,
          startTs,
          endTs,
          (prog: CrawlProgress) => setCrawlProgress(prog)
        );
      }

      if (result.error || result.candles.length === 0) {
        throw new Error(result.error || t.crawlingFailedMsg);
      }

      // Map crawled symbol back to internal instrument format
      const targetSym = crawlSymbol.replace('USDT', 'USD');
      const chosenTf = (crawlInterval === '1m' ? 'M1' : crawlInterval === '5m' ? 'M5' : crawlInterval === '15m' ? 'M15' : crawlInterval === '30m' ? 'M30' : crawlInterval === '1h' ? 'H1' : crawlInterval === '4h' ? 'H4' : crawlInterval === '1d' ? 'D1' : 'M5') as Timeframe;

      loadCandles(result.candles, 0, targetSym, chosenTf);

      // Save to SQLite & Local Cache
      const newDataset = {
        id: 'crawl_' + Date.now(),
        symbol: targetSym,
        timeframe: chosenTf,
        candleCount: result.candles.length,
        startDate: result.candles[0]?.timestamp,
        endDate: result.candles[result.candles.length - 1]?.timestamp,
        candles: result.candles,
        source: `${result.source} Crawl`,
        createdAt: new Date().toISOString()
      };
      saveLocalDataset(newDataset);

      try {
        await datasetsApi.save(newDataset);
      } catch (e) {}

      setImportStatus({
        success: true,
        message: t.crawlingSuccessMsg.replace('{count}', result.candles.length.toLocaleString())
      });

      setTimeout(() => {
        setDataModalOpen(false);
      }, 700);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || t.crawlingFailedMsg
      });
    } finally {
      setIsCrawling(false);
      setCrawlProgress(null);
    }
  };

  const handleLoadPreset = (symbol: string, tfMin: number, startPrice: number) => {
    const tfMap: Record<number, Timeframe> = { 1: 'M1', 5: 'M5', 15: 'M15', 60: 'H1' };
    const tf = tfMap[tfMin] || 'M5';
    const newCandles = generateRealisticCandles(symbol, startPrice, 5000, tfMin);
    loadCandles(newCandles, 0, symbol, tf);
    setImportStatus({
      success: true,
      message: t.importSuccessCount.replace('{count}', '5,000')
    });
    setTimeout(() => {
      setDataModalOpen(false);
    }, 500);
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '---';
    const d = new Date(ts * 1000);
    return d.toISOString().replace('T', ' ').substring(0, 10);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in select-none p-3 font-sans">
      <div className="bg-[#0e131f] border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden text-xs max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="h-13 bg-slate-900/95 border-b border-slate-800/90 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-600/30 border border-sky-500/40 flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 block">{t.dataManagerHeader}</span>
              <span className="text-[10px] text-slate-400 font-mono">{t.sqliteMultiEngineSub}</span>
            </div>
          </div>

          <button
            onClick={() => setDataModalOpen(false)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            title={t.closeDataModal}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TABS HEADER */}
        <div className="h-11 bg-slate-900/70 border-b border-slate-800 px-5 flex items-center gap-2 font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab('crawler')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs shrink-0 ${
              activeTab === 'crawler'
                ? 'bg-sky-600 text-white font-bold shadow-xs shadow-sky-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t.crawlTabTitle}</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs shrink-0 ${
              activeTab === 'library'
                ? 'bg-sky-600 text-white font-bold shadow-xs shadow-sky-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>{t.datasetDbTabTitle} ({dbDatasets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs shrink-0 ${
              activeTab === 'csv'
                ? 'bg-sky-600 text-white font-bold shadow-xs shadow-sky-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.csvTxtTabTitle}</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs shrink-0 ${
              activeTab === 'presets'
                ? 'bg-sky-600 text-white font-bold shadow-xs shadow-sky-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.sampleGbmTabTitle}</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: ONLINE CRAWLER (MULTI-BATCH UP TO 50K CANDLES) */}
          {activeTab === 'crawler' && (
            <div className="space-y-4">
              <div className="bg-sky-950/40 border border-sky-500/30 p-3 rounded-xl text-xs leading-relaxed text-sky-200 flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sky-100">{t.crawlTabTitle}</span>
                  {t.crawlOnlineHeaderDesc}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-4">
                {/* Mode Selector */}
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3 font-mono text-xs">
                  <span className="text-slate-400 font-sans font-medium">{t.downloadMode}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="crawlMode"
                      checked={crawlMode === 'count'}
                      onChange={() => setCrawlMode('count')}
                      className="accent-sky-500"
                    />
                    <span>{t.byCandleCount}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="crawlMode"
                      checked={crawlMode === 'dateRange'}
                      onChange={() => setCrawlMode('dateRange')}
                      className="accent-sky-500"
                    />
                    <span>{t.byDateRange}</span>
                  </label>
                </div>

                {/* Form Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">{t.pairSymbolLabel}</label>
                    <select
                      value={crawlSymbol}
                      onChange={(e) => setCrawlSymbol(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sky-300 font-bold focus:outline-hidden font-mono"
                    >
                      <optgroup label="Crypto (Binance REST API)">
                        <option value="BTCUSDT">BTCUSDT (Bitcoin)</option>
                        <option value="ETHUSDT">ETHUSDT (Ethereum)</option>
                        <option value="SOLUSDT">SOLUSDT (Solana)</option>
                        <option value="BNBUSDT">BNBUSDT (Binance Coin)</option>
                        <option value="XRPUSDT">XRPUSDT (Ripple)</option>
                        <option value="DOGEUSDT">DOGEUSDT (Dogecoin)</option>
                      </optgroup>
                      <optgroup label="Metals & Forex">
                        <option value="XAUUSD">XAUUSD (Gold / Spot)</option>
                        <option value="EURUSD">EURUSD (Euro / USD)</option>
                        <option value="GBPUSD">GBPUSD (Pound / USD)</option>
                        <option value="USDJPY">USDJPY (USD / Yen)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">{t.timeframeLabel}</label>
                    <select
                      value={crawlInterval}
                      onChange={(e) => setCrawlInterval(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-hidden font-mono"
                    >
                      <option value="1m">1m</option>
                      <option value="5m">5m</option>
                      <option value="15m">15m</option>
                      <option value="30m">30m</option>
                      <option value="1h">1h</option>
                      <option value="4h">4h</option>
                      <option value="1d">1d</option>
                    </select>
                  </div>

                  {crawlMode === 'count' ? (
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">{t.candleCountLabel}</label>
                      <select
                        value={crawlLimit}
                        onChange={(e) => setCrawlLimit(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-bold focus:outline-hidden font-mono"
                      >
                        <option value={1000}>1,000</option>
                        <option value={5000}>5,000 {t.recommended}</option>
                        <option value={10000}>10,000</option>
                        <option value={25000}>25,000</option>
                        <option value={50000}>50,000</option>
                      </select>
                    </div>
                  ) : (
                    <div className="col-span-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Start:</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">End:</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* CRAWL PROGRESS BAR */}
                {crawlProgress && (
                  <div className="space-y-1.5 pt-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-sky-300 font-semibold">{crawlProgress.statusText}</span>
                      <span className="text-slate-400">{crawlProgress.percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300 rounded-full"
                        style={{ width: `${crawlProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ✓ {t.autoSaveToSQLite}
                  </span>
                  <button
                    onClick={handleCrawlOnline}
                    disabled={isCrawling}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all active:scale-95 text-xs"
                  >
                    <ArrowDownToLine className={`w-4 h-4 ${isCrawling ? 'animate-bounce' : ''}`} />
                    <span>{isCrawling ? t.crawlingBtn : t.startCrawlAndSave}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATASET LIBRARY (1-CLICK LOAD & DB PERSISTENCE) */}
          {activeTab === 'library' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-200 text-xs font-bold flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-indigo-400" />
                    {t.sqliteDbTitle} ({dbDatasets.length} datasets):
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t.sqliteDbDesc}
                  </p>
                </div>
                <button
                  onClick={fetchDBDatasets}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                  title={t.refreshBtn}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDB ? 'animate-spin' : ''}`} />
                  <span>{t.refreshBtn}</span>
                </button>
              </div>

              {isLoadingDB ? (
                <div className="p-8 text-center text-slate-500 font-mono">Loading Database SQLite...</div>
              ) : dbDatasets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900/60 rounded-xl border border-slate-800">
                  {t.noDatasetsInDB}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {dbDatasets.map((ds) => {
                    const isDefault = defaultDatasetId === ds.id;
                    const candleCount = ds.candleCount || ds.candles?.length || 0;
                    return (
                      <div
                        key={ds.id}
                        className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 p-3.5 rounded-xl transition-all shadow-xs flex flex-col justify-between space-y-3 group"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100 text-sm font-mono">{ds.symbol}</span>
                              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold font-mono">
                                {ds.timeframe || 'M5'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleSetDefault(ds.id, e)}
                              className={`p-1 rounded text-[10px] transition-colors ${
                                isDefault ? 'text-amber-400 bg-amber-950/60 border border-amber-500/40' : 'text-slate-600 hover:text-slate-400'
                              }`}
                              title={isDefault ? t.defaultBadge : t.setAsDefault}
                            >
                              <Star className={`w-3.5 h-3.5 ${isDefault ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          <div className="mt-2 space-y-1 text-[11px] text-slate-400 font-mono">
                            <div className="flex items-center justify-between">
                              <span>{t.candleCountLabel}</span>
                              <span className="font-bold text-slate-200">{candleCount.toLocaleString()} {t.candlesCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{t.dataDateRange}:</span>
                              <span className="text-sky-300 text-[10px]">
                                {formatTimestamp(ds.startDate)} ➔ {formatTimestamp(ds.endDate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                          <button
                            onClick={() => handleLoadFromDB(ds)}
                            className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{t.loadToChartBtn}</span>
                          </button>
                          <button
                            onClick={(e) => handleDownloadCSV(ds, e)}
                            className="p-2 text-slate-500 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title={t.exportCleanedCSV}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteFromDB(ds.id, e)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title={t.deleteDataset}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CSV FILE IMPORT */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-sky-500 bg-sky-950/20'
                    : 'border-slate-700/80 hover:border-sky-500/50 bg-slate-900/40 hover:bg-slate-900/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <FileSpreadsheet className="w-6 h-6 text-sky-400" />
                </div>
                <span className="font-bold text-sm text-slate-200 block">
                  {selectedFile ? selectedFile.name : t.dropzoneTitle}
                </span>
                <span className="text-slate-400 text-[11px] mt-1 block">
                  {t.dropzoneSub}
                </span>
              </div>

              {parseResult && (
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">{t.validCandlesCount}</span>
                      <span className="text-xs font-bold text-emerald-400 mt-0.5 block font-mono">
                        {parseResult.candles.length.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">{t.detectedTimeframe}</span>
                      <span className="text-xs font-bold text-amber-400 mt-0.5 block font-mono">
                        {parseResult.detectedTimeframe}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">CSV Format</span>
                      <span className="text-xs font-bold text-slate-200 mt-0.5 block font-mono">
                        Auto Cleaned
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">{t.duplicatesCleaned}</span>
                      <span className="text-xs font-bold text-sky-400 mt-0.5 block font-mono">
                        {parseResult.duplicatesRemoved.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleApplyToChart}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 text-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>{t.applyDatasetToChart} ({parseResult.candles.length.toLocaleString()} {t.candlesCount})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PRESETS (GBM SIMULATOR) */}
          {activeTab === 'presets' && (
            <div className="space-y-3.5">
              <h4 className="font-bold text-slate-300 text-xs mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {t.gbmTitle}
              </h4>
              <p className="text-slate-400 text-xs">{t.gbmDesc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleLoadPreset('XAUUSD', 5, 2650.0)}
                  className="p-3.5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all group hover:bg-slate-850"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 font-mono text-xs">XAUUSD (Gold / Spot)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-500/30 font-bold">M5</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">5,000 M5 candles with volatility and economic news spikes.</p>
                </button>

                <button
                  onClick={() => handleLoadPreset('BTCUSD', 5, 68500.0)}
                  className="p-3.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition-all group hover:bg-slate-850"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 font-mono text-xs">BTCUSD (Bitcoin)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30 font-bold">M5</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">5,000 M5 candles with high crypto volatility 24/7.</p>
                </button>

                <button
                  onClick={() => handleLoadPreset('EURUSD', 5, 1.0850)}
                  className="p-3.5 bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-xl text-left transition-all group hover:bg-slate-850"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-300 font-mono text-xs">EURUSD (Euro / USD)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-950 text-teal-400 border border-teal-500/30 font-bold">M5</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">5,000 M5 candles institutional FX London-NY sessions.</p>
                </button>

                <button
                  onClick={() => handleLoadPreset('USDJPY', 5, 153.50)}
                  className="p-3.5 bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl text-left transition-all group hover:bg-slate-850"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300 font-mono text-xs">USDJPY (USD / Yen)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-500/30 font-bold">M5</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">5,000 M5 candles Tokyo session liquidity and BOJ interventions.</p>
                </button>
              </div>
            </div>
          )}

          {/* STATUS NOTIFICATION */}
          {importStatus && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-in fade-in ${
                importStatus.success
                  ? 'bg-teal-950/80 border border-teal-500/40 text-teal-300'
                  : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
              }`}
            >
              {importStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
