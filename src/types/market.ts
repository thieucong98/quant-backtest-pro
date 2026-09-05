export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';

export type ChartType = 'candlestick' | 'bar' | 'line' | 'area' | 'baseline' | 'heikin-ashi' | 'hollow';

export interface ChartSettings {
  chartType: ChartType;
  isLogScale: boolean;
  isPercentageScale: boolean;
  isInvertedScale: boolean;
  showCountdown: boolean;
  showWatermark: boolean;
  showGrid: boolean;
}

export type AssetCategory = 'FOREX' | 'METALS' | 'CRYPTO' | 'INDICES' | 'COMMODITIES';

export interface Candle {
  timestamp: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface InstrumentSpec {
  symbol: string;
  name: string;
  category: AssetCategory;
  contractSize: number;       // e.g. 100,000 (FX), 100 (Gold), 5,000 (Silver), 1 (BTC)
  pipSize: number;            // e.g. 0.0001 (EURUSD), 0.1 (XAU), 1.0 (BTC), 0.01 (USDJPY)
  digits: number;             // Number of decimal places to display
  minLot: number;             // e.g. 0.01 lot
  maxLot: number;             // e.g. 100.0 lot
  lotStep: number;            // e.g. 0.01
  defaultSpreadPips: number;  // Default simulated spread in pips
  commissionType: 'PER_LOT' | 'PERCENTAGE';
  commissionValue: number;    // e.g. $7/lot or 0.05%
  swapLongPips: number;       // Long swap in pips
  swapShortPips: number;      // Short swap in pips
  leverage: number;           // Account leverage (e.g. 1:100, 1:500)
  marginCurrency: 'USD' | 'BASE';
}

export type DrawingToolType = 'cursor' | 'trendline' | 'horizontal' | 'fibonacci' | 'rectangle' | 'measure';

export interface DrawingPoint {
  time: number;
  price: number;
}

export interface DrawingObject {
  id: string;
  type: DrawingToolType;
  points: DrawingPoint[];
  color: string;
  lineWidth: number;
  text?: string;
}

export interface ChartMarker {
  id: string;
  time: number;
  position: 'aboveBar' | 'belowBar' | 'inBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown' | 'circle' | 'square';
  text: string;
  tooltip?: string;
}
