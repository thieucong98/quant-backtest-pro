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
  Check
} from 'lucide-react';
import { generateRealisticCandles } from '../../config/sampleData';
import { CSVDataParser, CSVParseResult } from '../../engine/csvParser';
import { DataCrawler } from '../../engine/dataCrawler';
import { datasetsApi } from '../../api';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';
import { INSTRUMENTS } from '../../config/instruments';
import { InstrumentSpec } from '../../types/market';

// Local-First dataset helpers (Survives offline / server offline)
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
    localStorage.setItem('quant_local_datasets', JSON.stringify(filtered.slice(0, 10)));
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

  const [activeTab, setActiveTab] = useState<'csv' | 'library' | 'crawler' | 'presets'>('csv');
  const [isParsing, setIsParsing] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // CSV Import Configuration
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sliceLimit, setSliceLimit] = useState<number>(200000);
  const [targetSymbol, setTargetSymbol] = useState<string>(instrument.symbol);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);

  // Crawler State
  const [crawlSymbol, setCrawlSymbol] = useState<string>('BTCUSDT');
  const [crawlInterval, setCrawlInterval] = useState<string>('5m');
  const [crawlLimit, setCrawlLimit] = useState<number>(1000);

  // Dataset Library State
  const [dbDatasets, setDbDatasets] = useState<any[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tải danh sách datasets khi mở modal hoặc chuyển sang tab library
  useEffect(() => {
    if (isDataModalOpen && activeTab === 'library') {
      fetchDBDatasets();
    }
  }, [isDataModalOpen, activeTab]);

  const fetchDBDatasets = async () => {
    setIsLoadingDB(true);
    const local = getLocalDatasets();
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleApplyToChart = async () => {
    if (!parseResult || parseResult.candles.length === 0) return;

    if (targetSymbol !== instrument.symbol) {
      setInstrument(targetSymbol);
    }

    // Nạp vào Store & Chart
    loadCandles(parseResult.candles);

    // Lưu trữ Local Cache & Database
    const newDataset = {
      id: 'ds_' + Date.now(),
      symbol: targetSymbol,
      timeframe: parseResult.detectedTimeframe || 'M1',
      candles: parseResult.candles,
      source: 'import',
      createdAt: new Date().toISOString()
    };
    saveLocalDataset(newDataset);

    try {
      await datasetsApi.save(newDataset);
    } catch (e) {}

    setImportStatus({
      success: true,
      message: t.importSuccessCount.replace('{count}', parseResult.candles.length.toLocaleString())
    });

    // Đóng modal sau 600ms
    setTimeout(() => {
      setDataModalOpen(false);
    }, 600);
  };

  const handleLoadFromDB = (dataset: any) => {
    if (!dataset.candles || dataset.candles.length === 0) return;
    if (dataset.symbol && dataset.symbol !== instrument.symbol) {
      setInstrument(dataset.symbol);
    }
    loadCandles(dataset.candles);
    setImportStatus({
      success: true,
      message: `Đã nạp ${dataset.candles.length.toLocaleString()} nến (${dataset.symbol} - ${dataset.timeframe}) từ Database!`
    });
    setTimeout(() => {
      setDataModalOpen(false);
    }, 600);
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

    try {
      const candles = await DataCrawler.fetchBinanceKlines(crawlSymbol, crawlInterval, crawlLimit);

      if (crawlSymbol.includes('BTC')) setInstrument('BTCUSD');
      else if (crawlSymbol.includes('ETH')) setInstrument('ETHUSD');

      try {
        await datasetsApi.save({
          symbol: crawlSymbol,
          timeframe: crawlInterval.toUpperCase(),
          candles,
          source: 'crawl'
        });
      } catch (e) {}

      loadCandles(candles);
      setImportStatus({
        success: true,
        message: `Đã crawl thành công ${candles.length.toLocaleString()} nến thực tế từ Binance API cho ${crawlSymbol} (${crawlInterval})!`
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
    }
  };

  const handleLoadPreset = (symbol: string, tfMin: number, startPrice: number) => {
    setInstrument(symbol);
    const newCandles = generateRealisticCandles(symbol, startPrice, 3000, tfMin);
    loadCandles(newCandles);
    setImportStatus({
      success: true,
      message: `Đã khởi tạo 3,000 nến mẫu chất lượng cao cho ${symbol}!`
    });
    setTimeout(() => {
      setDataModalOpen(false);
    }, 600);
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '---';
    const d = new Date(ts * 1000);
    return d.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in select-none p-3 font-sans">
      <div className="bg-[#0e131f] border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden text-xs max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="h-13 bg-slate-900/95 border-b border-slate-800/90 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-600/30 border border-sky-500/40 flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 block">{t.dataManagerTitle}</span>
              <span className="text-[10px] text-slate-400 font-mono">Institutional High-Performance Engine</span>
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
        <div className="h-10 bg-slate-900/70 border-b border-slate-800 px-5 flex items-center gap-2 font-mono">
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs ${
              activeTab === 'csv'
                ? 'bg-sky-600 text-white font-bold shadow-xs shadow-sky-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.uploadFileTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs ${
              activeTab === 'library'
                ? 'bg-indigo-600 text-white font-bold shadow-xs shadow-indigo-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-300" />
            <span>{t.localLibraryTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('crawler')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs ${
              activeTab === 'crawler'
                ? 'bg-sky-600 text-white font-bold shadow-xs shadow-sky-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-300" />
            <span>{t.autoCrawlTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all text-xs ${
              activeTab === 'presets'
                ? 'bg-amber-600 text-white font-bold shadow-xs shadow-amber-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.sampleDataTab}</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 font-mono">
          {/* TAB 1: CSV / TXT UPLOAD & SMART SLICER */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              {/* SMART CONFIG ROW: SYMBOL + SLICE LIMIT */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] font-bold">
                    {t.selectSymbolLabel}:
                  </label>
                  <select
                    value={targetSymbol}
                    onChange={(e) => setTargetSymbol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sky-300 font-bold focus:outline-none focus:border-sky-500"
                  >
                    {Object.keys(INSTRUMENTS).map((sym) => (
                      <option key={sym} value={sym}>
                        {sym} — {INSTRUMENTS[sym].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[11px] font-bold">
                    {t.candleRangeSlice}:
                  </label>
                  <select
                    value={sliceLimit}
                    onChange={(e) => {
                      const newLimit = Number(e.target.value);
                      setSliceLimit(newLimit);
                      if (selectedFile) {
                        processFile(selectedFile);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value={200000}>{t.slice200k}</option>
                    <option value={100000}>{t.slice100k}</option>
                    <option value={50000}>{t.slice50k}</option>
                    <option value={0}>{t.sliceAll}</option>
                  </select>
                </div>
              </div>

              {/* DRAG & DROP ZONE */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-sky-400 bg-sky-950/40 scale-[1.01] shadow-xl shadow-sky-500/20'
                    : 'border-slate-700/80 hover:border-sky-500/70 bg-slate-950/60 hover:bg-slate-900/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  disabled={isParsing}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-2.5 text-sky-400 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className={`w-6 h-6 ${isParsing ? 'animate-bounce text-sky-400' : ''}`} />
                </div>

                <span className="font-bold text-slate-100 text-sm mb-1">
                  {isParsing ? t.parsingFile : selectedFile ? selectedFile.name : t.dragDropCSV}
                </span>

                <span className="text-[10px] text-slate-400 text-center max-w-md">
                  {selectedFile
                    ? `Dung lượng: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Sẵn sàng phân tích`
                    : t.supportedFormat}
                </span>
              </div>

              {/* DATA HEALTH DIAGNOSTIC CARD */}
              {parseResult && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-slate-200 text-xs">{t.dataHealthTitle}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                      {parseResult.detectedTimeframe} • Chuẩn Hóa 100%
                    </span>
                  </div>

                  {/* METRICS GRID */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">{t.totalRowsParsed}</span>
                      <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                        {parseResult.totalRowsParsed.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">{t.validCandlesCount}</span>
                      <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
                        {parseResult.candles.length.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">{t.duplicatesCleaned}</span>
                      <span className="text-xs font-bold text-sky-400 mt-0.5 block">
                        {parseResult.duplicatesRemoved.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-slate-500 block">{t.detectedTimeframe}</span>
                      <span className="text-xs font-bold text-amber-400 mt-0.5 block">
                        {parseResult.detectedTimeframe}
                      </span>
                    </div>
                  </div>

                  {/* DATE RANGE BAR */}
                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t.dataDateRange}:</span>
                    </div>
                    <div className="font-mono text-slate-200 text-[10px]">
                      <span className="text-sky-300">{formatTimestamp(parseResult.startTime)}</span>
                      <span className="text-slate-500 mx-1.5">➔</span>
                      <span className="text-sky-300">{formatTimestamp(parseResult.endTime)}</span>
                    </div>
                  </div>

                  {/* PREVIEW TABLE */}
                  {parseResult.previewRows && parseResult.previewRows.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Table className="w-3 h-3 text-slate-500" />
                        {t.previewDataTable} (5 dòng đầu):
                      </span>
                      <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-28 text-[10px]">
                        <table className="w-full text-left font-mono">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="p-1.5">#</th>
                              <th className="p-1.5">Cột 0</th>
                              <th className="p-1.5">Cột 1</th>
                              <th className="p-1.5">Cột 2</th>
                              <th className="p-1.5">Cột 3</th>
                              <th className="p-1.5">Cột 4</th>
                              <th className="p-1.5">Cột 5</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 text-slate-300">
                            {parseResult.previewRows.slice(0, 5).map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/40">
                                <td className="p-1.5 text-slate-500">{idx + 1}</td>
                                {row.slice(0, 6).map((cell: any, cIdx: number) => (
                                  <td key={cIdx} className="p-1.5 truncate max-w-[100px]">
                                    {String(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* APPLY BUTTON */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleApplyToChart}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 text-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {t.loadDatasetBtn} ({parseResult.candles.length.toLocaleString()} nến)
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOCAL DATASET LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-xs font-bold flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  Các tập dữ liệu đã lưu trong Database cục bộ:
                </span>
                <button
                  onClick={fetchDBDatasets}
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                  title="Làm mới"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDB ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingDB ? (
                <div className="p-8 text-center text-slate-500">Đang tải danh sách datasets...</div>
              ) : dbDatasets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900/60 rounded-xl border border-slate-800">
                  Chưa có tập dữ liệu nào được lưu trong Database. Hãy nạp file CSV để lưu lại!
                </div>
              ) : (
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 overflow-hidden bg-slate-900/80">
                  {dbDatasets.map((ds) => (
                    <div
                      key={ds.id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-xs">
                          {ds.symbol?.substring(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-xs">{ds.symbol}</span>
                            <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[9px]">
                              {ds.timeframe || 'M1'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              • {(ds.candles?.length || 0).toLocaleString()} nến
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-500 block mt-0.5">
                            Nguồn: {ds.source || 'import'} • Lưu lúc: {new Date(ds.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadFromDB(ds)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Zap className="w-3 h-3 fill-current" />
                          <span>{t.loadDatasetBtn}</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteFromDB(ds.id, e)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Xóa dataset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ONLINE CRAWLER */}
          {activeTab === 'crawler' && (
            <div className="space-y-4">
              <div className="bg-sky-950/40 border border-sky-500/30 p-3 rounded-lg text-xs leading-relaxed text-sky-200">
                {t.autoCrawlDesc}
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3.5">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">{t.symbol}:</label>
                    <select
                      value={crawlSymbol}
                      onChange={(e) => setCrawlSymbol(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sky-300 font-bold focus:outline-none"
                    >
                      <option value="BTCUSDT">BTCUSDT (Bitcoin)</option>
                      <option value="ETHUSDT">ETHUSDT (Ethereum)</option>
                      <option value="SOLUSDT">SOLUSDT (Solana)</option>
                      <option value="BNBUSDT">BNBUSDT (Binance Coin)</option>
                      <option value="XRPUSDT">XRPUSDT (Ripple)</option>
                      <option value="DOGEUSDT">DOGEUSDT (Dogecoin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">{t.intervalLabel}:</label>
                    <select
                      value={crawlInterval}
                      onChange={(e) => setCrawlInterval(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none"
                    >
                      <option value="1m">1m (1 Min)</option>
                      <option value="5m">5m (5 Min)</option>
                      <option value="15m">15m (15 Min)</option>
                      <option value="1h">1h (1 Hour)</option>
                      <option value="4h">4h (4 Hour)</option>
                      <option value="1d">1d (1 Day)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">{t.candlesCount}:</label>
                    <select
                      value={crawlLimit}
                      onChange={(e) => setCrawlLimit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none"
                    >
                      <option value={500}>500 {t.candlesCount}</option>
                      <option value={1000}>1,000 {t.candlesCount}</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleCrawlOnline}
                    disabled={isCrawling}
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all active:scale-95"
                  >
                    <ArrowDownToLine className={`w-4 h-4 ${isCrawling ? 'animate-bounce' : ''}`} />
                    <span>{isCrawling ? t.crawlingBtn : t.startCrawlBtn}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-300 text-xs mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Khởi tạo Dữ liệu Mẫu chân thực (Geometric Brownian Motion + Volatility):
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleLoadPreset('XAUUSD', 5, 2650.0)}
                  className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-lg text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 font-mono">XAUUSD (Vàng)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-500/30">M5</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">3,000 nến M5 dao động mạnh kèm sóng xu hướng.</p>
                </button>

                <button
                  onClick={() => handleLoadPreset('BTCUSD', 15, 68500.0)}
                  className="p-3 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 font-mono">BTCUSD (Bitcoin)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30">M15</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">3,000 nến M15 biến động cao 24/7.</p>
                </button>

                <button
                  onClick={() => handleLoadPreset('EURUSD', 5, 1.0850)}
                  className="p-3 bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-lg text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-300 font-mono">EURUSD (Forex)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-950 text-teal-400 border border-teal-500/30">M5</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">3,000 nến M5 chuẩn cấu trúc Forex.</p>
                </button>

                <button
                  onClick={() => handleLoadPreset('DXY', 60, 104.50)}
                  className="p-3 bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-lg text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300 font-mono">DXY (US Dollar Index)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-500/30">H1</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">3,000 nến H1 chỉ số Đô la Mỹ.</p>
                </button>
              </div>
            </div>
          )}

          {/* STATUS NOTIFICATION */}
          {importStatus && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium animate-in fade-in ${
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
