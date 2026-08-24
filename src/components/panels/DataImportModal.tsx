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
  Filter
} from 'lucide-react';
import { generateRealisticCandles } from '../../config/sampleData';
import { CSVDataParser, CSVParseResult } from '../../engine/csvParser';
import { DataCrawler, CrawlProgress } from '../../engine/dataCrawler';
import { datasetsApi } from '../../api';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { INSTRUMENTS } from '../../config/instruments';

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
        source: 'Forex Major (Seed)',
        createdAt: new Date().toISOString()
      },
      {
        id: 'seed_eth',
        symbol: 'ETHUSD',
        timeframe: 'M15',
        candleCount: 3000,
        startDate: eth[0].timestamp,
        endDate: eth[eth.length - 1].timestamp,
        candles: eth,
        source: 'Binance Feed (Seed)',
        createdAt: new Date().toISOString()
      }
    ];

    for (const pack of initialPacks) {
      saveLocalDataset(pack);
    }
    return initialPacks;
  };

  const fetchDBDatasets = async () => {
    setIsLoadingDB(true);
    let local = getLocalDatasets();
    if (local.length === 0) {
      local = seedDefaultDatasets();
    }

    try {
      const serverData = await datasetsApi.list();
      if (Array.isArray(serverData) && serverData.length > 0) {
        const merged = [...serverData];
        for (const loc of local) {
          if (!merged.some((m) => m.id === loc.id || (m.symbol === loc.symbol && m.timeframe === loc.timeframe))) {
            merged.push(loc);
          }
        }
        setDbDatasets(merged);
      } else {
        setDbDatasets(local);
      }
    } catch (err) {
      setDbDatasets(local);
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

  // Auto-detect symbol từ file name
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
          message: parsed.error || 'Không tìm thấy dữ liệu nến hợp lệ trong file CSV.'
        });
        return;
      }

      setParseResult(parsed);
      setImportStatus({
        success: true,
        message: `Đã phân tích thành công ${parsed.candles.length.toLocaleString()} nến (${parsed.detectedTimeframe}) từ file "${file.name}"!`
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

    if (targetSymbol !== instrument.symbol) {
      setInstrument(targetSymbol);
    }

    // Nạp vào Store & Chart (mặc định bắt đầu từ cây nến đầu tiên index 0)
    loadCandles(parseResult.candles, 0);

    // Lưu trữ Local Cache & SQLite Database
    const newDataset = {
      id: 'ds_' + Date.now(),
      symbol: targetSymbol,
      timeframe: parseResult.detectedTimeframe || 'M1',
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
      message: `Đã nạp ${parseResult.candles.length.toLocaleString()} nến và lưu vào Database!`
    });

    setTimeout(() => {
      setDataModalOpen(false);
    }, 600);
  };

  const handleLoadFromDB = async (dataset: any) => {
    try {
      let candlesToLoad = dataset.candles;

      if (!candlesToLoad || candlesToLoad.length === 0) {
        // Fetch full dataset from SQLite if only metadata is present
        const full = await datasetsApi.get(dataset.id);
        if (full?.candles && Array.isArray(full.candles)) {
          candlesToLoad = full.candles;
        }
      }

      if (!candlesToLoad || candlesToLoad.length === 0) {
        setImportStatus({
          success: false,
          message: 'Không tìm thấy dữ liệu nến trong tập dữ liệu này.'
        });
        return;
      }

      if (dataset.symbol && dataset.symbol !== instrument.symbol) {
        setInstrument(dataset.symbol);
      }

      loadCandles(candlesToLoad, 0);
      setImportStatus({
        success: true,
        message: `Đã nạp ${candlesToLoad.length.toLocaleString()} nến (${dataset.symbol} - ${dataset.timeframe}) từ Database!`
      });

      setTimeout(() => {
        setDataModalOpen(false);
      }, 500);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || 'Lỗi khi tải dataset từ Database.'
      });
    }
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
      totalBatches: Math.ceil(crawlLimit / 1000),
      statusText: 'Đang kết nối sàn giao dịch...'
    });

    try {
      let candles = [];
      if (crawlMode === 'dateRange') {
        candles = await DataCrawler.fetchBinanceKlinesByDateRange(
          crawlSymbol,
          crawlInterval,
          startDate,
          endDate,
          (p) => setCrawlProgress(p)
        );
      } else {
        candles = await DataCrawler.fetchMultiAssetKlines(
          crawlSymbol,
          crawlInterval,
          crawlLimit,
          (p) => setCrawlProgress(p)
        );
      }

      // Tự động map sang instrument nội bộ
      const cleanSym = crawlSymbol.toUpperCase().replace('/', '');
      if (cleanSym.includes('BTC')) setInstrument('BTCUSD');
      else if (cleanSym.includes('ETH')) setInstrument('ETHUSD');
      else if (cleanSym.includes('SOL')) setInstrument('SOLUSD');
      else if (cleanSym.includes('XAU')) setInstrument('XAUUSD');
      else if (cleanSym.includes('EUR')) setInstrument('EURUSD');
      else if (cleanSym.includes('GBP')) setInstrument('GBPUSD');
      else if (cleanSym.includes('JPY')) setInstrument('USDJPY');

      // Tự động lưu vào DB SQLite và Local Cache
      const datasetRecord = {
        id: 'ds_' + Date.now(),
        symbol: crawlSymbol,
        timeframe: crawlInterval.toUpperCase(),
        candleCount: candles.length,
        startDate: candles[0]?.timestamp || 0,
        endDate: candles[candles.length - 1]?.timestamp || 0,
        candles,
        source: 'Live REST API',
        createdAt: new Date().toISOString()
      };
      saveLocalDataset(datasetRecord);

      try {
        await datasetsApi.save(datasetRecord);
      } catch (e) {}

      // Nạp lên chart bắt đầu từ cây nến đầu tiên (index 0)
      loadCandles(candles, 0);

      setImportStatus({
        success: true,
        message: `Đã crawl & lưu thành công ${candles.length.toLocaleString()} nến (${crawlSymbol} - ${crawlInterval}) vào Database!`
      });

      setTimeout(() => {
        setDataModalOpen(false);
      }, 700);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: err.message || 'Lỗi khi crawl dữ liệu trực tuyến.'
      });
    } finally {
      setIsCrawling(false);
      setCrawlProgress(null);
    }
  };

  const handleLoadPreset = (symbol: string, tfMin: number, startPrice: number) => {
    setInstrument(symbol);
    const newCandles = generateRealisticCandles(symbol, startPrice, 5000, tfMin);
    loadCandles(newCandles, 0);
    setImportStatus({
      success: true,
      message: `Đã khởi tạo 5,000 nến mẫu chất lượng cao cho ${symbol}!`
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in select-none p-3 font-sans">
      <div className="bg-[#0e131f] border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden text-xs max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="h-13 bg-slate-900/95 border-b border-slate-800/90 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-600/30 border border-sky-500/40 flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 block">Quản lý, Import & Thư Viện Dữ Liệu Lịch Sử</span>
              <span className="text-[10px] text-slate-400 font-mono">SQLite Institutional Database • Multi-Batch Engine</span>
            </div>
          </div>

          <button
            onClick={() => setDataModalOpen(false)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TABS HEADER */}
        <div className="h-11 bg-slate-900/70 border-b border-slate-800 px-5 flex items-center gap-2 font-mono">
          <button
            onClick={() => setActiveTab('crawler')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs ${
              activeTab === 'crawler'
                ? 'bg-sky-600 text-white font-bold shadow-xs shadow-sky-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Tự động Crawl Online (1k-50k nến)</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs ${
              activeTab === 'library'
                ? 'bg-sky-600 text-white font-bold shadow-xs shadow-sky-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Thư Viện Dataset DB ({dbDatasets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs ${
              activeTab === 'csv'
                ? 'bg-sky-600 text-white font-bold shadow-xs shadow-sky-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Nạp File CSV / TXT</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs ${
              activeTab === 'presets'
                ? 'bg-sky-600 text-white font-bold shadow-xs shadow-sky-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dữ liệu Mẫu (GBM)</span>
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
                  <span className="font-bold block text-sky-100">Crawl Dữ Liệu Trực Tuyến Đa Tài Sản (Không Cần API Key):</span>
                  Kéo dữ liệu nến thực tế lịch sử cho <strong>Crypto (Binance)</strong>, <strong>Vàng (XAUUSD)</strong> và <strong>Forex (EURUSD, GBPUSD, USDJPY)</strong>. Hỗ trợ phân trang kéo lên đến <strong>50,000 nến</strong> hoặc chọn chính xác theo khoảng ngày!
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-4">
                {/* Mode Selector */}
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3 font-mono text-xs">
                  <span className="text-slate-400 font-sans font-medium">Chế độ tải:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="crawlMode"
                      checked={crawlMode === 'count'}
                      onChange={() => setCrawlMode('count')}
                      className="accent-sky-500"
                    />
                    <span>Theo Số Lượng Nến (1k - 50k)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                    <input
                      type="radio"
                      name="crawlMode"
                      checked={crawlMode === 'dateRange'}
                      onChange={() => setCrawlMode('dateRange')}
                      className="accent-sky-500"
                    />
                    <span>Theo Khoảng Ngày (Từ ngày ➔ Đến ngày)</span>
                  </label>
                </div>

                {/* Form Controls */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Mã Cặp Tiền:</label>
                    <select
                      value={crawlSymbol}
                      onChange={(e) => setCrawlSymbol(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sky-300 font-bold focus:outline-none font-mono"
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
                        <option value="XAUUSD">XAUUSD (Vàng Giao Ngay)</option>
                        <option value="EURUSD">EURUSD (Euro / USD)</option>
                        <option value="GBPUSD">GBPUSD (Bảng Anh / USD)</option>
                        <option value="USDJPY">USDJPY (USD / Yên Nhật)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Khung Thời Gian:</label>
                    <select
                      value={crawlInterval}
                      onChange={(e) => setCrawlInterval(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none font-mono"
                    >
                      <option value="1m">1m (1 Phút)</option>
                      <option value="5m">5m (5 Phút)</option>
                      <option value="15m">15m (15 Phút)</option>
                      <option value="30m">30m (30 Phút)</option>
                      <option value="1h">1h (1 Giờ)</option>
                      <option value="4h">4h (4 Giờ)</option>
                      <option value="1d">1d (1 Ngày)</option>
                    </select>
                  </div>

                  {crawlMode === 'count' ? (
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Số Lượng Nến:</label>
                      <select
                        value={crawlLimit}
                        onChange={(e) => setCrawlLimit(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-bold focus:outline-none font-mono"
                      >
                        <option value={1000}>1,000 nến (Nhanh)</option>
                        <option value={5000}>5,000 nến (Khuyên dùng)</option>
                        <option value={10000}>10,000 nến (~1 tháng M5)</option>
                        <option value={25000}>25,000 nến (~3 tháng M5)</option>
                        <option value={50000}>50,000 nến (~6 tháng M5)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="col-span-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Từ ngày:</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Đến ngày:</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs font-mono focus:outline-none"
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
                    ✓ Tự động lưu vào SQLite DB sau khi tải
                  </span>
                  <button
                    onClick={handleCrawlOnline}
                    disabled={isCrawling}
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all active:scale-95 text-xs"
                  >
                    <ArrowDownToLine className={`w-4 h-4 ${isCrawling ? 'animate-bounce' : ''}`} />
                    <span>{isCrawling ? 'Đang tải dữ liệu...' : 'Bắt đầu Crawl & Tự Động Lưu DB'}</span>
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
                    Thư Viện Dữ Liệu Đã Lưu Trong Hệ Thống ({dbDatasets.length} datasets):
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    1-Click nạp nến và bắt đầu Backtest ngay mà không cần tìm file hay crawl lại!
                  </p>
                </div>
                <button
                  onClick={fetchDBDatasets}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                  title="Làm mới danh sách từ Database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDB ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              {isLoadingDB ? (
                <div className="p-8 text-center text-slate-500 font-mono">Đang kết nối Database SQLite...</div>
              ) : dbDatasets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900/60 rounded-xl border border-slate-800">
                  Chưa có tập dữ liệu nào. Hãy Crawl Online hoặc Nạp CSV để lưu trữ!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {dbDatasets.map((ds) => {
                    const isDefault = defaultDatasetId === ds.id;
                    const candleCount = ds.candleCount || ds.candles?.length || 0;
                    return (
                      <div
                        key={ds.id}
                        className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 p-3.5 rounded-xl transition-all shadow-sm flex flex-col justify-between space-y-3 group"
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
                              title={isDefault ? 'Dataset Mặc Định' : 'Đặt làm Mặc định khi mở App'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isDefault ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          <div className="mt-2 space-y-1 text-[11px] text-slate-400 font-mono">
                            <div className="flex items-center justify-between">
                              <span>Số lượng nến:</span>
                              <span className="font-bold text-slate-200">{candleCount.toLocaleString()} nến</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Dải thời gian:</span>
                              <span className="text-sky-300 text-[10px]">
                                {formatTimestamp(ds.startDate)} ➔ {formatTimestamp(ds.endDate)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                              <span>Nguồn: {ds.source || 'Import'}</span>
                              <span>Lưu: {new Date(ds.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                          <button
                            onClick={() => handleLoadFromDB(ds)}
                            className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Nạp & Backtest Ngay</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteFromDB(ds.id, e)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Xóa khỏi Database"
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
                  {selectedFile ? selectedFile.name : 'Kéo thả file CSV vào đây hoặc click để chọn'}
                </span>
                <span className="text-slate-400 text-[11px] mt-1 block">
                  Hỗ trợ định dạng MT4/MT5, TradingView, Yahoo Finance, Binance CSV (Dấu phẩy, chấm phẩy, tab)
                </span>
              </div>

              {parseResult && (
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">Số Lượng Nến</span>
                      <span className="text-xs font-bold text-emerald-400 mt-0.5 block font-mono">
                        {parseResult.candles.length.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">Khung Thời Gian</span>
                      <span className="text-xs font-bold text-amber-400 mt-0.5 block font-mono">
                        {parseResult.detectedTimeframe}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">Định Dạng CSV</span>
                      <span className="text-xs font-bold text-slate-200 mt-0.5 block font-mono">
                        Tự động chuẩn hóa
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">Lọc Trùng Lặp</span>
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
                      <span>Nạp Lên Biểu Đồ & Tự Động Lưu DB ({parseResult.candles.length.toLocaleString()} nến)</span>
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
                Khởi tạo 5,000 nến Mẫu Chân Thực (Geometric Brownian Motion + Session Volatility):
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleLoadPreset('XAUUSD', 5, 2650.0)}
                  className="p-3.5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all group hover:bg-slate-850"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 font-mono text-xs">XAUUSD (Vàng Giao Ngay)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-500/30 font-bold">M5</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">5,000 nến M5 dao động mạnh kèm tin tức CPI/FOMC.</p>
                </button>

                <button
                  onClick={() => handleLoadPreset('BTCUSD', 5, 68500.0)}
                  className="p-3.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition-all group hover:bg-slate-850"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 font-mono text-xs">BTCUSD (Bitcoin)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30 font-bold">M5</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">5,000 nến M5 biến động cao 24/7 thị trường Crypto.</p>
                </button>

                <button
                  onClick={() => handleLoadPreset('EURUSD', 5, 1.0850)}
                  className="p-3.5 bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-xl text-left transition-all group hover:bg-slate-850"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-300 font-mono text-xs">EURUSD (Forex)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-950 text-teal-400 border border-teal-500/30 font-bold">M5</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">5,000 nến M5 cấu trúc chuẩn Forex phiên Âu - Mỹ.</p>
                </button>

                <button
                  onClick={() => handleLoadPreset('USDJPY', 5, 153.50)}
                  className="p-3.5 bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl text-left transition-all group hover:bg-slate-850"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300 font-mono text-xs">USDJPY (Đô la / Yên Nhật)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-500/30 font-bold">M5</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">5,000 nến M5 đặc tính phiên Á và can thiệp tỷ giá BOJ.</p>
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
