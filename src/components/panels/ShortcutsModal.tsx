import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { language } = useBacktestStore();
  const t = translations[language] || translations.vi;

  if (!isOpen) return null;

  const shortcutsList = [
    { key: 'Space', desc: 'Play / Pause vòng lặp Replay phát nến' },
    { key: 'F', desc: 'Tới 1 nến tiếp theo (Step Forward +1)' },
    { key: 'B', desc: 'Mở cửa sổ Đặt lệnh Nhanh (Order Ticket)' },
    { key: 'Ctrl + Z', desc: 'Tua lùi 1 nến (Step Backward -1)' },
    { key: 'Esc', desc: 'Đóng tất cả các bảng Modal / Popup' },
    { key: '1, 2, 3, 4', desc: 'Chuyển nhanh Khung thời gian (M1, M5, H1, D1)' },
    { key: 'Delete', desc: 'Xóa công cụ vẽ đang được chọn' }
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in select-none p-4">
      <div className="bg-[#111622] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-xs font-mono">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-bold text-sm text-slate-100">{t.shortcuts}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-2.5">
          {shortcutsList.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800"
            >
              <span className="text-slate-300 text-[11px]">{item.desc}</span>
              <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-indigo-300 font-bold shadow-inner">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-center text-slate-500 text-[11px]">
          Nhấn bất kỳ phím nào để tương tác trực tiếp trên giao diện Backtest.
        </div>
      </div>
    </div>
  );
};
