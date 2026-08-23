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
  portfolioTab: string;
  comparisonTab: string;
  selectSessionPrompt: string;
  currentActiveSessionLabel: string;
  compareSessionsTitle: string;
  selectSessionsToCompare: string;
  bestPerformerBadge: string;
  exportCSV: string;
  saveSnapshot: string;
  snapshotSaved: string;
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
  studioAndSandboxTab: string;
  describeStrategyLabel: string;
  quickPromptsLabel: string;
  selectedLabel: string;
  strategyNamePlaceholder: string;
  promptPlaceholder: string;
  generateStrategy: string;
  generating: string;
  autoTrading: string;
  copilotTips: string;
  parameters: string;
  codeEditor: string;
  myStrategiesTab: string;
  templatesTab: string;
  llmConfigTab: string;
  saveToDB: string;
  savedToDBSuccess: string;
  activateAndResume: string;

  // Order Entry Modal
  activationPrice: string;
  riskSL: string;
  rewardTP: string;
  expectedFillPrice: string;
  marginRequired: string;
  trailingStopLabel: string;
  enterPips: string;
  enterPrice: string;

  // Data Manager Modal
  dataManagerTitle: string;
  autoCrawlTab: string;
  uploadFileTab: string;
  sampleDataTab: string;
  autoCrawlDesc: string;
  intervalLabel: string;
  startCrawlBtn: string;
  crawlingBtn: string;
  dragDropCSV: string;
  parsingFile: string;
  supportedFormat: string;

  // Shortcuts Modal
  keyboardShortcutsTitle: string;
  keyboardShortcutsDesc: string;

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
  tradesCountLabel: string;
  drawingsCountLabel: string;
  noSessionsFound: string;

  // Prop Firm Shield
  propFirmShieldTitle: string;
  dailyLossLabel: string;
  maxDrawdownLabel: string;
  profitTargetLabel: string;
  passChallengeBadge: string;
  violatedBadge: string;

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

  // Global & Symbol Search & Profile
  searchSymbolPlaceholder: string;
  noSymbolsFound: string;
  leverageLabel: string;
  spreadLabel: string;
  demoBalance: string;
  completedBacktests: string;
  savedAIStrategies: string;
  vipPerksTitle: string;
  closeModalBtn: string;
  refreshBtn: string;
  processingBtn: string;
  databasePortfolioTitle: string;
  databasePortfolioDesc: string;
  totalSessionsCount: string;
  totalTradesAll: string;
  portfolioWinRate: string;
  portfolioNetProfit: string;
  sessionHistoryTitle: string;
  clickToViewReport: string;
  viewReportBadge: string;
  capitalLabel: string;
  savedSessionsInDB: string;
  noSessionsMatch: string;
  searchSessionsPlaceholder: string;
  selectAtLeastOneSession: string;
  metricCriteriaHeader: string;
  closedTradesCount: string;
  llmConfigTitle: string;
  llmProviderLabel: string;
  llmBaseUrlLabel: string;
  llmModelLabel: string;
  llmApiKeyLabel: string;
  llmTestConnectionBtn: string;
  llmCustomEndpointDesc: string;
  llmTemperatureLabel: string;
  quickFillCustomBtn: string;
  customModelInputPlaceholder: string;
  exportBotBtn: string;
  exportBotModalTitle: string;
  importStrategyBtn: string;
  importStrategySuccess: string;
  importStrategyError: string;
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
    portfolioTab: 'Danh Mục Đa Phiên (DB)',
    comparisonTab: 'So Sánh Các Phiên',
    selectSessionPrompt: 'Chọn phiên cần xem:',
    currentActiveSessionLabel: 'Phiên Đang Chạy (Active)',
    compareSessionsTitle: 'Ma Trận So Sánh Đa Phiên',
    selectSessionsToCompare: 'Chọn các phiên để so sánh hiệu suất:',
    bestPerformerBadge: 'Hiệu Quả Cao Nhất 🏆',
    exportCSV: 'Xuất file CSV',
    saveSnapshot: 'Lưu Snapshot',
    snapshotSaved: 'Đã lưu DB ✓',
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
    studioAndSandboxTab: 'Studio & Sandbox',
    describeStrategyLabel: 'Mô tả chiến lược bằng ngôn ngữ tự nhiên:',
    quickPromptsLabel: 'Gợi ý nhanh:',
    selectedLabel: 'Đang chọn',
    strategyNamePlaceholder: 'Tên chiến lược',
    promptPlaceholder: 'Mô tả chiến lược của bạn (VD: Chiến lược EMA 20 cắt EMA 50 kết hợp RSI < 35)...',
    generateStrategy: 'Tạo Chiến Lược AI',
    generating: 'Đang khởi tạo thuật toán...',
    autoTrading: 'Tự động giao dịch AI',
    copilotTips: 'AI Copilot Audit Tips',
    parameters: 'Tham số Chiến lược',
    codeEditor: 'Mã nguồn Thuật toán (JavaScript Sandbox)',
    myStrategiesTab: 'Chiến Lược Của Tôi (DB)',
    templatesTab: 'Mẫu Thuật Toán',
    llmConfigTab: 'Cấu Hình LLM',
    saveToDB: 'Lưu vào DB',
    savedToDBSuccess: 'Đã lưu vào DB thành công!',
    activateAndResume: 'Kích Hoạt & Chạy Tiếp',

    activationPrice: 'Giá kích hoạt',
    riskSL: 'Rủi ro (Risk SL)',
    rewardTP: 'Lợi nhuận (Reward TP)',
    expectedFillPrice: 'Giá khớp dự kiến',
    marginRequired: 'Ký quỹ (Margin)',
    trailingStopLabel: 'Trailing Stop (Pips)',
    enterPips: 'Nhập Pips',
    enterPrice: 'Nhập Giá',

    dataManagerTitle: 'Quản lý, Import & Tự động Crawl Dữ liệu Lịch sử',
    autoCrawlTab: 'Tự động Crawl Online (Live REST API)',
    uploadFileTab: 'Nạp File CSV / TXT',
    sampleDataTab: 'Dữ liệu Mẫu (GBM Presets)',
    autoCrawlDesc: '🌐 Hệ thống Tự động Crawl Dữ liệu Trực tuyến cho phép kéo trực tiếp hàng ngàn nến lịch sử thực tế từ các sàn giao dịch hàng đầu thế giới (Binance REST API) mà không cần bất kỳ API key nào!',
    intervalLabel: 'Khung Nến (Interval)',
    startCrawlBtn: 'Bắt đầu Crawl & Nạp vào Chart',
    crawlingBtn: 'Đang Crawl Dữ liệu...',
    dragDropCSV: 'Kéo thả file CSV vào đây hoặc click để chọn file',
    parsingFile: 'Đang đọc và phân tích file...',
    supportedFormat: 'Hỗ trợ định dạng: Date, Time, Open, High, Low, Close, Volume (Tự động nhận diện)',

    keyboardShortcutsTitle: 'Phím Tắt Thao Tác Nhanh (Keyboard Shortcuts)',
    keyboardShortcutsDesc: 'Nhấn bất kỳ phím nào để tương tác trực tiếp trên giao diện Backtest.',

    sessions: 'Phiên',
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
    tradesCountLabel: 'lệnh',
    drawingsCountLabel: 'bản vẽ',
    noSessionsFound: 'Chưa có phiên backtest nào được lưu trong Database. Bấm "+ Tạo phiên mới" để bắt đầu!',

    propFirmShieldTitle: 'Prop Firm Shield',
    dailyLossLabel: 'Sụt giảm ngày',
    maxDrawdownLabel: 'Sụt giảm tối đa',
    profitTargetLabel: 'Mục tiêu lợi nhuận',
    passChallengeBadge: 'PASS CHALLENGE 🎉',
    violatedBadge: 'VIOLATED ⛔',

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
    appleSSO: 'Apple ID',

    searchSymbolPlaceholder: 'Tìm kiếm mã tài sản (ví dụ: XAUUSD, BTC, EURUSD...)',
    noSymbolsFound: 'Không tìm thấy tài sản nào phù hợp với từ khóa.',
    leverageLabel: 'Đòn bẩy',
    spreadLabel: 'Spread',
    demoBalance: 'Số dư Demo',
    completedBacktests: 'Số phiên Backtest',
    savedAIStrategies: 'Chiến lược AI',
    vipPerksTitle: 'Đặc quyền Gói VIP',
    closeModalBtn: 'Đóng',
    refreshBtn: 'Làm mới',
    processingBtn: 'Đang xử lý...',
    databasePortfolioTitle: 'Hiệu Suất Tổng Hợp Danh Mục (Database Portfolio)',
    databasePortfolioDesc: 'Thống kê tổng hợp toàn bộ các phiên backtest đã lưu trong cơ sở dữ liệu.',
    totalSessionsCount: 'Tổng số phiên',
    totalTradesAll: 'Tổng số lệnh toàn bộ',
    portfolioWinRate: 'Win Rate Danh mục',
    portfolioNetProfit: 'Tổng PnL Danh mục',
    sessionHistoryTitle: 'Lịch Sử Các Phiên Backtest',
    clickToViewReport: 'Bấm vào phiên để xem báo cáo chi tiết',
    viewReportBadge: 'Xem report →',
    capitalLabel: 'Vốn',
    savedSessionsInDB: 'Phiên Đã Lưu Trong Database',
    noSessionsMatch: 'Không tìm thấy phiên phù hợp',
    searchSessionsPlaceholder: 'Tìm kiếm phiên theo tên hoặc mã...',
    selectAtLeastOneSession: 'Chọn ít nhất 1 phiên ở trên để xem bảng so sánh chi tiết.',
    metricCriteriaHeader: 'Chỉ Số / Tiêu Chí Đánh Giá',
    closedTradesCount: 'lệnh đã chốt',
    llmConfigTitle: 'Cấu Hình Nhà Cung Cấp Trí Tuệ Nhân Tạo (Multi-LLM)',
    llmProviderLabel: 'Nhà cung cấp AI:',
    llmBaseUrlLabel: 'Base URL (API Endpoint):',
    llmModelLabel: 'Mã Model / ID:',
    llmApiKeyLabel: 'API Key:',
    llmTestConnectionBtn: 'Kiểm Tra Kết Nối',
    llmCustomEndpointDesc: 'Hỗ trợ OpenAI format, Proxy Tunnel, OpenRouter, Groq, LiteLLM, vLLM...',
    llmTemperatureLabel: 'Độ sáng tạo (Temperature):',
    quickFillCustomBtn: 'Điền cấu hình mẫu của bạn (Tunnel & Gemini Agent)',
    customModelInputPlaceholder: 'Nhập hoặc chọn mã model (ví dụ: ag/gemini-pro-agent, gpt-4o...)',
    exportBotBtn: 'Xuất Bot / Code',
    exportBotModalTitle: 'Xuất Chiến Lược Sang Bot Giao Dịch Đa Nền Tảng',
    importStrategyBtn: 'Nhập Chiến Lược (.json/.js)',
    importStrategySuccess: 'Đã nạp chiến lược thành công!',
    importStrategyError: 'Lỗi định dạng file chiến lược.'
  },
  en: {
    appTitle: 'Quant Backtest Pro',
    appSubtitle: 'Web-based Multi-Asset Forex & Crypto Replay Platform',
    instruments: 'Instruments',
    timeframe: 'Timeframe',
    replay: 'Replay',
    
    orderEntry: 'New Order',
    aiStudio: 'AI Studio',
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
    portfolioTab: 'Database Portfolio',
    comparisonTab: 'Session Comparison',
    selectSessionPrompt: 'Select session:',
    currentActiveSessionLabel: 'Active Replay Session',
    compareSessionsTitle: 'Multi-Session Comparison Matrix',
    selectSessionsToCompare: 'Select sessions to compare performance:',
    bestPerformerBadge: 'Top Performer 🏆',
    exportCSV: 'Export CSV History',
    saveSnapshot: 'Save Snapshot',
    snapshotSaved: 'Saved to DB ✓',
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
    studioAndSandboxTab: 'Studio & Sandbox',
    describeStrategyLabel: 'Describe strategy in natural language:',
    quickPromptsLabel: 'Quick Prompts:',
    selectedLabel: 'Selected',
    strategyNamePlaceholder: 'Strategy Name',
    promptPlaceholder: 'Describe your trading strategy (e.g. EMA 20 crossing EMA 50 with RSI < 35 pullback)...',
    generateStrategy: 'Generate AI Strategy',
    generating: 'Synthesizing algorithm...',
    autoTrading: 'AI Auto-Trading',
    copilotTips: 'AI Copilot Audit Tips',
    parameters: 'Strategy Parameters',
    codeEditor: 'Algorithm Code (JavaScript Sandbox)',
    myStrategiesTab: 'My Strategies (DB)',
    templatesTab: 'Strategy Templates',
    llmConfigTab: 'LLM Config',
    saveToDB: 'Save to DB',
    savedToDBSuccess: 'Saved to DB successfully!',
    activateAndResume: 'Activate & Run',

    activationPrice: 'Trigger Price',
    riskSL: 'Risk (SL)',
    rewardTP: 'Reward (TP)',
    expectedFillPrice: 'Expected Fill Price',
    marginRequired: 'Margin Required',
    trailingStopLabel: 'Trailing Stop (Pips)',
    enterPips: 'Enter Pips',
    enterPrice: 'Enter Price',

    dataManagerTitle: 'Historical Data Manager, Import & Online Crawler',
    autoCrawlTab: 'Auto Crawl Online (Live REST API)',
    uploadFileTab: 'Upload CSV / TXT File',
    sampleDataTab: 'Sample Data (GBM Presets)',
    autoCrawlDesc: '🌐 Automated Online Data Crawler pulls thousands of real historical candles directly from world-class exchanges (Binance REST API) without requiring any API key!',
    intervalLabel: 'Candle Interval',
    startCrawlBtn: 'Start Crawl & Load into Chart',
    crawlingBtn: 'Crawling Live Data...',
    dragDropCSV: 'Drag & drop CSV file here or click to browse',
    parsingFile: 'Parsing and validating file...',
    supportedFormat: 'Supported format: Date, Time, Open, High, Low, Close, Volume (Auto-detected)',

    keyboardShortcutsTitle: 'Quick Keyboard Shortcuts',
    keyboardShortcutsDesc: 'Press any key to interact directly with the Backtest platform.',

    sessions: 'Sessions',
    sessionManagerTitle: 'Backtest Session Manager (Database)',
    sessionManagerDesc: 'Session progress, trade history, drawings, and analytics are permanently persisted in the SQLite Database.',
    createNewSession: 'Create New Session',
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
    confirmDeleteSession: 'Are you sure you want to delete this backtest session from the database?',
    tradesCountLabel: 'trades',
    drawingsCountLabel: 'drawings',
    noSessionsFound: 'No backtest sessions found in the database. Click "+ Create New Session" to begin!',

    propFirmShieldTitle: 'Prop Firm Shield',
    dailyLossLabel: 'Daily Loss Limit',
    maxDrawdownLabel: 'Max Drawdown Limit',
    profitTargetLabel: 'Profit Target',
    passChallengeBadge: 'PASS CHALLENGE 🎉',
    violatedBadge: 'VIOLATED ⛔',

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
    appleSSO: 'Apple ID',

    searchSymbolPlaceholder: 'Search symbols (e.g. XAUUSD, BTC, EURUSD...)',
    noSymbolsFound: 'No symbols found matching your search.',
    leverageLabel: 'Leverage',
    spreadLabel: 'Spread',
    demoBalance: 'Demo Balance',
    completedBacktests: 'Completed Backtests',
    savedAIStrategies: 'AI Strategies',
    vipPerksTitle: 'VIP Tier Privileges',
    closeModalBtn: 'Close',
    refreshBtn: 'Refresh',
    processingBtn: 'Processing...',
    databasePortfolioTitle: 'Aggregated Portfolio Performance (Database)',
    databasePortfolioDesc: 'Aggregated metrics across all backtest sessions stored in the SQLite database.',
    totalSessionsCount: 'Total Sessions',
    totalTradesAll: 'Total Trades Executed',
    portfolioWinRate: 'Portfolio Win Rate',
    portfolioNetProfit: 'Portfolio Net PnL',
    sessionHistoryTitle: 'Backtest Sessions History',
    clickToViewReport: 'Click session to inspect report',
    viewReportBadge: 'View Report →',
    capitalLabel: 'Capital',
    savedSessionsInDB: 'Sessions Saved in Database',
    noSessionsMatch: 'No matching sessions found',
    searchSessionsPlaceholder: 'Search sessions by name or symbol...',
    selectAtLeastOneSession: 'Select at least 1 session above to view the detailed comparison matrix.',
    metricCriteriaHeader: 'Metric / Evaluation Criterion',
    closedTradesCount: 'closed trades',
    llmConfigTitle: 'Artificial Intelligence Provider Configuration (Multi-LLM)',
    llmProviderLabel: 'AI Provider:',
    llmBaseUrlLabel: 'Base URL (API Endpoint):',
    llmModelLabel: 'Model ID / Name:',
    llmApiKeyLabel: 'API Key:',
    llmTestConnectionBtn: 'Test Connection',
    llmCustomEndpointDesc: 'Supports OpenAI format, Reverse Proxies, OpenRouter, Groq, LiteLLM, vLLM...',
    llmTemperatureLabel: 'Temperature (Creativity):',
    quickFillCustomBtn: 'Quick Fill My Preset (Tunnel & Gemini Agent)',
    customModelInputPlaceholder: 'Enter or choose model ID (e.g. ag/gemini-pro-agent, gpt-4o...)',
    exportBotBtn: 'Export Bot / Code',
    exportBotModalTitle: 'Export Strategy to Trading Bot Hub',
    importStrategyBtn: 'Import Strategy (.json/.js)',
    importStrategySuccess: 'Strategy imported successfully!',
    importStrategyError: 'Invalid strategy file format.'
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
    portfolioTab: 'DBポートフォリオ',
    comparisonTab: 'セッション比較',
    selectSessionPrompt: 'セッション選択:',
    currentActiveSessionLabel: 'アクティブセッション',
    compareSessionsTitle: 'マルチセッション比較マトリクス',
    selectSessionsToCompare: '比較するセッションを選択:',
    bestPerformerBadge: '最高パフォーマンス 🏆',
    exportCSV: 'CSVエクスポート',
    saveSnapshot: 'スナップショット保存',
    snapshotSaved: 'DB保存完了 ✓',
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
    studioAndSandboxTab: 'スタジオ＆サンドボックス',
    describeStrategyLabel: '自然言語で戦略を記述:',
    quickPromptsLabel: 'クイック提案:',
    selectedLabel: '選択中',
    strategyNamePlaceholder: '戦略名',
    promptPlaceholder: '取引戦略を自然言語で記述してください (例: EMA20とEMA50のゴールデンクロス、RSI 35以下の押し目買い)...',
    generateStrategy: 'AI戦略コード生成',
    generating: 'アルゴリズム生成中...',
    autoTrading: 'AI自動売買',
    copilotTips: 'AIコパイロット診断',
    parameters: '戦略パラメータ',
    codeEditor: 'アルゴリズムコード (JavaScript)',
    myStrategiesTab: 'マイストラテジー (DB)',
    templatesTab: 'テンプレート',
    llmConfigTab: 'LLM設定',
    saveToDB: 'DBに保存',
    savedToDBSuccess: 'DBに正常に保存されました！',
    activateAndResume: '有効化＆実行',

    activationPrice: '発注トリガー価格',
    riskSL: 'リスク (SL)',
    rewardTP: 'リワード (TP)',
    expectedFillPrice: '予想約定価格',
    marginRequired: '必要証拠金',
    trailingStopLabel: 'トレーリングストップ (Pips)',
    enterPips: 'Pips入力',
    enterPrice: '価格入力',

    dataManagerTitle: 'ヒストリカルデータ管理・CSVインポート＆自動クローラー',
    autoCrawlTab: 'オンライン自動クロール (Binance API)',
    uploadFileTab: 'CSV / TXT ファイルインポート',
    sampleDataTab: 'サンプルデータ (GBM)',
    autoCrawlDesc: '🌐 オンライン自動クローラーにより、APIキーなしでBinance等の取引所から実際の過去ティック・K線データを直接取得できます。',
    intervalLabel: '時間軸 (Interval)',
    startCrawlBtn: 'クロール開始＆チャートに適用',
    crawlingBtn: 'データ取得中...',
    dragDropCSV: 'CSVファイルをここにドラッグ＆ドロップ',
    parsingFile: 'ファイルを解析中...',
    supportedFormat: '対応形式: Date, Time, Open, High, Low, Close, Volume (自動判定)',

    keyboardShortcutsTitle: 'キーボードショートカット',
    keyboardShortcutsDesc: 'ショートカットキーで快適なバックテスト操作が可能です。',

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
    tradesCountLabel: '件の取引',
    drawingsCountLabel: '個の描画',
    noSessionsFound: 'データベースに保存されたセッションはありません。新規作成してください。',

    propFirmShieldTitle: 'プロップシールド',
    dailyLossLabel: '日次ドローダウン',
    maxDrawdownLabel: '最大ドローダウン',
    profitTargetLabel: '目標利益',
    passChallengeBadge: '合格 🎉',
    violatedBadge: '失格 ⛔',

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
    appleSSO: 'Apple ID',

    searchSymbolPlaceholder: '銘柄を検索 (例: XAUUSD, BTC, EURUSD...)',
    noSymbolsFound: '該当する銘柄が見つかりませんでした。',
    leverageLabel: 'レバレッジ',
    spreadLabel: 'スプレッド',
    demoBalance: 'デモ残高',
    completedBacktests: '完了したバックテスト',
    savedAIStrategies: 'AIストラテジー',
    vipPerksTitle: 'VIP特典＆プロ機能',
    closeModalBtn: '閉じる',
    refreshBtn: '更新',
    processingBtn: '処理中...',
    databasePortfolioTitle: '統合ポートフォリオパフォーマンス (Database)',
    databasePortfolioDesc: 'データベースに保存されたすべてのバックテストセッションの統計集計。',
    totalSessionsCount: '総セッション数',
    totalTradesAll: '総取引数 (全期間)',
    portfolioWinRate: 'ポートフォリオ勝率',
    portfolioNetProfit: 'ポートフォリオ純損益',
    sessionHistoryTitle: 'バックテスト履歴一覧',
    clickToViewReport: 'クリックして詳細レポートを表示',
    viewReportBadge: 'レポートを見る →',
    capitalLabel: '初期資金',
    savedSessionsInDB: '保存済みセッション (DB)',
    noSessionsMatch: '一致するセッションがありません',
    searchSessionsPlaceholder: 'セッション名または銘柄で検索...',
    selectAtLeastOneSession: '詳細な比較マトリクスを表示するには、上記から1つ以上のセッションを選択してください。',
    metricCriteriaHeader: '評価指標 / 項目',
    closedTradesCount: '件の決済済み取引',
    llmConfigTitle: 'AIプロバイダー設定 (Multi-LLM)',
    llmProviderLabel: 'AIプロバイダー:',
    llmBaseUrlLabel: 'Base URL (API エンドポイント):',
    llmModelLabel: 'モデルID / モデル名:',
    llmApiKeyLabel: 'APIキー:',
    llmTestConnectionBtn: '接続テスト',
    llmCustomEndpointDesc: 'OpenAI形式、プロキシトンネル、OpenRouter、Groq、LiteLLMに対応...',
    llmTemperatureLabel: 'Temperature (創造性):',
    quickFillCustomBtn: 'カスタムプリセットを自動入力 (Tunnel & Gemini Agent)',
    customModelInputPlaceholder: 'モデルIDを入力または選択 (例: ag/gemini-pro-agent, gpt-4o...)',
    exportBotBtn: 'Bot / コードを出力',
    exportBotModalTitle: 'マルチプラットフォーム自動売買Bot出力ハブ',
    importStrategyBtn: 'ストラテジーをインポート (.json/.js)',
    importStrategySuccess: 'ストラテジーが正常に読み込まれました！',
    importStrategyError: 'ストラテジーファイルの形式が無効です。'
  },
  zh: {
    appTitle: 'Quant Backtest Pro',
    appSubtitle: '基于Web的专业多资产外汇与加密货币回测平台',
    instruments: '交易品种',
    timeframe: '时间周期',
    replay: 'K线回放',
    
    orderEntry: '开仓下单',
    aiStudio: 'AI Studio',
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
    portfolioTab: '多会话总投资组合 (DB)',
    comparisonTab: '会话对比分析',
    selectSessionPrompt: '选择查看会话:',
    currentActiveSessionLabel: '当前进行中会话',
    compareSessionsTitle: '多会话对比分析矩阵',
    selectSessionsToCompare: '选择要对比的会话:',
    bestPerformerBadge: '表现最佳 🏆',
    exportCSV: '导出历史 CSV',
    saveSnapshot: '保存快照',
    snapshotSaved: '已保存至DB ✓',
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
    studioAndSandboxTab: '工作室与沙盒',
    describeStrategyLabel: '用自然语言描述您的策略:',
    quickPromptsLabel: '快捷提示词:',
    selectedLabel: '当前选择',
    strategyNamePlaceholder: '策略名称',
    promptPlaceholder: '用自然语言描述您的交易策略 (例如：EMA 20 上穿 EMA 50 结合 RSI < 35 回踩进场)...',
    generateStrategy: '生成 AI 策略',
    generating: '正在生成算法代码...',
    autoTrading: 'AI自动跟单交易',
    copilotTips: 'AI Copilot 智能诊断建议',
    parameters: '策略参数调整',
    codeEditor: '算法源代码 (JavaScript 沙盒)',
    myStrategiesTab: '我的策略库 (DB)',
    templatesTab: '策略模板',
    llmConfigTab: '大模型配置',
    saveToDB: '保存到DB',
    savedToDBSuccess: '已成功保存到数据库！',
    activateAndResume: '激活并运行',

    activationPrice: '触发挂单价',
    riskSL: '止损风险 (Risk SL)',
    rewardTP: '止盈回报 (Reward TP)',
    expectedFillPrice: '预计成交价',
    marginRequired: '所需保证金',
    trailingStopLabel: '追踪止损 (Pips)',
    enterPips: '输入点数',
    enterPrice: '输入价格',

    dataManagerTitle: '历史数据管理、导入与在线爬虫',
    autoCrawlTab: '在线自动抓取 (Binance REST API)',
    uploadFileTab: '上传 CSV / TXT 文件',
    sampleDataTab: '示例数据 (GBM Presets)',
    autoCrawlDesc: '🌐 在线自动抓取系统无需任何 API Key，即可直接从全球顶级交易所拉取数千根真实历史K线！',
    intervalLabel: 'K线周期 (Interval)',
    startCrawlBtn: '开始抓取并载入图表',
    crawlingBtn: '正在抓取数据...',
    dragDropCSV: '拖拽 CSV 文件至此处，或点击浏览',
    parsingFile: '正在解析文件...',
    supportedFormat: '支持格式: Date, Time, Open, High, Low, Close, Volume (自动识别)',

    keyboardShortcutsTitle: '常用快捷键指南',
    keyboardShortcutsDesc: '按任意键即可在回测界面上直接进行实时交互。',

    sessions: '会话',
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
    tradesCountLabel: '笔交易',
    drawingsCountLabel: '个标注',
    noSessionsFound: '数据库中尚无回测会话记录。点击“+ 创建新会话”开始！',

    propFirmShieldTitle: '自营交易风控盾',
    dailyLossLabel: '当日亏损限额',
    maxDrawdownLabel: '最大回撤限额',
    profitTargetLabel: '目标盈利',
    passChallengeBadge: '考核通过 🎉',
    violatedBadge: '触及风控 ⛔',

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
    appleSSO: 'Apple ID',

    searchSymbolPlaceholder: '搜索交易品种 (例如：XAUUSD, BTC, EURUSD...)',
    noSymbolsFound: '未找到匹配的交易品种。',
    leverageLabel: '杠杆',
    spreadLabel: '点差',
    demoBalance: '模拟资金余额',
    completedBacktests: '已完成回测数',
    savedAIStrategies: 'AI量化策略',
    vipPerksTitle: 'VIP尊享权益',
    closeModalBtn: '关闭',
    refreshBtn: '刷新',
    processingBtn: '正在处理...',
    databasePortfolioTitle: '组合总体绩效汇总 (Database Portfolio)',
    databasePortfolioDesc: '汇总数据库中已存储的所有回测会话的综合量化指标。',
    totalSessionsCount: '总会话数',
    totalTradesAll: '全部交易总笔数',
    portfolioWinRate: '组合综合胜率',
    portfolioNetProfit: '组合净收益',
    sessionHistoryTitle: '回测会话历史记录',
    clickToViewReport: '点击会话查看详细分析报告',
    viewReportBadge: '查看报告 →',
    capitalLabel: '初始资金',
    savedSessionsInDB: '已保存会话 (Database)',
    noSessionsMatch: '未找到符合条件的会话',
    searchSessionsPlaceholder: '按名称或品种搜索会话...',
    selectAtLeastOneSession: '请在上方选择至少1个会话以查看详细对比矩阵。',
    metricCriteriaHeader: '评估指标 / 维度',
    closedTradesCount: '笔已平仓交易',
    llmConfigTitle: '人工智能提供商配置 (Multi-LLM)',
    llmProviderLabel: 'AI 提供商:',
    llmBaseUrlLabel: 'Base URL (API 端点):',
    llmModelLabel: '模型 ID / 名称:',
    llmApiKeyLabel: 'API Key:',
    llmTestConnectionBtn: '测试连接',
    llmCustomEndpointDesc: '支持 OpenAI 兼容格式、代理隧道、OpenRouter、Groq、LiteLLM 等...',
    llmTemperatureLabel: '采样温度 (Temperature):',
    quickFillCustomBtn: '一键填入您的预设 (Tunnel & Gemini Agent)',
    customModelInputPlaceholder: '输入或选择模型 ID (例如: ag/gemini-pro-agent, gpt-4o...)',
    exportBotBtn: '导出 Bot / 代码',
    exportBotModalTitle: '导出策略至多平台量化交易 Bot',
    importStrategyBtn: '导入策略 (.json/.js)',
    importStrategySuccess: '策略导入成功！',
    importStrategyError: '策略文件格式无效。'
  }
};
