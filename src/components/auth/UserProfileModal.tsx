import React from 'react';
import {
  X,
  User,
  Shield,
  Award,
  Wallet,
  Cpu,
  BarChart2,
  Calendar,
  LogOut,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const { language } = useBacktestStore();
  const t = translations[language] || translations.vi;

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in select-none p-4">
      <div className="bg-[#111622] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-xs font-mono">
        {/* Header with Avatar & Tier */}
        <div className="relative p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/60 shadow-lg shadow-indigo-500/20"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-[9px] rounded shadow">
                {user.tier}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100">{user.name}</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold">
                  ● ACTIVE
                </span>
              </div>
              <p className="text-slate-400 text-xs">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Wallet className="w-3.5 h-3.5 text-teal-400" />
                <span>Số dư Demo:</span>
              </div>
              <div className="text-base font-bold text-teal-400 mt-1">
                ${user.tradingBalance.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Số phiên Backtest:</span>
              </div>
              <div className="text-base font-bold text-indigo-300 mt-1">
                {user.completedBacktests}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Strategies:</span>
              </div>
              <div className="text-base font-bold text-purple-300 mt-1">
                {user.savedStrategiesCount}
              </div>
            </div>
          </div>

          {/* Account Perks */}
          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Đặc quyền Gói {user.tier} VIP:</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Tua nến không giới hạn tốc độ 100x với Đa khung thời gian M1 - D1</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>AI Copilot & Sandbox sinh mã chiến lược JavaScript không giới hạn</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Mô phỏng Monte Carlo 1,000 chu kỳ & Heatmap theo giờ/thứ</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-lg flex items-center gap-1.5 font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.logout}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-indigo-600/30"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
