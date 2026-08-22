export type Language = 'vi' | 'en' | 'ja' | 'zh';

export interface TranslationDict {
  // App Branding & Navigation
  appTitle: string;
  appSubtitle: string;
  instruments: string;
  timeframe: string;
  replay: string;
  
  // Header Actions
  orderEntry: string;
  aiStudio: string;
  analytics: string;
  dataImport: string;
  shortcuts: string;
  login: string;
  signup: string;
  profile: string;
  logout: string;
  proBadge: string;

  // Replay Bar
  play: string;
  pause: string;
  stepForward: string;
  stepBackward: string;
  reset: string;
  speed: string;
  candlesCount: string;
  
  // Quick Trade Dock
  quickTrade: string;
  buy: string;
  sell: string;
  lotSize: string;
  autoSL: string;
  autoTP: string;
  pips: string;
  
  // Positions & Orders Table
  openPositions: string;
  pendingOrders: string;
  history: string;
  strategyLogs: string;
  closeAll: string;
  noOpenPositions: string;
  noPendingOrders: string;
  noHistory: string;
  symbol: string;
  side: string;
  lot: string;
  entryPrice: string;
  currentPrice: string;
  floatingPnL: string;
  realizedPnL: string;
  actions: string;
  setBE: string;
  close50: string;
  editSLTP: string;
  closePosition: string;
  tagStrategy: string;
  psychologyNote: string;
  saveChanges: string;
  cancel: string;

  // Analytics Modal
  analyticsTitle: string;
  overviewTab: string;
  monteCarloTab: string;
  heatmapTab: string;
  exportCSV: string;
  equityGrowth: string;
  netProfit: string;
  winRate: string;
  profitFactor: string;
  maxDrawdown: string;
  totalTrades: string;
  grossProfit: string;
  grossLoss: string;
  avgWin: string;
  avgLoss: string;
  riskReward: string;
  expectedPayoff: string;
  sharpeRatio: string;
  sortinoRatio: string;
  consecutiveWins: string;
  consecutiveLosses: string;
  monteCarloDesc: string;
  medianProfit: string;
  worstCaseDD: string;
  percentile95DD: string;
  riskOfRuin: string;
  heatmapDesc: string;

  // AI Strategy Modal
  aiStudioTitle: string;
  promptPlaceholder: string;
  generateStrategy: string;
  generating: string;
  autoTrading: string;
  copilotTips: string;
  parameters: string;
  codeEditor: string;

  // Session Manager
  sessions: string;
  sessionManagerTitle: string;
  sessionManagerDesc: string;
  createNewSession: string;
  sessionList: string;
  sessionName: string;
  initialBalance: string;
  finalBalance: string;
  currentEquity: string;
  resumeSession: string;
  completeSession: string;
  deleteSession: string;
  runningStatus: string;
  completedStatus: string;
  totalSessions: string;
  confirmDeleteSession: string;

  // Auth Modal
  signInTitle: string;
  signUpTitle: string;
  signInDesc: string;
  signUpDesc: string;
  email: string;
  password: string;
  fullName: string;
  rememberMe: string;
  forgotPassword: string;
  orContinueWith: string;
  noAccount: string;
  haveAccount: string;
  googleSSO: string;
  githubSSO: string;
  appleSSO: string;
}

export const translations: Record<Language, TranslationDict> = {
  vi: {
    appTitle: 'Quant Backtest Pro',
    appSubtitle: 'Nền tảng Replay & Kiểm thử Định lượng Đa Tài sản',
    instruments: 'Tài sản',
    timeframe: 'Khung thời gian',
    replay: 'Phát lại',
    
    orderEntry: 'Vào lệnh',
    aiStudio: 'AI Strategy Studio',
    analytics: 'Báo cáo & Phân tích',
    dataImport: 'Dữ liệu',
    shortcuts: 'Phím tắt',
    login: 'Đăng nhập',
    signup: 'Đăng ký',
    profile: 'Hồ sơ',
    logout: 'Đăng xuất',
    proBadge: 'PRO VIP',

    play: 'Phát',
    pause: 'Tạm dừng',
    stepForward: 'Tới 1 nến (+1)',
    stepBackward: 'Lùi 1 nến (-1)',
    reset: 'Đặt lại',
    speed: 'Tốc độ',
    candlesCount: 'nến',

    quickTrade: 'Vào lệnh Nhanh',
    buy: 'MUA (BUY)',
    sell: 'BÁN (SELL)',
    lotSize: 'Khối lượng Lot',
    autoSL: 'SL',
    autoTP: 'TP',
    pips: 'p',

    openPositions: 'Vị thế Đang Mở',
    pendingOrders: 'Lệnh Chờ (Pending)',
    history: 'Lịch sử Khớp Lệnh',
    strategyLogs: 'Nhật ký Chiến lược AI',
    closeAll: 'Đóng tất cả',
    noOpenPositions: 'Chưa có vị thế nào. Sử dụng thanh Quick Trade để vào lệnh.',
    noPendingOrders: 'Không có lệnh chờ.',
    noHistory: 'Chưa có lịch sử lệnh đã đóng.',
    symbol: 'Mã',
    side: 'Loại',
    lot: 'Lot',
    entryPrice: 'Giá vào',
    currentPrice: 'Giá hiện tại',
    floatingPnL: 'Lãi/Lỗ tạm tính',
    realizedPnL: 'PnL thực nhận',
    actions: 'Hành động',
    setBE: 'Dời BE',
    close50: 'Đóng 50%',
    editSLTP: 'Sửa SL/TP',
    closePosition: 'Đóng vị thế',
    tagStrategy: 'Gắn thẻ Chiến lược (Setup)',
    psychologyNote: 'Ghi chú Tâm lý',
    saveChanges: 'Lưu thay đổi',
    cancel: 'Hủy',

    analyticsTitle: 'Báo cáo Định lượng & Thống kê Hiệu suất',
    overviewTab: 'Tổng quan & Chỉ số',
    monteCarloTab: 'Mô phỏng Monte Carlo (1,000 lần)',
    heatmapTab: 'Ma trận Khung Giờ & Thứ',
    exportCSV: 'Xuất file CSV',
    equityGrowth: 'Đường cong Tăng trưởng Vốn (Equity Curve)',
    netProfit: 'Lợi nhuận ròng',
    winRate: 'Tỷ lệ Thắng (Win Rate)',
    profitFactor: 'Profit Factor',
    maxDrawdown: 'Sụt giảm tối đa (Max DD)',
    totalTrades: 'Tổng số lệnh',
    grossProfit: 'Tổng Lãi (Gross Profit)',
    grossLoss: 'Tổng Lỗ (Gross Loss)',
    avgWin: 'Lãi TB / lệnh thắng',
    avgLoss: 'Lỗ TB / lệnh thua',
    riskReward: 'Tỷ lệ Risk : Reward',
    expectedPayoff: 'Expected Payoff',
    sharpeRatio: 'Sharpe Ratio',
    sortinoRatio: 'Sortino Ratio',
    consecutiveWins: 'Chuỗi Thắng liên tiếp max',
    consecutiveLosses: 'Chuỗi Thua liên tiếp max',
    monteCarloDesc: 'Mô phỏng Monte Carlo xáo trộn ngẫu nhiên thứ tự các lệnh đã thực thi 1,000 lần để kiểm định độ bền bỉ của chiến lược dưới các kịch bản thị trường bất lợi nhất.',
    medianProfit: 'Lợi nhuận Trung vị (Median)',
    worstCaseDD: 'Max DD Kịch bản Xấu nhất',
    percentile95DD: '95% Phân vị Max DD',
    riskOfRuin: 'Xác suất Cháy vốn (>50% DD)',
    heatmapDesc: 'Phân bố Lợi nhuận và Hiệu suất theo Khung Giờ (UTC) & Ngày trong tuần:',

    aiStudioTitle: 'AI Strategy Studio & Sandbox Runner',
    promptPlaceholder: 'Mô tả chiến lược của bạn (VD: Chiến lược EMA 20 cắt EMA 50 kết hợp RSI < 35)...',
    generateStrategy: 'Tạo Chiến Lược AI',
    generating: 'Đang khởi tạo thuật toán...',
    autoTrading: 'Tự động giao dịch AI',
    copilotTips: 'AI Copilot Audit Tips',
    parameters: 'Tham số Chiến lược',
    codeEditor: 'Mã nguồn Thuật toán (JavaScript Sandbox)',

    sessions: 'Phiên giao dịch',
    sessionManagerTitle: 'Quản Lý Phiên Backtest (Database Sessions)',
    sessionManagerDesc: 'Dữ liệu phiên, lịch sử lệnh, bản vẽ và thống kê được lưu vĩnh viễn trong Database.',
    createNewSession: 'Tạo phiên mới',
    sessionList: 'Danh sách phiên',
    sessionName: 'Tên phiên',
    initialBalance: 'Vốn ban đầu',
    finalBalance: 'Số dư cuối',
    currentEquity: 'Vốn ròng hiện tại',
    resumeSession: 'Tiếp tục',
    completeSession: 'Hoàn thành',
    deleteSession: 'Xóa',
    runningStatus: 'ĐANG CHẠY',
    completedStatus: 'ĐÃ HOÀN THÀNH',
    totalSessions: 'Tổng số phiên',
    confirmDeleteSession: 'Bạn có chắc chắn muốn xóa phiên backtest này khỏi cơ sở dữ liệu?',

    signInTitle: 'Đăng nhập Tài khoản',
    signUpTitle: 'Tạo Tài khoản Mới',
    signInDesc: 'Truy cập vào hệ thống Backtest đa tài sản và AI Copilot',
    signUpDesc: 'Bắt đầu hành trình làm chủ thị trường với dữ liệu Tick chính xác',
    email: 'Địa chỉ Email',
    password: 'Mật khẩu',
    fullName: 'Họ và tên',
    rememberMe: 'Ghi nhớ đăng nhập',
    forgotPassword: 'Quên mật khẩu?',
    orContinueWith: 'Hoặc tiếp tục với SSO',
    noAccount: 'Chưa có tài khoản?',
    haveAccount: 'Đã có tài khoản?',
    googleSSO: 'Google Account',
    githubSSO: 'GitHub Account',
    appleSSO: 'Apple ID'
  },
  en: {
    appTitle: 'Quant Backtest Pro',
    appSubtitle: 'Web-based Multi-Asset Forex & Crypto Replay Platform',
    instruments: 'Instruments',
    timeframe: 'Timeframe',
    replay: 'Replay',
    
    orderEntry: 'New Order',
    aiStudio: 'AI Strategy Studio',
    analytics: 'Analytics & Reports',
    dataImport: 'Data Manager',
    shortcuts: 'Shortcuts',
    login: 'Sign In',
    signup: 'Sign Up',
    profile: 'Profile',
    logout: 'Log Out',
    proBadge: 'PRO VIP',

    play: 'Play',
    pause: 'Pause',
    stepForward: 'Step +1',
    stepBackward: 'Step -1',
    reset: 'Reset',
    speed: 'Speed',
    candlesCount: 'bars',

    quickTrade: 'Quick Trade',
    buy: 'BUY',
    sell: 'SELL',
    lotSize: 'Lot Size',
    autoSL: 'SL',
    autoTP: 'TP',
    pips: 'p',

    openPositions: 'Open Positions',
    pendingOrders: 'Pending Orders',
    history: 'Trade History',
    strategyLogs: 'AI Strategy Logs',
    closeAll: 'Close All Orders',
    noOpenPositions: 'No open positions. Use Quick Trade BUY / SELL to enter a trade.',
    noPendingOrders: 'No pending orders.',
    noHistory: 'No completed trades yet.',
    symbol: 'Symbol',
    side: 'Side',
    lot: 'Lot',
    entryPrice: 'Entry Price',
    currentPrice: 'Current Price',
    floatingPnL: 'Floating PnL',
    realizedPnL: 'Net Realized PnL',
    actions: 'Actions',
    setBE: 'Set BE',
    close50: 'Close 50%',
    editSLTP: 'Edit SL/TP',
    closePosition: 'Close Order',
    tagStrategy: 'Strategy Setup Tag',
    psychologyNote: 'Psychology Note',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',

    analyticsTitle: 'Quantitative Performance Analytics & Risk Metrics',
    overviewTab: 'Overview & Key Metrics',
    monteCarloTab: 'Monte Carlo Stress Test (1,000 runs)',
    heatmapTab: 'Day & Hour PnL Heatmap',
    exportCSV: 'Export CSV History',
    equityGrowth: 'Equity & Balance Growth Curve',
    netProfit: 'Net Profit',
    winRate: 'Win Rate',
    profitFactor: 'Profit Factor',
    maxDrawdown: 'Max Drawdown',
    totalTrades: 'Total Trades',
    grossProfit: 'Gross Profit',
    grossLoss: 'Gross Loss',
    avgWin: 'Average Win',
    avgLoss: 'Average Loss',
    riskReward: 'Risk : Reward Ratio',
    expectedPayoff: 'Expected Payoff',
    sharpeRatio: 'Sharpe Ratio',
    sortinoRatio: 'Sortino Ratio',
    consecutiveWins: 'Max Consecutive Wins',
    consecutiveLosses: 'Max Consecutive Losses',
    monteCarloDesc: 'Monte Carlo simulation reshuffles trade order 1,000 times to stress test strategy resilience under adverse market conditions.',
    medianProfit: 'Median Profit',
    worstCaseDD: 'Worst-Case Max Drawdown',
    percentile95DD: '95th Percentile Max DD',
    riskOfRuin: 'Risk of Ruin (>50% DD)',
    heatmapDesc: 'PnL and Win Rate distribution across Trading Hours (UTC) & Days of Week:',

    aiStudioTitle: 'AI Strategy Studio & Sandbox Runner',
    promptPlaceholder: 'Describe your trading strategy (e.g. EMA 20 crossing EMA 50 with RSI < 35 pullback)...',
    generateStrategy: 'Generate AI Strategy',
    generating: 'Synthesizing algorithm...',
    autoTrading: 'AI Auto-Trading',
    copilotTips: 'AI Copilot Audit Tips',
    parameters: 'Strategy Parameters',
    codeEditor: 'Algorithm Code (JavaScript Sandbox)',

    sessions: 'Sessions',
    sessionManagerTitle: 'Backtest Session Manager (Database)',
    sessionManagerDesc: 'Session progress, trade history, drawings, and analytics are permanently saved in Database.',
    createNewSession: 'New Session',
    sessionList: 'Session List',
    sessionName: 'Session Name',
    initialBalance: 'Initial Balance',
    finalBalance: 'Final Balance',
    currentEquity: 'Current Equity',
    resumeSession: 'Resume',
    completeSession: 'Complete',
    deleteSession: 'Delete',
    runningStatus: 'ACTIVE',
    completedStatus: 'COMPLETED',
    totalSessions: 'Total Sessions',
    confirmDeleteSession: 'Are you sure you want to delete this backtest session from database?',

    signInTitle: 'Sign In to Account',
    signUpTitle: 'Create New Account',
    signInDesc: 'Access multi-asset replay engine and AI Copilot',
    signUpDesc: 'Start your institutional backtesting journey with precision data',
    email: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    orContinueWith: 'Or continue with SSO',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    googleSSO: 'Google Account',
    githubSSO: 'GitHub Account',
    appleSSO: 'Apple ID'
  },
  ja: {
    appTitle: 'Quant Backtest Pro',
    appSubtitle: 'マルチアセット対応の高速バックテスト＆リプレイプラットフォーム',
    instruments: '銘柄',
    timeframe: '時間足',
    replay: 'リプレイ',
    
    orderEntry: '新規注文',
    aiStudio: 'AI戦略スタジオ',
    analytics: '分析レポート',
    dataImport: 'データ管理',
    shortcuts: 'ショートカット',
    login: 'ログイン',
    signup: '新規登録',
    profile: 'プロフィール',
    logout: 'ログアウト',
    proBadge: 'PRO VIP',

    play: '再生',
    pause: '一時停止',
    stepForward: '次へ (+1)',
    stepBackward: '前へ (-1)',
    reset: 'リセット',
    speed: '速度',
    candlesCount: '本',

    quickTrade: 'クイック注文',
    buy: '買い (BUY)',
    sell: '売り (SELL)',
    lotSize: 'ロット数',
    autoSL: 'SL',
    autoTP: 'TP',
    pips: 'p',

    openPositions: '保有ポジション',
    pendingOrders: '未約定注文',
    history: '取引履歴',
    strategyLogs: 'AI戦略ログ',
    closeAll: '全決済',
    noOpenPositions: '保有ポジションがありません。クイック注文でエントリーしてください。',
    noPendingOrders: '未約定注文はありません。',
    noHistory: '決済履歴はまだありません。',
    symbol: '銘柄',
    side: '売買',
    lot: '数量',
    entryPrice: '約定価格',
    currentPrice: '現在価格',
    floatingPnL: '評価損益',
    realizedPnL: '確定損益',
    actions: '操作',
    setBE: '同値撤退',
    close50: '50%決済',
    editSLTP: 'SL/TP変更',
    closePosition: 'ポジション決済',
    tagStrategy: '戦略タグ (Setup)',
    psychologyNote: '心理メモ',
    saveChanges: '変更を保存',
    cancel: 'キャンセル',

    analyticsTitle: '定量的パフォーマンス分析＆リスク指標',
    overviewTab: '概要・主要指標',
    monteCarloTab: 'モンテカルロ分析 (1,000回試行)',
    heatmapTab: '曜日・時間帯別損益ヒートマップ',
    exportCSV: 'CSVエクスポート',
    equityGrowth: '資産推移曲線 (Equity / Balance)',
    netProfit: '純利益',
    winRate: '勝率',
    profitFactor: 'プロフィットファクター',
    maxDrawdown: '最大ドローダウン',
    totalTrades: '総取引数',
    grossProfit: '総利益',
    grossLoss: '総損失',
    avgWin: '平均利益',
    avgLoss: '平均損失',
    riskReward: 'リスクリワード比',
    expectedPayoff: '期待値',
    sharpeRatio: 'シャープレシオ',
    sortinoRatio: 'ソルティノレシオ',
    consecutiveWins: '最大連勝数',
    consecutiveLosses: '最大連敗数',
    monteCarloDesc: 'モンテカルロシミュレーションは、取引結果を1,000回ランダムに入れ替え、最悪の相場シナリオにおける耐性をストレステストします。',
    medianProfit: '利益中央値',
    worstCaseDD: '最悪シナリオ最大DD',
    percentile95DD: '95%信頼区間最大DD',
    riskOfRuin: '破産確率 (>50% DD)',
    heatmapDesc: '時間帯 (UTC) および曜日別の損益・勝率分布:',

    aiStudioTitle: 'AI戦略スタジオ＆実行サンドボックス',
    promptPlaceholder: '取引戦略を自然言語で記述してください (例: EMA20とEMA50のゴールデンクロス、RSI 35以下の押し目買い)...',
    generateStrategy: 'AI戦略コード生成',
    generating: 'アルゴリズム生成中...',
    autoTrading: 'AI自動売買',
    copilotTips: 'AIコパイロット診断',
    parameters: '戦略パラメータ',
    codeEditor: 'アルゴリズムコード (JavaScript)',

    sessions: 'セッション',
    sessionManagerTitle: 'バックテストセッション管理 (Database)',
    sessionManagerDesc: 'セッション進捗、取引履歴、描画、分析結果はデータベースに永続保存されます。',
    createNewSession: '新規セッション作成',
    sessionList: 'セッション一覧',
    sessionName: 'セッション名',
    initialBalance: '初期資金',
    finalBalance: '最終残高',
    currentEquity: '現在の有効証拠金',
    resumeSession: '再開',
    completeSession: '完了',
    deleteSession: '削除',
    runningStatus: '実行中',
    completedStatus: '完了済み',
    totalSessions: '総セッション数',
    confirmDeleteSession: 'このバックテストセッションをデータベースから削除してもよろしいですか？',

    signInTitle: 'アカウントログイン',
    signUpTitle: '新規アカウント作成',
    signInDesc: '高精度リプレイエンジンとAIコパイロットへアクセス',
    signUpDesc: '機関投資家レベルのデータでトレード検証を開始しましょう',
    email: 'メールアドレス',
    password: 'パスワード',
    fullName: 'お名前',
    rememberMe: 'ログイン状態を保持',
    forgotPassword: 'パスワードをお忘れですか？',
    orContinueWith: 'またはSSOでログイン',
    noAccount: 'アカウントをお持ちでないですか？',
    haveAccount: '既にアカウントをお持ちですか？',
    googleSSO: 'Google アカウント',
    githubSSO: 'GitHub アカウント',
    appleSSO: 'Apple ID'
  },
  zh: {
    appTitle: 'Quant Backtest Pro',
    appSubtitle: '基于Web的专业多资产外汇与加密货币回测平台',
    instruments: '交易品种',
    timeframe: '时间周期',
    replay: 'K线回放',
    
    orderEntry: '开仓下单',
    aiStudio: 'AI量化策略工作室',
    analytics: '量化分析报告',
    dataImport: '数据管理',
    shortcuts: '快捷键',
    login: '登录',
    signup: '注册',
    profile: '个人中心',
    logout: '退出登录',
    proBadge: 'PRO VIP',

    play: '播放',
    pause: '暂停',
    stepForward: '单步前进 (+1)',
    stepBackward: '单步后退 (-1)',
    reset: '重置',
    speed: '回放速度',
    candlesCount: '根K线',

    quickTrade: '快速交易',
    buy: '买入 (BUY)',
    sell: '卖出 (SELL)',
    lotSize: '交易手数',
    autoSL: '止损',
    autoTP: '止盈',
    pips: '点',

    openPositions: '持仓仓位',
    pendingOrders: '挂单列表',
    history: '成交历史',
    strategyLogs: 'AI策略日志',
    closeAll: '全平',
    noOpenPositions: '当前无持仓。请使用快速交易 BUY / SELL 进场。',
    noPendingOrders: '暂无挂单。',
    noHistory: '暂无历史平仓记录。',
    symbol: '品种',
    side: '方向',
    lot: '手数',
    entryPrice: '开仓价',
    currentPrice: '现价',
    floatingPnL: '浮动盈亏',
    realizedPnL: '净平仓盈亏',
    actions: '操作',
    setBE: '保本(BE)',
    close50: '平仓50%',
    editSLTP: '修改止损止盈',
    closePosition: '平仓',
    tagStrategy: '策略标签 (Setup)',
    psychologyNote: '交易心理笔记',
    saveChanges: '保存更改',
    cancel: '取消',

    analyticsTitle: '量化绩效统计与风险评估 (Quantitative Analytics)',
    overviewTab: '概览与核心指标',
    monteCarloTab: '蒙特卡洛模拟 (1,000次随机迭代)',
    heatmapTab: '时段与星期盈亏热力图',
    exportCSV: '导出历史 CSV',
    equityGrowth: '资金增长曲线 (Equity / Balance Growth)',
    netProfit: '净利润',
    winRate: '胜率 (Win Rate)',
    profitFactor: '获利因子 (Profit Factor)',
    maxDrawdown: '最大回撤 (Max DD)',
    totalTrades: '总交易次数',
    grossProfit: '总盈利 (Gross Profit)',
    grossLoss: '总亏损 (Gross Loss)',
    avgWin: '平均盈利',
    avgLoss: '平均亏损',
    riskReward: '盈亏比 (Risk : Reward)',
    expectedPayoff: '期望收益',
    sharpeRatio: '夏普比率 (Sharpe Ratio)',
    sortinoRatio: '索提诺比率 (Sortino Ratio)',
    consecutiveWins: '最大连胜次数',
    consecutiveLosses: '最大连亏次数',
    monteCarloDesc: '蒙特卡洛模拟将已执行交易的顺序随机打乱1,000次，以压力测试策略在极端不利市场条件下的抗风险能力。',
    medianProfit: '利润中位数 (Median)',
    worstCaseDD: '最差情景最大回撤',
    percentile95DD: '95%置信度最大回撤',
    riskOfRuin: '爆仓风险概率 (>50% DD)',
    heatmapDesc: '交易时段 (UTC) 与星期维度的盈亏与胜率分布:',

    aiStudioTitle: 'AI策略工作室与沙盒执行引擎',
    promptPlaceholder: '用自然语言描述您的交易策略 (例如：EMA 20 上穿 EMA 50 结合 RSI < 35 回踩进场)...',
    generateStrategy: '生成 AI 策略',
    generating: '正在生成算法代码...',
    autoTrading: 'AI自动跟单交易',
    copilotTips: 'AI Copilot 智能诊断建议',
    parameters: '策略参数调整',
    codeEditor: '算法源代码 (JavaScript 沙盒)',

    sessions: '交易会话',
    sessionManagerTitle: '回测会话管理 (Database)',
    sessionManagerDesc: '会话进度、交易历史、图表标注和量化分析均永久保存在数据库中。',
    createNewSession: '创建新会话',
    sessionList: '会话列表',
    sessionName: '会话名称',
    initialBalance: '初始资金',
    finalBalance: '最终余额',
    currentEquity: '当前净值',
    resumeSession: '继续',
    completeSession: '完成',
    deleteSession: '删除',
    runningStatus: '进行中',
    completedStatus: '已完成',
    totalSessions: '总会话数',
    confirmDeleteSession: '您确定要从数据库中删除此回测会话吗？',

    signInTitle: '账户登录',
    signUpTitle: '创建新账户',
    signInDesc: '即刻访问多资产K线回放系统与AI Copilot',
    signUpDesc: '开启机构级精准历史数据回测之旅',
    email: '电子邮箱',
    password: '密码',
    fullName: '姓名',
    rememberMe: '记住我',
    forgotPassword: '忘记密码？',
    orContinueWith: '或通过 SSO 快速登录',
    noAccount: '还没有账户？',
    haveAccount: '已有账户？',
    googleSSO: 'Google 账号',
    githubSSO: 'GitHub 账号',
    appleSSO: 'Apple ID'
  }
};
