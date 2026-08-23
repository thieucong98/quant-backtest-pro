import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { language } = useBacktestStore();
  const t = translations[language] || translations.en;

  if (!isOpen) return null;

  const shortcutsList = language === 'vi' ? [
    { key: 'Space', desc: 'Play / Pause vòng lặp Replay phát nến' },
    { key: 'F', desc: 'Tới 1 nến tiếp theo (Step Forward +1)' },
    { key: 'B', desc: 'Mở cửa sổ Đặt lệnh Nhanh (Order Ticket)' },
    { key: 'Ctrl + Z', desc: 'Tua lùi 1 nến (Step Backward -1)' },
    { key: 'Esc', desc: 'Đóng tất cả các bảng Modal / Popup' },
    { key: '1, 2, 3, 4', desc: 'Chuyển nhanh Khung thời gian (M1, M5, H1, D1)' },
    { key: 'Delete', desc: 'Xóa công cụ vẽ đang được chọn' }
  ] : language === 'ja' ? [
    { key: 'Space', desc: 'K線リプレイの再生 / 一時停止' },
    { key: 'F', desc: '次のK線へ進む (Step +1)' },
    { key: 'B', desc: '新規注文パネルを開く' },
    { key: 'Ctrl + Z', desc: '前のK線へ戻る (Step -1)' },
    { key: 'Esc', desc: 'すべてのモーダル / ポップアップを閉じる' },
    { key: '1, 2, 3, 4', desc: '時間軸を素早く切り替え (M1, M5, H1, D1)' },
    { key: 'Delete', desc: '選択した描画ツールを削除' }
  ] : language === 'zh' ? [
    { key: 'Space', desc: '播放 / 暂停 K线回放' },
    { key: 'F', desc: '前进单根K线 (Step +1)' },
    { key: 'B', desc: '打开快速下单面板' },
    { key: 'Ctrl + Z', desc: '后退单根K线 (Step -1)' },
    { key: 'Esc', desc: '关闭所有弹窗面板' },
    { key: '1, 2, 3, 4', desc: '快速切换时间周期 (M1, M5, H1, D1)' },
    { key: 'Delete', desc: '删除所选图表标注工具' }
  ] : [
    { key: 'Space', desc: 'Play / Pause Candle Replay Engine' },
    { key: 'F', desc: 'Step Forward to Next Bar (+1)' },
    { key: 'B', desc: 'Open New Order Ticket Modal' },
    { key: 'Ctrl + Z', desc: 'Step Backward to Previous Bar (-1)' },
    { key: 'Esc', desc: 'Close all open Modals & Popups' },
    { key: '1, 2, 3, 4', desc: 'Quick Switch Timeframe (M1, M5, H1, D1)' },
    { key: 'Delete', desc: 'Delete currently selected drawing tool' }
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
            <span className="font-bold text-sm text-slate-100">{t.keyboardShortcutsTitle}</span>
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
          {t.keyboardShortcutsDesc}
        </div>
      </div>
    </div>
  );
};
