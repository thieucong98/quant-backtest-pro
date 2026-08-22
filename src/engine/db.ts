import Dexie, { type EntityTable } from 'dexie';
import { Candle, DrawingObject } from '../types/market';
import { Position } from '../types/order';
import { AIStrategyDefinition } from '../types/strategy';

export interface DatasetRecord {
  id: string; // key: `${symbol}_${timeframe}`
  symbol: string;
  timeframe: string;
  candleCount: number;
  startDate: number;
  endDate: number;
  candles: Candle[];
  updatedAt: number;
}

export interface SessionRecord {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  initialBalance: number;
  finalBalance: number;
  finalEquity: number;
  currentIndex: number;
  trades: Position[];
  drawings: DrawingObject[];
  strategyId?: string;
  savedAt: number;
}

const db = new Dexie('QuantBacktestProDB') as Dexie & {
  datasets: EntityTable<DatasetRecord, 'id'>;
  strategies: EntityTable<AIStrategyDefinition, 'id'>;
  sessions: EntityTable<SessionRecord, 'id'>;
};

db.version(1).stores({
  datasets: 'id, symbol, timeframe, updatedAt',
  strategies: 'id, name, enabled, createdAt',
  sessions: 'id, name, symbol, savedAt'
});

export { db };
