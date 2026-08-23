import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Zap,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useBacktestStore } from '../../store/backtestStore';
import { translations } from '../../i18n/translations';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authMode,
    setAuthModalOpen,
    loginWithEmail,
    registerWithEmail,
    loginDemoTrader,
    loginWithSSO,
    isLoading,
    error
  } = useAuthStore();

  const { language } = useBacktestStore();
  const t = translations[language] || translations.vi;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleFillDefaultAccount = () => {
    setEmail('admin@quantbacktest.pro');
    setPassword('QuantPro@2026');
    setFormValidationError(null);
  };

  const handleOneClickDemo = async () => {
    setFormValidationError(null);
    await loginDemoTrader();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      setFormValidationError(language === 'vi' ? 'Vui lòng nhập định dạng Email hợp lệ (VD: trader@quantbacktest.pro)' : 'Please enter a valid email address (e.g. trader@quantbacktest.pro)');
      return;
    }

    if (password.length < 6) {
      setFormValidationError(language === 'vi' ? 'Mật khẩu phải có độ dài tối thiểu từ 6 ký tự' : 'Password must be at least 6 characters long');
      return;
    }

    if (authMode === 'login') {
      await loginWithEmail(cleanEmail, password);
    } else {
      if (!name.trim()) {
        setFormValidationError(language === 'vi' ? 'Vui lòng nhập Họ và Tên của bạn' : 'Please enter your full name');
        return;
      }
      await registerWithEmail(name.trim(), cleanEmail, password);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in select-none p-4">
      <div className="bg-[#0f1422] border border-slate-700/90 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative text-xs">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400" />

        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/25">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">
            {authMode === 'login' ? t.signInTitle : t.signUpTitle}
          </h2>
          <p className="text-slate-400 mt-1 text-[11px] max-w-xs mx-auto">
            {authMode === 'login' ? t.signInDesc : t.signUpDesc}
          </p>
        </div>

        {/* Tabs Switcher */}
        <div className="flex border-b border-slate-800 mx-6 mb-3">
          <button
            onClick={() => {
              setAuthModalOpen(true, 'login');
              setFormValidationError(null);
            }}
            className={`flex-1 py-2 font-semibold text-center border-b-2 transition-all ${
              authMode === 'login'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.login}
          </button>
          <button
            onClick={() => {
              setAuthModalOpen(true, 'register');
              setFormValidationError(null);
            }}
            className={`flex-1 py-2 font-semibold text-center border-b-2 transition-all ${
              authMode === 'register'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.signup}
          </button>
        </div>

        {/* 1-CLICK DEFAULT DEMO ACCOUNT CARD */}
        <div className="mx-6 mb-3 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <KeyRound className="w-3.5 h-3.5 text-indigo-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-indigo-200 flex items-center gap-1">
                <span>{language === 'vi' ? 'Tài Khoản Mặc Định (Default)' : 'Default Account'}</span>
                <span className="px-1.5 py-0.2 bg-teal-500/20 text-teal-300 rounded text-[9px] font-mono border border-teal-500/30">INSTITUTIONAL</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                admin@quantbacktest.pro • QuantPro@2026
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleFillDefaultAccount}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-medium transition-all"
              title="Điền vào form"
            >
              {language === 'vi' ? 'Điền' : 'Fill'}
            </button>
            <button
              type="button"
              onClick={handleOneClickDemo}
              disabled={isLoading}
              className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="w-3 h-3" />
              <span>{language === 'vi' ? 'Vào Ngay' : '1-Click'}</span>
            </button>
          </div>
        </div>

        {/* SSO Quick Buttons */}
        <div className="px-6 space-y-2">
          {/* Google SSO */}
          <button
            onClick={() => loginWithSSO('google')}
            disabled={isLoading}
            className="w-full py-1.5 px-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex items-center justify-center gap-2.5 font-semibold text-slate-200 hover:text-white transition-all shadow-sm active:scale-98"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t.googleSSO}</span>
          </button>

          {/* GitHub & Apple SSO */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => loginWithSSO('github')}
              disabled={isLoading}
              className="py-1.5 px-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex items-center justify-center gap-2 font-semibold text-slate-300 hover:text-white transition-all active:scale-98"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>{t.githubSSO}</span>
            </button>

            <button
              onClick={() => loginWithSSO('apple')}
              disabled={isLoading}
              className="py-1.5 px-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex items-center justify-center gap-2 font-semibold text-slate-300 hover:text-white transition-all active:scale-98"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.71-.93 2.73 1 .08 2.02-.48 2.64-1.23z" />
              </svg>
              <span>{t.appleSSO}</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-3 px-6">
          <div className="absolute inset-0 flex items-center px-6">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#0f1422] px-2 text-slate-500 font-mono">
              {t.orContinueWith}
            </span>
          </div>
        </div>

        {/* Error message */}
        {(error || formValidationError) && (
          <div className="mx-6 mb-3 p-2.5 bg-rose-950/70 border border-rose-500/50 text-rose-300 rounded-xl text-[11px] flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{formValidationError || error}</span>
          </div>
        )}

        {/* Standard Email/Password Form */}
        <form onSubmit={handleSubmit} className="px-6 space-y-3 pb-6">
          {authMode === 'register' && (
            <div>
              <label className="block text-slate-400 mb-1 text-[11px] font-medium">{t.fullName}</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFormValidationError(null);
                  }}
                  placeholder="Quant Pro Trader"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1 text-[11px] font-medium">{t.email}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormValidationError(null);
                }}
                placeholder="admin@quantbacktest.pro"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px] transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-400 text-[11px] font-medium">{t.password}</label>
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={handleFillDefaultAccount}
                  className="text-indigo-400 hover:text-indigo-300 text-[10px] hover:underline"
                >
                  {language === 'vi' ? 'Quên mật khẩu? (Dùng tài khoản mẫu)' : 'Forgot? Use default demo'}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFormValidationError(null);
                }}
                placeholder="••••••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded accent-indigo-500"
              />
              <span>{t.rememberMe}</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-98 transition-all mt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.processingBtn}</span>
              </>
            ) : (
              <>
                <span>{authMode === 'login' ? t.login : t.signup}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="bg-slate-900/60 border-t border-slate-800 p-2.5 text-center text-slate-500 text-[10px]">
          <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-teal-400" />
          <span>Institutional AES-256 Cloud Encryption • SQLite Local Storage</span>
        </div>
      </div>
    </div>
  );
};
