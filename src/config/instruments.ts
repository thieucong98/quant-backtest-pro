import { InstrumentSpec } from '../types/market';

export const INSTRUMENTS: Record<string, InstrumentSpec> = {
  // === FOREX MAJORS & CROSSES ===
  'EURUSD': {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'FOREX',
    contractSize: 100000,
    pipSize: 0.0001,
    digits: 5,
    minLot: 0.01,
    maxLot: 100,
    lotStep: 0.01,
    defaultSpreadPips: 1.0,
    commissionType: 'PER_LOT',
    commissionValue: 7.0,
    swapLongPips: -4.5,
    swapShortPips: 1.2,
    leverage: 500,
    marginCurrency: 'USD'
  },
  'GBPUSD': {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    category: 'FOREX',
    contractSize: 100000,
    pipSize: 0.0001,
    digits: 5,
    minLot: 0.01,
    maxLot: 100,
    lotStep: 0.01,
    defaultSpreadPips: 1.4,
    commissionType: 'PER_LOT',
    commissionValue: 7.0,
    swapLongPips: -3.2,
    swapShortPips: 0.8,
    leverage: 500,
    marginCurrency: 'USD'
  },
  'USDJPY': {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    category: 'FOREX',
    contractSize: 100000,
    pipSize: 0.01,
    digits: 3,
    minLot: 0.01,
    maxLot: 100,
    lotStep: 0.01,
    defaultSpreadPips: 1.2,
    commissionType: 'PER_LOT',
    commissionValue: 7.0,
    swapLongPips: 6.8,
    swapShortPips: -12.5,
    leverage: 500,
    marginCurrency: 'USD'
  },
  'GBPJPY': {
    symbol: 'GBPJPY',
    name: 'British Pound / Japanese Yen',
    category: 'FOREX',
    contractSize: 100000,
    pipSize: 0.01,
    digits: 3,
    minLot: 0.01,
    maxLot: 100,
    lotStep: 0.01,
    defaultSpreadPips: 1.8,
    commissionType: 'PER_LOT',
    commissionValue: 7.0,
    swapLongPips: 8.5,
    swapShortPips: -14.2,
    leverage: 500,
    marginCurrency: 'USD'
  },
  'AUDUSD': {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    category: 'FOREX',
    contractSize: 100000,
    pipSize: 0.0001,
    digits: 5,
    minLot: 0.01,
    maxLot: 100,
    lotStep: 0.01,
    defaultSpreadPips: 1.1,
    commissionType: 'PER_LOT',
    commissionValue: 7.0,
    swapLongPips: -2.1,
    swapShortPips: 0.5,
    leverage: 500,
    marginCurrency: 'USD'
  },

  // === PRECIOUS METALS ===
  'XAUUSD': {
    symbol: 'XAUUSD',
    name: 'Gold (100 oz) / US Dollar',
    category: 'METALS',
    contractSize: 100, // 100 oz
    pipSize: 0.10,     // 1 pip = $0.10, $1.00 move = 10 pips = $100 per standard lot
    digits: 2,
    minLot: 0.01,
    maxLot: 50,
    lotStep: 0.01,
    defaultSpreadPips: 2.0, // 20 cents
    commissionType: 'PER_LOT',
    commissionValue: 7.0,
    swapLongPips: -18.5,
    swapShortPips: 9.2,
    leverage: 100,
    marginCurrency: 'USD'
  },
  'XAGUSD': {
    symbol: 'XAGUSD',
    name: 'Silver (5000 oz) / US Dollar',
    category: 'METALS',
    contractSize: 5000, // 5000 oz
    pipSize: 0.01,      // 1 pip = $0.01, $0.10 move = $500 per standard lot
    digits: 3,
    minLot: 0.01,
    maxLot: 20,
    lotStep: 0.01,
    defaultSpreadPips: 2.5,
    commissionType: 'PER_LOT',
    commissionValue: 7.0,
    swapLongPips: -8.0,
    swapShortPips: 3.5,
    leverage: 50,
    marginCurrency: 'USD'
  },

  // === CRYPTOCURRENCY ===
  'BTCUSD': {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    category: 'CRYPTO',
    contractSize: 1,    // 1 BTC
    pipSize: 1.0,       // 1 pip = $1.00 move
    digits: 2,
    minLot: 0.01,
    maxLot: 20,
    lotStep: 0.01,
    defaultSpreadPips: 12.0, // $12 spread
    commissionType: 'PERCENTAGE',
    commissionValue: 0.04, // 0.04% maker/taker
    swapLongPips: -15.0,
    swapShortPips: -15.0,
    leverage: 20,
    marginCurrency: 'USD'
  },
  'ETHUSD': {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    category: 'CRYPTO',
    contractSize: 1,
    pipSize: 0.1,
    digits: 2,
    minLot: 0.05,
    maxLot: 100,
    lotStep: 0.01,
    defaultSpreadPips: 1.5,
    commissionType: 'PERCENTAGE',
    commissionValue: 0.04,
    swapLongPips: -8.0,
    swapShortPips: -8.0,
    leverage: 20,
    marginCurrency: 'USD'
  },

  // === INDICES ===
  'DXY': {
    symbol: 'DXY',
    name: 'US Dollar Index',
    category: 'INDICES',
    contractSize: 1000,
    pipSize: 0.01,
    digits: 3,
    minLot: 0.1,
    maxLot: 100,
    lotStep: 0.1,
    defaultSpreadPips: 1.5,
    commissionType: 'PER_LOT',
    commissionValue: 5.0,
    swapLongPips: 0,
    swapShortPips: 0,
    leverage: 100,
    marginCurrency: 'USD'
  },
  'US30': {
    symbol: 'US30',
    name: 'Wall Street 30 / Dow Jones',
    category: 'INDICES',
    contractSize: 1,
    pipSize: 1.0,
    digits: 1,
    minLot: 0.1,
    maxLot: 50,
    lotStep: 0.1,
    defaultSpreadPips: 2.5,
    commissionType: 'PER_LOT',
    commissionValue: 4.0,
    swapLongPips: -12.0,
    swapShortPips: 4.0,
    leverage: 50,
    marginCurrency: 'USD'
  }
};

export const DEFAULT_INSTRUMENT = INSTRUMENTS['XAUUSD'];
