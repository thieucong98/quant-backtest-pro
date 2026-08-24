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
  calendarViewTab: string;
  hourlyMatrixTab: string;
  monthlyProfit: string;
  winningDays: string;
  bestTradingDay: string;
  tradesInMonth: string;
  weekTotal: string;

  // AI Strategy Modal
  aiStudioTitle: string;
  studioAndSandboxTab: string;
  optimizerTab: string;
  optimizerTitle: string;
  optimizerDesc: string;
  slRangeLabel: string;
  tpRangeLabel: string;
  rangeMin: string;
  rangeMax: string;
  rangeStep: string;
  symbolPreset: string;
  runOptimizerBtn: string;
  runningOptimizer: string;
  applyBestConfig: string;
  appliedSuccess: string;
  bestOverallBadge: string;
  bestWinRateBadge: string;
  lowestDDBadge: string;
  bestSharpeBadge: string;
  leaderboardTitle: string;
  heatmapTitle: string;
  heatmapSub: string;
  autoTuneCheckbox: string;
  autoTuneRunning: string;
  totalTested: string;
  executionTime: string;
  sortByLabel: string;
  sparklineEquity: string;
  qualityFilterMinTrades: string;
  qualityFilterProfitable: string;
  botHudTitle: string;
  botStatusWaiting: string;
  botStatusInTrade: string;
  botTodayTrades: string;
  botNetPnL: string;
  strategyRulesTitle: string;
  ruleBuyConditions: string;
  ruleSellConditions: string;
  ruleRiskParams: string;
  quickParamTuning: string;
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
  localLibraryTab: string;
  autoCrawlDesc: string;
  intervalLabel: string;
  startCrawlBtn: string;
  crawlingBtn: string;
  dragDropCSV: string;
  parsingFile: string;
  supportedFormat: string;
  dataHealthTitle: string;
  totalRowsParsed: string;
  validCandlesCount: string;
  duplicatesCleaned: string;
  detectedTimeframe: string;
  dataDateRange: string;
  candleRangeSlice: string;
  sliceAll: string;
  slice200k: string;
  slice100k: string;
  slice50k: string;
  previewDataTable: string;
  loadDatasetBtn: string;
  selectSymbolLabel: string;
  importSuccessCount: string;

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
  selectAll: string;
  deleteSelected: string;
  clearAllSessions: string;
  confirmClearAll: string;
  resetActiveSessionBtn: string;
  guestTradeLimitExceeded: string;

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

  // Chart Visuals & Types
  chartType: string;
  candlestick: string;
  barChart: string;
  lineChart: string;
  areaChart: string;
  baselineChart: string;
  heikinAshi: string;
  hollowCandles: string;
  autoScale: string;
  logScale: string;
  percentageScale: string;
  invertScale: string;
  countdownTimer: string;
  watermark: string;
  gridlines: string;
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
    calendarViewTab: '📅 Lịch Ngày & Tháng',
    hourlyMatrixTab: '⏱️ Ma Trận Khung Giờ & Thứ',
    monthlyProfit: 'Lợi nhuận Tháng',
    winningDays: 'Số ngày Lãi / Lỗ',
    bestTradingDay: 'Ngày Lãi Đậm Nhất',
    tradesInMonth: 'Lệnh trong tháng',
    weekTotal: 'Tổng Tuần',

    aiStudioTitle: 'AI Strategy Studio & Sandbox Runner',
    studioAndSandboxTab: 'Studio & Sandbox',
    optimizerTab: '⚡ Tối Ưu SL/TP',
    optimizerTitle: 'SL/TP Grid Search & Multi-Variant Optimizer',
    optimizerDesc: 'Tự động quét hàng loạt cấu hình SL & TP trên dữ liệu nến thực tế để tìm điểm cân bằng lợi nhuận cao nhất và hạn chế rủi ro.',
    slRangeLabel: 'Dải Stop Loss (Pips)',
    tpRangeLabel: 'Dải Take Profit (Pips)',
    rangeMin: 'Min (Pips)',
    rangeMax: 'Max (Pips)',
    rangeStep: 'Bước nhảy (Step)',
    symbolPreset: 'Preset theo Symbol',
    runOptimizerBtn: '🚀 Bắt đầu Quét & Tối Ưu Hóa',
    runningOptimizer: 'Đang chạy mô phỏng hàng loạt...',
    applyBestConfig: 'Áp Dụng Cấu Hình Này',
    appliedSuccess: 'Đã áp dụng cấu hình SL/TP tối ưu vào chiến lược!',
    bestOverallBadge: '🏆 Tối Ưu Nhất',
    bestWinRateBadge: '🎯 Winrate Cao Nhất',
    lowestDDBadge: '🛡️ Rủi Ro Thấp Nhất',
    bestSharpeBadge: '⚡ Sharpe Tốt Nhất',
    leaderboardTitle: 'Bảng Xếp Hạng Hiệu Suất Cấu Hình SL/TP',
    heatmapTitle: 'Ma Trận Nhiệt Lợi Nhuận SL vs TP (Profit Heatmap)',
    heatmapSub: 'Vùng màu xanh thể hiện vùng tham số sinh lời ổn định (Sweet Spot), tránh over-fitting.',
    autoTuneCheckbox: '🔍 Tự động quét & tìm SL/TP tối ưu sau khi sinh code',
    autoTuneRunning: 'Đang tối ưu SL/TP theo dữ liệu nến thực tế...',
    totalTested: 'Tổng cấu hình đã quét',
    executionTime: 'Thời gian thực thi',
    sortByLabel: 'Sắp xếp theo',
    sparklineEquity: 'Đường cong vốn (Sparkline)',
    qualityFilterMinTrades: 'Chỉ hiện cấu hình có ý nghĩa (>= 5 lệnh)',
    qualityFilterProfitable: 'Chỉ hiện cấu hình có lãi',
    botHudTitle: 'AI Bot Live HUD',
    botStatusWaiting: 'Đang chờ tín hiệu...',
    botStatusInTrade: 'Đang giữ vị thế mở',
    botTodayTrades: 'Lệnh thực thi',
    botNetPnL: 'PnL Bot',
    strategyRulesTitle: 'Tóm Tắt Quy Tắc Vào Lệnh (Strategy Rules)',
    ruleBuyConditions: 'Điều kiện BUY (Mua)',
    ruleSellConditions: 'Điều kiện SELL (Bán)',
    ruleRiskParams: 'Quản trị Rủi ro & Khối lượng',
    quickParamTuning: 'Tinh Chỉnh Nhanh Tham Số',
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
    localLibraryTab: 'Thư Viện Dataset (DB)',
    autoCrawlDesc: '🌐 Hệ thống Tự động Crawl Dữ liệu Trực tuyến cho phép kéo trực tiếp hàng ngàn nến lịch sử thực tế từ các sàn giao dịch hàng đầu thế giới (Binance REST API) mà không cần bất kỳ API key nào!',
    intervalLabel: 'Khung thời gian',
    startCrawlBtn: 'Bắt đầu Crawl & Nạp Biểu Đồ',
    crawlingBtn: 'Đang Crawl Dữ liệu Trực tuyến...',
    dragDropCSV: 'Kéo & thả file CSV vào đây hoặc click để duyệt file',
    parsingFile: 'Đang giải mã và tối ưu dữ liệu...',
    supportedFormat: 'Hỗ trợ: Date, Time, Open, High, Low, Close, Volume (Tự động nhận diện dấu ; hoặc ,)',
    dataHealthTitle: 'Báo cáo Kiểm tra Chất lượng Dữ liệu (Data Health)',
    totalRowsParsed: 'Tổng số dòng quét',
    validCandlesCount: 'Số nến hợp lệ nạp vào',
    duplicatesCleaned: 'Nến trùng lặp đã khử',
    detectedTimeframe: 'Timeframe tự động nhận diện',
    dataDateRange: 'Khoảng thời gian nến',
    candleRangeSlice: 'Giới hạn số nến nạp (Smart Slicer)',
    sliceAll: 'Toàn bộ file (Full Dataset)',
    slice200k: '200,000 nến gần nhất (Khuyên dùng - 60 FPS)',
    slice100k: '100,000 nến gần nhất',
    slice50k: '50,000 nến gần nhất',
    previewDataTable: 'Xem trước dữ liệu trích xuất',
    loadDatasetBtn: 'Nạp Vào Biểu Đồ',
    selectSymbolLabel: 'Mã tài sản mục tiêu',
    importSuccessCount: 'Đã nạp thành công {count} nến vào biểu đồ!',

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
    selectAll: 'Chọn tất cả',
    deleteSelected: 'Xóa mục đã chọn',
    clearAllSessions: 'Xóa toàn bộ phiên',
    confirmClearAll: 'Bạn có chắc chắn muốn xóa TOÀN BỘ các phiên backtest? Hành động này không thể hoàn tác!',
    resetActiveSessionBtn: 'Reset phiên hiện tại',
    guestTradeLimitExceeded: 'Bạn đã đạt giới hạn 3 lệnh dùng thử cho Khách. Vui lòng đăng nhập để mở khóa không giới hạn!',

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
    importStrategyError: 'Lỗi định dạng file chiến lược.',

    chartType: 'Loại biểu đồ',
    candlestick: 'Nến Nhật (Candlestick)',
    barChart: 'Thanh OHLC (Bars)',
    lineChart: 'Đường (Line)',
    areaChart: 'Vùng (Area)',
    baselineChart: 'Đường cơ sở (Baseline)',
    heikinAshi: 'Heikin-Ashi (Mượt xu hướng)',
    hollowCandles: 'Nến rỗng (Hollow)',
    autoScale: 'Tự động (Auto)',
    logScale: 'Thang Logarithm (Log)',
    percentageScale: 'Thang Phần trăm (%)',
    invertScale: 'Đảo ngược đồ thị (Inv)',
    countdownTimer: 'Đếm ngược đóng nến',
    watermark: 'Hình mờ thương hiệu',
    gridlines: 'Đường lưới'
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
    calendarViewTab: '📅 Monthly Calendar',
    hourlyMatrixTab: '⏱️ Day & Hour Matrix',
    monthlyProfit: 'Monthly Net PnL',
    winningDays: 'Winning / Losing Days',
    bestTradingDay: 'Best Trading Day',
    tradesInMonth: 'Trades in Month',
    weekTotal: 'Week Total',

    aiStudioTitle: 'AI Strategy Studio & Sandbox Runner',
    studioAndSandboxTab: 'Studio & Sandbox',
    optimizerTab: '⚡ SL/TP Optimizer',
    optimizerTitle: 'SL/TP Grid Search & Multi-Variant Optimizer',
    optimizerDesc: 'Auto-scan multiple SL & TP parameter combinations across active market candles to find the optimal sweet spot for profit & drawdown.',
    slRangeLabel: 'Stop Loss Range (Pips)',
    tpRangeLabel: 'Take Profit Range (Pips)',
    rangeMin: 'Min (Pips)',
    rangeMax: 'Max (Pips)',
    rangeStep: 'Step (Pips)',
    symbolPreset: 'Symbol Preset',
    runOptimizerBtn: '🚀 Run Batch Optimization',
    runningOptimizer: 'Simulating combinations...',
    applyBestConfig: 'Apply This Configuration',
    appliedSuccess: 'Optimal SL/TP applied to strategy!',
    bestOverallBadge: '🏆 Best Overall',
    bestWinRateBadge: '🎯 Highest Winrate',
    lowestDDBadge: '🛡️ Lowest Drawdown',
    bestSharpeBadge: '⚡ Best Sharpe',
    leaderboardTitle: 'SL/TP Performance Leaderboard',
    heatmapTitle: 'SL vs TP Profit Heatmap Matrix',
    heatmapSub: 'Green clusters highlight robust profitable parameter zones (Sweet Spot) to avoid over-fitting.',
    autoTuneCheckbox: '🔍 Auto-optimize SL/TP parameters after code generation',
    autoTuneRunning: 'Auto-tuning SL/TP on active market candles...',
    totalTested: 'Tested Combinations',
    executionTime: 'Execution Time',
    sortByLabel: 'Sort By',
    sparklineEquity: 'Equity Trajectory (Sparkline)',
    qualityFilterMinTrades: 'Significant configs only (>= 5 trades)',
    qualityFilterProfitable: 'Profitable configs only',
    botHudTitle: 'AI Bot Live HUD',
    botStatusWaiting: 'Waiting for signal...',
    botStatusInTrade: 'In open position',
    botTodayTrades: 'Bot Trades',
    botNetPnL: 'Bot Net PnL',
    strategyRulesTitle: 'Strategy Rules Breakdown',
    ruleBuyConditions: 'BUY Entry Rules',
    ruleSellConditions: 'SELL Entry Rules',
    ruleRiskParams: 'Risk & Position Sizing',
    quickParamTuning: 'Quick Parameter Tuning',
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
    localLibraryTab: 'Dataset Library (DB)',
    autoCrawlDesc: '🌐 Automated Online Data Crawler pulls thousands of real historical candles directly from world-class exchanges (Binance REST API) without requiring any API key!',
    intervalLabel: 'Candle Interval',
    startCrawlBtn: 'Start Crawl & Load into Chart',
    crawlingBtn: 'Crawling Live Data...',
    dragDropCSV: 'Drag & drop CSV file here or click to browse',
    parsingFile: 'Parsing and validating data...',
    supportedFormat: 'Supported format: Date, Time, Open, High, Low, Close, Volume (Auto-detected ; or ,)',
    dataHealthTitle: 'Data Health & Integrity Diagnostics',
    totalRowsParsed: 'Total Rows Scanned',
    validCandlesCount: 'Valid Candles Loaded',
    duplicatesCleaned: 'Duplicates Cleaned',
    detectedTimeframe: 'Detected Timeframe',
    dataDateRange: 'Date Range Span',
    candleRangeSlice: 'Candle Limit / Range Slice',
    sliceAll: 'Full Dataset',
    slice200k: 'Last 200k Bars (Recommended - 60 FPS)',
    slice100k: 'Last 100k Bars',
    slice50k: 'Last 50k Bars',
    previewDataTable: 'Data Extraction Preview',
    loadDatasetBtn: 'Load to Chart',
    selectSymbolLabel: 'Target Symbol',
    importSuccessCount: 'Successfully loaded {count} candles to chart!',

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
    selectAll: 'Select All',
    deleteSelected: 'Delete Selected',
    clearAllSessions: 'Clear All Sessions',
    confirmClearAll: 'Are you sure you want to delete ALL backtest sessions? This action cannot be undone!',
    resetActiveSessionBtn: 'Reset Current Session',
    guestTradeLimitExceeded: 'You have reached the 3 demo trade limit for Guests. Please sign in to unlock unlimited backtesting!',

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
    importStrategyError: 'Invalid strategy file format.',

    chartType: 'Chart Type',
    candlestick: 'Candlestick',
    barChart: 'Bars (OHLC)',
    lineChart: 'Line',
    areaChart: 'Area',
    baselineChart: 'Baseline',
    heikinAshi: 'Heikin-Ashi (Smoothed)',
    hollowCandles: 'Hollow Candles',
    autoScale: 'Auto Scale',
    logScale: 'Logarithmic (Log)',
    percentageScale: 'Percentage (%)',
    invertScale: 'Invert Scale (Inv)',
    countdownTimer: 'Countdown to Bar Close',
    watermark: 'Symbol Watermark',
    gridlines: 'Gridlines'
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
    heatmapDesc: '取引時間帯（UTC）および曜日ごとの損益・勝率分布：',
    calendarViewTab: '📅 カレンダー表示',
    hourlyMatrixTab: '⏱️ 曜日・時間帯マトリクス',
    monthlyProfit: '月間純損益',
    winningDays: '勝ち・負け日数',
    bestTradingDay: '最高利益日',
    tradesInMonth: '月間取引数',
    weekTotal: '週間合計',

    aiStudioTitle: 'AI戦略スタジオ＆実行サンドボックス',
    studioAndSandboxTab: 'スタジオ＆サンドボックス',
    optimizerTab: '⚡ SL/TP 最適化',
    optimizerTitle: 'SL/TP グリッドサーチ＆マルチバリアント最適化',
    optimizerDesc: '実際のローソク足データ上で複数のSL/TP構成を一括バックテストし、最高のリターンとドローダウン抑制を両立する最適値を探索します。',
    slRangeLabel: 'ストップロス範囲 (Pips)',
    tpRangeLabel: 'テイクプロフィット範囲 (Pips)',
    rangeMin: '最小値 (Pips)',
    rangeMax: '最大値 (Pips)',
    rangeStep: 'ステップ幅',
    symbolPreset: '銘柄プリセット',
    runOptimizerBtn: '🚀 最適化バッチ実行',
    runningOptimizer: 'シミュレーション実行中...',
    applyBestConfig: 'この設定を適用する',
    appliedSuccess: '最適なSL/TP設定を戦略に適用しました！',
    bestOverallBadge: '🏆 総合最高スコア',
    bestWinRateBadge: '🎯 最高勝率',
    lowestDDBadge: '🛡️ 最小ドローダウン',
    bestSharpeBadge: '⚡ 最高シャープレシオ',
    leaderboardTitle: 'SL/TP パフォーマンスランキング',
    heatmapTitle: 'SL vs TP 損益ヒートマップマトリクス',
    heatmapSub: '緑色のクラスターは過剰適合（Overfitting）を回避できる安定した収益ゾーンを示します。',
    autoTuneCheckbox: '🔍 コード生成後にSL/TPパラメータを自動最適化',
    autoTuneRunning: '実データでSL/TPを自動チューニング中...',
    totalTested: 'テスト済み組み合わせ数',
    executionTime: '実行時間',
    sortByLabel: '並び替え基準',
    sparklineEquity: '資産推移 (Sparkline)',
    qualityFilterMinTrades: '統計的に有意な構成のみ (>= 5 取引)',
    qualityFilterProfitable: '利益が出ている構成のみ',
    botHudTitle: 'AI Bot ライブHUD',
    botStatusWaiting: 'シグナル待機中...',
    botStatusInTrade: 'ポジション保有中',
    botTodayTrades: '実行取引数',
    botNetPnL: 'Bot純損益',
    strategyRulesTitle: '戦略ルール要約',
    ruleBuyConditions: '買いエントリー条件',
    ruleSellConditions: '売りエントリー条件',
    ruleRiskParams: 'リスク管理＆ロット',
    quickParamTuning: 'パラメータクイック調整',
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
    localLibraryTab: 'データセットライブラリ (DB)',
    autoCrawlDesc: '🌐 オンライン自動クローラーにより、APIキーなしでBinance等の取引所から実際の過去ティック・K線データを直接取得できます。',
    intervalLabel: '時間軸 (Interval)',
    startCrawlBtn: 'クロール開始＆チャートに適用',
    crawlingBtn: 'データ取得中...',
    dragDropCSV: 'CSVファイルをここにドラッグ＆ドロップ',
    parsingFile: 'ファイルを解析中...',
    supportedFormat: '対応形式: Date, Time, Open, High, Low, Close, Volume (自動判定)',
    dataHealthTitle: 'データ品質・整合性レポート',
    totalRowsParsed: '総行数',
    validCandlesCount: '有効ローソク足数',
    duplicatesCleaned: '重複除外数',
    detectedTimeframe: '検出タイムフレーム',
    dataDateRange: 'データ期間',
    candleRangeSlice: 'ローソク足件数制限 (Smart Slicer)',
    sliceAll: '全データ (Full Dataset)',
    slice200k: '直近20万本 (推奨 - 60 FPS)',
    slice100k: '直近10万本',
    slice50k: '直近5万本',
    previewDataTable: 'データプレビュー',
    loadDatasetBtn: 'チャートに読み込む',
    selectSymbolLabel: '対象シンボル',
    importSuccessCount: '{count}本のローソク足をチャートに読み込みました！',

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
    selectAll: 'すべて選択',
    deleteSelected: '選択した項目を削除',
    clearAllSessions: '全セッションをクリア',
    confirmClearAll: 'すべてのセッションを削除してもよろしいですか？この操作は取り消せません。',
    resetActiveSessionBtn: '現在のセッションをリセット',
    guestTradeLimitExceeded: 'ゲストのお試し上限（3回）に達しました。無制限で利用するにはログインしてください。',

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
    importStrategyError: 'ストラテジーファイルの形式が無効です。',

    chartType: 'チャート種別',
    candlestick: 'ローソク足 (Candlestick)',
    barChart: 'バーチャート (Bars)',
    lineChart: 'ライン (Line)',
    areaChart: 'エリア (Area)',
    baselineChart: 'ベースライン (Baseline)',
    heikinAshi: '平均足 (Heikin-Ashi)',
    hollowCandles: '中空ローソク足 (Hollow)',
    autoScale: '自動調整 (Auto)',
    logScale: '対数スケール (Log)',
    percentageScale: 'パーセンテージ (%)',
    invertScale: 'スケール反転 (Inv)',
    countdownTimer: '足確定カウントダウン',
    watermark: 'ウォーターマーク',
    gridlines: 'グリッド線'
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
    heatmapDesc: '交易时段（UTC）及周中各天的盈亏与胜率分布：',
    calendarViewTab: '📅 月度日历视图',
    hourlyMatrixTab: '⏱️ 星期与时段矩阵',
    monthlyProfit: '月度净盈亏',
    winningDays: '盈利/亏损天数',
    bestTradingDay: '最佳交易日',
    tradesInMonth: '当月交易笔数',
    weekTotal: '周总计',

    aiStudioTitle: 'AI策略工作室与沙盒执行引擎',
    studioAndSandboxTab: '工作室与沙盒',
    optimizerTab: '⚡ 止损止盈优化器',
    optimizerTitle: 'SL/TP 网格扫描与多参数优化引擎',
    optimizerDesc: '在当前K线历史数据上批量模拟多组止损和止盈组合，自动寻找胜率与盈亏比最均衡的最佳参数配置。',
    slRangeLabel: '止损点数范围 (Pips)',
    tpRangeLabel: '止盈点数范围 (Pips)',
    rangeMin: '最小值 (Pips)',
    rangeMax: '最大值 (Pips)',
    rangeStep: '步长 (Step)',
    symbolPreset: '品种预设',
    runOptimizerBtn: '🚀 启动批量网格优化',
    runningOptimizer: '正在进行多组合回测...',
    applyBestConfig: '应用该参数配置',
    appliedSuccess: '已将最优止损止盈参数应用至策略！',
    bestOverallBadge: '🏆 综合最优',
    bestWinRateBadge: '🎯 最高胜率',
    lowestDDBadge: '🛡️ 最低回撤',
    bestSharpeBadge: '⚡ 最佳夏普比率',
    leaderboardTitle: 'SL/TP 参数表现排行榜',
    heatmapTitle: 'SL vs TP 收益热力图矩阵 (Profit Heatmap)',
    heatmapSub: '深绿色区块代表稳健盈利区间 (Sweet Spot)，有效避免过拟合。',
    autoTuneCheckbox: '🔍 代码生成后自动优化 SL/TP 止损止盈参数',
    autoTuneRunning: '正在根据实盘K线自动调优 SL/TP...',
    totalTested: '已测组合总数',
    executionTime: '运算耗时',
    sortByLabel: '排序方式',
    sparklineEquity: '资金走势 (Sparkline)',
    qualityFilterMinTrades: '仅显示有效样本 (>= 5笔交易)',
    qualityFilterProfitable: '仅显示盈利组合',
    botHudTitle: 'AI Bot 实时悬浮窗 HUD',
    botStatusWaiting: '等待入场信号...',
    botStatusInTrade: '持仓中',
    botTodayTrades: '执行笔数',
    botNetPnL: 'Bot净收益',
    strategyRulesTitle: '策略规则逻辑摘要',
    ruleBuyConditions: '买入入场规则 (BUY)',
    ruleSellConditions: '卖出入场规则 (SELL)',
    ruleRiskParams: '风控止损与仓位',
    quickParamTuning: '快速参数调优',
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

    dataManagerTitle: '历史数据管理、导入与在线自动抓取',
    autoCrawlTab: '在线自动抓取 (Binance REST API)',
    uploadFileTab: '导入 CSV / TXT 文件',
    sampleDataTab: '示例数据 (GBM Presets)',
    localLibraryTab: '数据集库 (DB)',
    autoCrawlDesc: '🌐 在线自动抓取系统无需任何 API Key，即可直接从全球顶级交易所拉取数千根真实历史K线！',
    intervalLabel: 'K线周期 (Interval)',
    startCrawlBtn: '开始抓取并载入图表',
    crawlingBtn: '正在抓取数据...',
    dragDropCSV: '拖拽 CSV 文件至此处，或点击浏览',
    parsingFile: '正在解析与优化数据...',
    supportedFormat: '支持格式: Date, Time, Open, High, Low, Close, Volume (自动识别分号 ; 或逗号 ,)',
    dataHealthTitle: '数据质量与完整性诊断报告',
    totalRowsParsed: '扫描总行数',
    validCandlesCount: '有效K线数',
    duplicatesCleaned: '已清理重复数',
    detectedTimeframe: '检测时间周期',
    dataDateRange: '时间跨度',
    candleRangeSlice: 'K线数量限制 (Smart Slicer)',
    sliceAll: '全部数据 (Full Dataset)',
    slice200k: '最近20万根 (推荐 - 60 FPS)',
    slice100k: '最近10万根',
    slice50k: '最近5万根',
    previewDataTable: '数据提取预览',
    loadDatasetBtn: '载入图表',
    selectSymbolLabel: '目标交易对',
    importSuccessCount: '成功载入 {count} 根K线至图表！',

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
    selectAll: '全选',
    deleteSelected: '删除所选会话',
    clearAllSessions: '清空全部会话',
    confirmClearAll: '您确定要清空全部回测会话吗？此操作无法撤销！',
    resetActiveSessionBtn: '重置当前会话',
    guestTradeLimitExceeded: '您已达到访客3笔体验交易上限。请登录解锁无限量化回测！',

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
    importStrategyError: '策略文件格式无效。',

    chartType: '图表类型',
    candlestick: '日本蜡烛图 (Candlestick)',
    barChart: '美国线 (Bars)',
    lineChart: '折线图 (Line)',
    areaChart: '面积图 (Area)',
    baselineChart: '基准线图 (Baseline)',
    heikinAshi: '平均K线 (Heikin-Ashi)',
    hollowCandles: '空心蜡烛图 (Hollow)',
    autoScale: '自动适配 (Auto)',
    logScale: '对数坐标 (Log)',
    percentageScale: '百分比坐标 (%)',
    invertScale: '反转坐标 (Inv)',
    countdownTimer: 'K线收盘倒计时',
    watermark: '背景水印',
    gridlines: '网格线'
  }
};
