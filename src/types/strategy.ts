import { Candle } from './market';
import { Position } from './order';

export interface IndicatorLibrary {
  sma(period: number, offset?: number): number;
  ema(period: number, offset?: number): number;
  rsi(period?: number, offset?: number): number;
  macd(fast?: number, slow?: number, signal?: number, offset?: number): { macd: number; signal: number; hist: number };
  bollingerBands(period?: number, stdDev?: number, offset?: number): { upper: number; middle: number; lower: number };
  atr(period?: number, offset?: number): number;
  highest(period: number, offset?: number): number;
  lowest(period: number, offset?: number): number;
}

export interface StrategyAccountInfo {
  balance: number;
  equity: number;
  freeMargin: number;
  openPositionsCount: number;
  openPositions: Position[];
}

export interface StrategyExecutionAPI {
  buy(params: {
    lotSize: number;
    stopLossPips?: number;
    takeProfitPips?: number;
    stopLossPrice?: number;
    takeProfitPrice?: number;
    trailingStopPips?: number;
    comment?: string;
  }): void;

  sell(params: {
    lotSize: number;
    stopLossPips?: number;
    takeProfitPips?: number;
    stopLossPrice?: number;
    takeProfitPrice?: number;
    trailingStopPips?: number;
    comment?: string;
  }): void;

  closeAll(): void;
  closePosition(positionId: string): void;
  modifySLTP(positionId: string, newSL?: number, newTP?: number): void;
  log(message: string): void;
}

export interface AIStrategyDefinition {
  id: string;
  name: string;
  description: string;
  code: string;
  parameters: Record<string, number | string | boolean>;
  enabled: boolean;
  createdAt: number;
}

export interface StrategyLogMessage {
  id: string;
  timestamp: number;
  type: 'INFO' | 'SIGNAL' | 'ERROR';
  message: string;
}
