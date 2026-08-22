import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
  Zap
} from 'lucide-react';
import { generateRealisticCandles } from '../../config/sampleData';
import { CSVDataParser } from '../../engine/csvParser';
import { db } from '../../engine/db';
import { useBacktestStore } from '../../store/backtestStore';

export const DataImportModal: React.FC = () => {
  const {
    isDataModalOpen,
    setDataModalOpen,
    loadCandles,
    setInstrument,
    instrument
  } = useBacktestStore();

  const [isParsing, setIsParsing] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

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

      // Lưu vào IndexedDB
      try {
        await db.datasets.put({
          id: `${instrument.symbol}_custom`,
          symbol: instrument.symbol,
          timeframe: 'M1',
          candleCount: parsed.candles.length,
          startDate: parsed.candles[0].timestamp,
          endDate: parsed.candles[parsed.candles.length - 1].timestamp,
          candles: parsed.candles,
          updatedAt: Date.now()
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in select-none">
      <div className="bg-[#111622] border border-slate-700/80 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* MODAL HEADER */}
        <div className="h-12 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-sky-600/30 border border-sky-500/40 flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <span className="font-bold text-sm text-slate-100">Quản lý & Nạp Dữ liệu Lịch sử (Market Data)</span>
          </div>

          <button
            onClick={() => setDataModalOpen(false)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* DRAG & DROP UPLOAD BOX */}
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

          {/* STATUS NOTIFICATION */}
          {importStatus && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
              importStatus.success ? 'bg-teal-950/80 border border-teal-500/40 text-teal-300' : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
            }`}>
              {importStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* PRESET SAMPLE DATASETS */}
          <div>
            <h4 className="font-bold text-slate-300 text-xs mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Hoặc nạp nhanh Dữ liệu Mẫu chuẩn (Presets):
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
        </div>
      </div>
    </div>
  );
};
