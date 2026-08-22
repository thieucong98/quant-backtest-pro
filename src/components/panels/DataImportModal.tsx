import React, { useState } from 'react';
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
  Layers
} from 'lucide-react';
import { generateRealisticCandles } from '../../config/sampleData';
import { CSVDataParser } from '../../engine/csvParser';
import { DataCrawler } from '../../engine/dataCrawler';
import { datasetsApi } from '../../api';
import { useBacktestStore } from '../../store/backtestStore';

export const DataImportModal: React.FC = () => {
  const {
    isDataModalOpen,
    setDataModalOpen,
    loadCandles,
    setInstrument,
    instrument
  } = useBacktestStore();

  const [activeTab, setActiveTab] = useState<'csv' | 'crawler' | 'presets'>('crawler');
  const [isParsing, setIsParsing] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Crawler State
  const [crawlSymbol, setCrawlSymbol] = useState<string>('BTCUSDT');
  const [crawlInterval, setCrawlInterval] = useState<string>('5m');
  const [crawlLimit, setCrawlLimit] = useState<number>(1000);

  if (!isDataModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const parsed = CSVDataParser.parse(text);

      if (parsed.error || parsed.candles.length === 0) {
        setImportStatus({ success: false, message: parsed.error || 'Không tìm thấy nến hợp lệ trong file.' });
        setIsParsing(false);
        return;
      }

      // Lưu vào Database Backend
      try {
        await datasetsApi.save({
          symbol: instrument.symbol,
          timeframe: 'M1',
          candles: parsed.candles,
          source: 'import'
        });
      } catch (e) {}

      loadCandles(parsed.candles);
      setIsParsing(false);
      setImportStatus({
        success: true,
        message: `Đã nạp thành công ${parsed.candles.length.toLocaleString()} nến từ file "${file.name}"!`
      });
    };

    reader.readAsText(file);
  };

  const handleCrawlOnline = async () => {
    setIsCrawling(true);
    setImportStatus(null);

    try {
      const candles = await DataCrawler.fetchBinanceKlines(crawlSymbol, crawlInterval, crawlLimit);
      
      // Chuyển instrument sang BTCUSD nếu crawl BTC
      if (crawlSymbol.includes('BTC')) setInstrument('BTCUSD');
      else if (crawlSymbol.includes('ETH')) setInstrument('ETHUSD');

      // Lưu vào Database Backend
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
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in select-none p-3">
      <div className="bg-[#111622] border border-slate-700/80 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* MODAL HEADER */}
        <div className="h-12 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-sky-600/30 border border-sky-500/40 flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <span className="font-bold text-sm text-slate-100">Quản lý, Import & Tự động Crawl Dữ liệu Lịch sử</span>
          </div>

          <button
            onClick={() => setDataModalOpen(false)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TABS */}
        <div className="h-9 bg-slate-900 border-b border-slate-800 px-4 flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('crawler')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'crawler' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-300" />
            <span>Tự động Crawl Online (Live REST API)</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'csv' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Nạp File CSV / TXT</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'presets' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Dữ liệu Mẫu (GBM Presets)</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] font-mono">
          {/* TAB 1: ONLINE CRAWLER */}
          {activeTab === 'crawler' && (
            <div className="space-y-4">
              <div className="bg-sky-950/40 border border-sky-500/30 p-3 rounded-lg text-xs leading-relaxed text-sky-200">
                🌐 <b>Hệ thống Tự động Crawl Dữ liệu Trực tuyến</b> cho phép kéo trực tiếp hàng ngàn nến lịch sử thực tế từ các sàn giao dịch hàng đầu thế giới (Binance REST API) mà không cần bất kỳ API key nào!
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3.5">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Cặp Tiền (Symbol):</label>
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
                    <label className="block text-slate-400 mb-1">Khung Nến (Interval):</label>
                    <select
                      value={crawlInterval}
                      onChange={(e) => setCrawlInterval(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none"
                    >
                      <option value="1m">1m (1 Phút)</option>
                      <option value="5m">5m (5 Phút)</option>
                      <option value="15m">15m (15 Phút)</option>
                      <option value="1h">1h (1 Giờ)</option>
                      <option value="4h">4h (4 Giờ)</option>
                      <option value="1d">1d (1 Ngày)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Số lượng Nến:</label>
                    <select
                      value={crawlLimit}
                      onChange={(e) => setCrawlLimit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none"
                    >
                      <option value={500}>500 nến</option>
                      <option value={1000}>1,000 nến (Tối đa 1 request)</option>
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
                    <span>{isCrawling ? 'Đang Crawl Dữ liệu...' : 'Bắt đầu Crawl & Nạp vào Chart'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CSV UPLOAD */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-300 text-xs mb-2 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  Nạp file CSV / TXT từ Broker (MT4, MT5, Dukascopy, TradingView):
                </h4>
                <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/70 bg-slate-950/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <FileSpreadsheet className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors mb-2" />
                  <span className="font-semibold text-slate-200 text-xs">
                    {isParsing ? 'Đang đọc và phân tích file...' : 'Kéo thả file CSV vào đây hoặc click để chọn file'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    Hỗ trợ định dạng: Date, Time, Open, High, Low, Close, Volume (Tự động nhận diện)
                  </span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    disabled={isParsing}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PRESETS */}
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
            <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
              importStatus.success ? 'bg-teal-950/80 border border-teal-500/40 text-teal-300' : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
            }`}>
              {importStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
