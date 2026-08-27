import * as fs from 'fs';
import * as path from 'path';

// 1. New keys to add
const newKeys = {
  // Chart types short
  candleShort: {
    en: 'Candles',
    vi: 'Nến',
    ja: 'ローソク足',
    zh: 'K线'
  },
  barShort: {
    en: 'Bar',
    vi: 'Bar',
    ja: 'バー',
    zh: '条形'
  },
  lineShort: {
    en: 'Line',
    vi: 'Đường',
    ja: 'ライン',
    zh: '折线'
  },
  areaShort: {
    en: 'Area',
    vi: 'Vùng',
    ja: 'エリア',
    zh: '面积'
  },
  heikinAshiShort: {
    en: 'H-A',
    vi: 'H-A',
    ja: '平均足',
    zh: '平均K'
  },
  hollowShort: {
    en: 'Hollow',
    vi: 'Rỗng',
    ja: '中空足',
    zh: '空心K'
  },
  baselineShort: {
    en: 'Base',
    vi: 'Gốc',
    ja: '基準線',
    zh: '基准'
  },

  // Drawing tool titles
  cursorToolTitle: {
    en: 'Cursor tool',
    vi: 'Con trỏ chuột',
    ja: 'カーソルツール',
    zh: '鼠标光标'
  },
  trendlineToolTitle: {
    en: 'Trendline',
    vi: 'Đường xu hướng (Trendline)',
    ja: 'トレンドライン',
    zh: '趋势线 (Trendline)'
  },
  horizontalRayToolTitle: {
    en: 'Horizontal Ray / Level',
    vi: 'Đường ngang (Horizontal Ray)',
    ja: '水平レイ / 水平線',
    zh: '水平射线 (Horizontal Ray)'
  },
  fibonacciToolTitle: {
    en: 'Fibonacci Retracement',
    vi: 'Fibonacci Thoái lui',
    ja: 'フィボナッチ・リトレースメント',
    zh: '斐波那契回撤 (Fibonacci)'
  },
  rectangleToolTitle: {
    en: 'Supply / Demand Zone (Box)',
    vi: 'Vùng Cung/Cầu (Supply/Demand Box)',
    ja: '需給ゾーン (ボックス)',
    zh: '供需区域 (矩形)'
  },
  clearAllDrawingsTitle: {
    en: 'Clear all drawings on chart',
    vi: 'Xóa tất cả bản vẽ trên biểu đồ',
    ja: 'すべての描画を削除',
    zh: '清除图表上的所有绘制'
  },

  // Header & Account
  balanceLabel: {
    en: 'Balance',
    vi: 'Vốn',
    ja: '残高',
    zh: '本金'
  },
  equityLabel: {
    en: 'Equity',
    vi: 'Equity',
    ja: '有効証拠金',
    zh: '净值'
  },
  floatingPnLLabel: {
    en: 'Floating PnL',
    vi: 'PnL thả nổi',
    ja: '含み損益',
    zh: '浮动盈亏'
  },
  languageLabel: {
    en: 'Language:',
    vi: 'Ngôn ngữ:',
    ja: '言語:',
    zh: '语言:'
  },
  scaleSettingsTooltip: {
    en: 'Chart Scale & Visual Settings',
    vi: 'Cài đặt thang đo & hiển thị',
    ja: 'チャートスケールと表示設定',
    zh: '图表比例与显示设置'
  },

  // Chart Scale & Overlays
  logScaleTooltip: {
    en: 'Toggle Logarithmic Scale (Log)',
    vi: 'Bật/Tắt thang đo Logarithm (Log)',
    ja: '対数スケール切り替え (Log)',
    zh: '切换对数坐标 (Log)'
  },
  percentScaleTooltip: {
    en: 'Toggle Percentage Scale (%)',
    vi: 'Bật/Tắt thang đo Phần trăm (%)',
    ja: 'パーセンテージスケール切り替え (%)',
    zh: '切换百分比坐标 (%)'
  },
  invertScaleTooltip: {
    en: 'Invert Chart Price Scale',
    vi: 'Đảo ngược đồ thị (Invert Scale)',
    ja: '価格スケール反転',
    zh: '反转价格坐标 (Invert Scale)'
  },
  autoScaleTooltip: {
    en: 'Auto-fit Price Scale (Auto)',
    vi: 'Tự động căn chỉnh thang đo (Auto)',
    ja: '自動スケール調整 (Auto)',
    zh: '自动适配坐标 (Auto)'
  },
  candleCloseCountdown: {
    en: 'bar close',
    vi: 'đóng nến',
    ja: '足確定',
    zh: 'K线倒计时'
  },

  // Quick Trade & Dock
  buyAtAskTooltip: {
    en: 'Execute BUY @ Ask: {price}',
    vi: 'Vào lệnh BUY @ Ask: {price}',
    ja: '買い注文実行 (BUY @ Ask: {price})',
    zh: '执行买入 (BUY @ Ask: {price})'
  },
  sellAtBidTooltip: {
    en: 'Execute SELL @ Bid: {price}',
    vi: 'Vào lệnh SELL @ Bid: {price}',
    ja: '売り注文実行 (SELL @ Bid: {price})',
    zh: '执行卖出 (SELL @ Bid: {price})'
  },
  decreaseLotTooltip: {
    en: 'Decrease 0.01 Lot',
    vi: 'Giảm 0.01 Lot',
    ja: '0.01 ロット減',
    zh: '减少 0.01 手'
  },
  increaseLotTooltip: {
    en: 'Increase 0.01 Lot',
    vi: 'Tăng 0.01 Lot',
    ja: '0.01 ロット増',
    zh: '增加 0.01 手'
  },
  riskRewardRatioTooltip: {
    en: 'Risk : Reward Ratio = 1 : {ratio}',
    vi: 'Tỷ lệ Risk : Reward = 1 : {ratio}',
    ja: 'リスクリワード比 = 1 : {ratio}',
    zh: '盈亏比 (Risk:Reward) = 1 : {ratio}'
  },
  autoSetTPRRTooltip: {
    en: 'Auto set Take Profit by R:R 1:{mult} ({pips} pips)',
    vi: 'Tự động đặt Take Profit theo R:R 1:{mult} ({pips} pips)',
    ja: 'R:R 1:{mult} ({pips} pips) でTP自動設定',
    zh: '按盈亏比 1:{mult} ({pips} 点) 自动设置止盈'
  },
  collapseQuickTradeTooltip: {
    en: 'Collapse Quick Trade dock',
    vi: 'Thu nhỏ thanh Quick Trade',
    ja: 'クイックトレードバーを折りたたむ',
    zh: '折叠快捷下单栏'
  },
  expandQuickTradeTooltip: {
    en: 'Expand Quick Trade dock',
    vi: 'Mở rộng thanh Quick Trade',
    ja: 'クイックトレードバーを展開',
    zh: '展开快捷下单栏'
  },
  toggleShieldTooltip: {
    en: 'Collapse / Expand Shield',
    vi: 'Thu nhỏ / Mở rộng Shield',
    ja: 'シールドの折りたたみ/展開',
    zh: '折叠/展开风控面板'
  },

  // AI Bot HUD
  botHoldingPosition: {
    en: 'Holding Position',
    vi: 'Đang giữ vị thế',
    ja: 'ポジション保有中',
    zh: '持仓中'
  },
  botWaitingSignal: {
    en: 'Scanning for signals...',
    vi: 'Đang chờ tín hiệu...',
    ja: 'シグナル待機中...',
    zh: '等待交易信号...'
  },
  botPaused: {
    en: 'Paused',
    vi: 'Tạm dừng (Paused)',
    ja: '一時停止中',
    zh: '已暂停'
  },
  botExpandInfoTooltip: {
    en: 'Click to expand AI Bot details',
    vi: 'Bấm để mở rộng thông tin AI Bot',
    ja: 'クリックしてAIボット詳細を展開',
    zh: '点击展开 AI 机器人详情'
  },
  botCollapseTooltip: {
    en: 'Collapse HUD',
    vi: 'Thu nhỏ HUD',
    ja: 'HUDを折りたたむ',
    zh: '折叠 HUD'
  },

  // AI Strategy Modal Tables & Actions
  rankCol: {
    en: 'Rank',
    vi: 'Hạng',
    ja: '順位',
    zh: '排名'
  },
  tradesCol: {
    en: 'Trades',
    vi: 'Lệnh',
    ja: '取引数',
    zh: '交易量'
  },
  wfaCol: {
    en: 'Robustness (WFA)',
    vi: 'Độ Bền (WFA)',
    ja: '堅牢性 (WFA)',
    zh: '稳健度 (WFA)'
  },
  actionsCol: {
    en: 'Action',
    vi: 'Thao tác',
    ja: '操作',
    zh: '操作'
  },
  applyConfigBtn: {
    en: 'Apply',
    vi: 'Áp Dụng',
    ja: '適用',
    zh: '应用'
  },
  loadIntoStudioBtn: {
    en: 'Load to Studio',
    vi: 'Nạp Vào Studio',
    ja: 'スタジオに読み込む',
    zh: '加载至工作区'
  },
  noCustomStrategiesInDb: {
    en: 'No custom strategies saved in database yet. Create one in Studio and save!',
    vi: 'Chưa có chiến lược nào được lưu trong Database. Hãy tạo và bấm Lưu trong tab Studio!',
    ja: 'データベースに保存されたカスタム戦略はありません。スタジオで作成して保存してください！',
    zh: '数据库中暂无已保存的自定义策略。请在 Studio 工作区创建并保存！'
  },
  promptSuggestionEmaLabel: {
    en: 'EMA 9/21 Scalper',
    vi: 'EMA 9/21 Scalper',
    ja: 'EMA 9/21 スキャルパー',
    zh: 'EMA 9/21 剥头皮策略'
  },
  promptSuggestionEmaText: {
    en: 'Fast scalping: BUY when EMA 9 crosses above EMA 21, SELL when EMA 9 crosses below EMA 21 with SL 15pips, TP 30pips',
    vi: 'Chiến lược lướt sóng nhanh: Mua khi EMA 9 cắt lên EMA 21, Bán khi EMA 9 cắt xuống EMA 21 kèm SL 15pips, TP 30pips',
    ja: '短期スキャルピング: EMA 9がEMA 21を上抜けで買い、下抜けで売り、SL 15pips、TP 30pips',
    zh: '快速超短线策略: 当 EMA 9 上穿 EMA 21 时买入，下穿时卖出，止损 15 点，止盈 30 点'
  },
  promptSuggestionRsiLabel: {
    en: 'RSI 30/70 Pullback',
    vi: 'RSI 30/70 Pullback',
    ja: 'RSI 30/70 プルバック',
    zh: 'RSI 30/70 回调策略'
  },
  promptSuggestionRsiText: {
    en: 'BUY when RSI 14 oversold below 30 with green candle; SELL when RSI 14 overbought above 70 with red candle',
    vi: 'Mua khi RSI 14 quá bán dưới 30 và nến xanh xuất hiện; Bán khi RSI 14 quá mua trên 70 và nến đỏ xuất hiện',
    ja: 'RSI 14が30以下の売られすぎで陽線出現時に買い、70以上の買われすぎで陰線出現時に売り',
    zh: '当 RSI 14 超卖低于 30 且收阳线时买入；当 RSI 14 超买高于 70 且收阴线时卖出'
  },
  promptSuggestionBbLabel: {
    en: 'Bollinger Band Squeeze',
    vi: 'Bollinger Band Squeeze',
    ja: 'ボリンジャーバンド・スクイーズ',
    zh: '布林带挤压突破'
  },
  promptSuggestionBbText: {
    en: 'Breakout strategy when Bollinger Bands expand from a squeeze with high momentum',
    vi: 'Chiến lược phá vỡ dải Bollinger Bands khi thị trường bung nén với dải mở rộng',
    ja: 'ボリンジャーバンドがスクイーズからエクスパンションするモメンタムブレイクアウト戦略',
    zh: '当布林带由收敛紧缩转为扩张并伴随高动量时顺势突破交易'
  },
  promptSuggestionMacdLabel: {
    en: 'MACD Zero Crossover',
    vi: 'MACD Zero Crossover',
    ja: 'MACD ゼロラインクロス',
    zh: 'MACD 零轴交叉趋势'
  },
  promptSuggestionMacdText: {
    en: 'Trend momentum when MACD line crosses zero combined with EMA 50 trend filter',
    vi: 'Giao dịch theo đà xu hướng khi đường MACD cắt qua mức 0 kết hợp bộ lọc EMA 50',
    ja: 'MACDラインがゼロラインをクロスした時にEMA 50トレンドフィルターと併用して順張りエントリー',
    zh: '当 MACD 线突破零轴并结合 EMA 50 均线趋势过滤时顺势入场'
  },
  openOptimizerTooltip: {
    en: 'Open SL/TP Optimizer Engine',
    vi: 'Mở trình tối ưu SL/TP',
    ja: 'SL/TP最適化エンジンを開く',
    zh: '打开 SL/TP 网格优化器'
  },
  exportBotModalTooltip: {
    en: 'Export strategy to MT4/MT5/TradingView/Python/cTrader Bot',
    vi: 'Xuất chiến lược sang Bot MT4/MT5/TradingView/Python/cTrader',
    ja: 'MT4/MT5/TradingView/Python/cTrader ボットへエクスポート',
    zh: '将策略导出为 MT4/MT5/TradingView/Python/cTrader 自动化机器人'
  },
  importStrategyModalTooltip: {
    en: 'Import strategy from JSON or JS file',
    vi: 'Nhập chiến lược từ file JSON hoặc JS',
    ja: 'JSONまたはJSファイルから戦略をインポート',
    zh: '从 JSON 或 JS 文件导入策略'
  },
  insufficientCandlesForOpt: {
    en: 'Insufficient candle data to run optimization. Please load candles onto the chart first.',
    vi: 'Không đủ dữ liệu nến để chạy tối ưu hóa. Vui lòng tải dữ liệu nến vào biểu đồ trước.',
    ja: '最適化を実行するのに十分なK線データがありません。チャートにデータを読み込んでください。',
    zh: 'K线数据不足以运行参数优化。请先在图表上加载历史行情数据。'
  },
  optAxisHelp: {
    en: 'Y-Axis: TP (pips) • X-Axis: SL (pips)',
    vi: 'Trục Y: TP (pips) • Trục X: SL (pips)',
    ja: 'Y軸: TP (pips) • X軸: SL (pips)',
    zh: '纵轴 Y: 止盈 TP (点) • 横轴 X: 止损 SL (点)'
  },
  filterLabel: {
    en: 'Filter:',
    vi: 'Bộ lọc:',
    ja: 'フィルター:',
    zh: '筛选:'
  },
  customStrategyNoDesc: {
    en: 'Custom strategy without description.',
    vi: 'Chiến lược tùy chỉnh không có mô tả.',
    ja: '説明のないカスタム戦略。',
    zh: '无详细描述的自定义策略。'
  },
  confirmDeleteStrat: {
    en: 'Are you sure you want to delete this strategy from database?',
    vi: 'Bạn có chắc muốn xóa chiến lược này khỏi DB?',
    ja: 'この戦略をデータベースから削除してもよろしいですか？',
    zh: '确定要从数据库中彻底删除此策略吗？'
  },
  transpileErrorFallback: {
    en: 'Error transpiling code with AI.',
    vi: 'Lỗi khi dịch mã bằng AI.',
    ja: 'AIコードトランスパイルエラー。',
    zh: 'AI 代码转译失败。'
  },

  // Analytics Matrix & Session Labels
  bestTradingHourCard: {
    en: 'Best Trading Hour',
    vi: 'Khung Giờ Tốt Nhất',
    ja: '最も収益性の高い時間帯',
    zh: '最佳交易时段'
  },
  worstTradingHourCard: {
    en: 'Worst Trading Hour',
    vi: 'Khung Giờ Kém Nhất',
    ja: '最も損失の大きい時間帯',
    zh: '最差交易时段'
  },
  bestDayCard: {
    en: 'Best Trading Day',
    vi: 'Ngày Hiệu Quả Nhất',
    ja: '最も収益性の高い曜日',
    zh: '最佳交易日'
  },
  totalClosedTradesCard: {
    en: 'Total Executed Trades',
    vi: 'Tổng Số Lệnh Khớp',
    ja: '約定済み総取引数',
    zh: '已平仓总笔数'
  },
  worldTradingSessionsLabel: {
    en: 'Global Trading Sessions (UTC):',
    vi: 'Phiên giao dịch thế giới (UTC):',
    ja: '主要取引セッション (UTC):',
    zh: '全球交易时段 (UTC):'
  },
  asianSessionLabel: {
    en: '🌏 Asian (00-08h)',
    vi: '🌏 Á (00-08h)',
    ja: '🌏 アジア時間 (00-08時)',
    zh: '🌏 亚盘 (00-08h)'
  },
  europeanSessionLabel: {
    en: '🇬🇧 London (08-16h)',
    vi: '🇬🇧 Âu (08-16h)',
    ja: '🇬🇧 欧州時間 (08-16時)',
    zh: '🇬🇧 欧盘 (08-16h)'
  },
  americanSessionLabel: {
    en: '🇺🇸 New York (13-21h)',
    vi: '🇺🇸 Mỹ (13-21h)',
    ja: '🇺🇸 米国時間 (13-21時)',
    zh: '🇺🇸 美盘 (13-21h)'
  },
  overlapEuroUsLabel: {
    en: '🔥 London/NY Overlap (13-16h)',
    vi: '🔥 Trùng Âu/Mỹ (13-16h)',
    ja: '🔥 ロンドン/NY 重複 (13-16時)',
    zh: '🔥 欧美重叠高峰 (13-16h)'
  },
  weekNumberLabel: {
    en: 'Week {num}',
    vi: 'Tuần {num}',
    ja: '第 {num} 週',
    zh: '第 {num} 周'
  },
  closedTradesSuffix: {
    en: 'closed trades',
    vi: 'lệnh đã đóng',
    ja: '決済済み取引',
    zh: '笔已平仓'
  },
  notEnoughDataLabel: {
    en: 'Not enough data',
    vi: 'Chưa đủ dữ liệu',
    ja: 'データ不足',
    zh: '数据不足'
  },
  noMajorLossLabel: {
    en: 'No major loss',
    vi: 'Không có lỗ lớn',
    ja: '目立った損失なし',
    zh: '无显著亏损'
  },
  monthlyLossLabel: {
    en: '🔴 Loss this month',
    vi: '🔴 Lỗ trong tháng',
    ja: '🔴 当月の損失',
    zh: '🔴 当月亏损'
  }
};

// 2. Update types.ts
const typesPath = path.join(process.cwd(), 'src/i18n/types.ts');
let typesContent = fs.readFileSync(typesPath, 'utf-8');

const keyDeclarations = Object.keys(newKeys)
  .map(k => `  ${k}: string;`)
  .join('\n');

if (!typesContent.includes('candleShort: string;')) {
  typesContent = typesContent.replace(
    '  calendarHeaders: string;\n}',
    `  calendarHeaders: string;\n${keyDeclarations}\n}`
  );
  fs.writeFileSync(typesPath, typesContent, 'utf-8');
  console.log('✅ Updated src/i18n/types.ts');
}

// 3. Update all locales
const locales = ['en', 'vi', 'ja', 'zh'] as const;

for (const lang of locales) {
  const locPath = path.join(process.cwd(), 'src/i18n/locales', `${lang}.ts`);
  let content = fs.readFileSync(locPath, 'utf-8');
  const expIdx = content.indexOf('export const');
  const startIdx = content.indexOf('{', expIdx);
  const endIdx = content.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    const obj = JSON.parse(content.substring(startIdx, endIdx + 1));
    for (const [k, v] of Object.entries(newKeys)) {
      obj[k] = (v as any)[lang];
    }
    const newContent = `import { TranslationDict } from '../types';\n\nexport const ${lang}: TranslationDict = ${JSON.stringify(obj, null, 2)};\n`;
    fs.writeFileSync(locPath, newContent, 'utf-8');
    console.log(`✅ Updated src/i18n/locales/${lang}.ts`);
  }
}
console.log('✅ All translations populated successfully.');
