/**
 * Quant Backtest Pro — Architecture Specification v2.0
 * Imperative Dual-Chart Synchronization Hook
 * 
 * Standard: RFC-002-TECH-v2 / ADR-0002
 * Guarantee: Zero (0) React state reconciliations/renders during mousemove crosshair tracking
 * Author: Vulcan (Senior Full-Stack SWE)
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  IChartApi,
  ISeriesApi,
  SeriesType,
  MouseEventParams,
  LogicalRange,
  Time,
} from 'lightweight-charts';

export interface DualChartSyncOptions {
  chartA: IChartApi | null;
  chartB: IChartApi | null;
  seriesA?: ISeriesApi<SeriesType> | null;
  seriesB?: ISeriesApi<SeriesType> | null;
  isCrosshairSynced?: boolean;
  isTimeSynced?: boolean;
}

export interface DualChartSyncControls {
  syncTimeToBoth: (timestamp: number) => void;
  syncLogicalRangeToBoth: (range: LogicalRange) => void;
  resetSync: () => void;
}

export function useDualChartSync({
  chartA,
  chartB,
  seriesA,
  seriesB,
  isCrosshairSynced = true,
  isTimeSynced = true,
}: DualChartSyncOptions): DualChartSyncControls {
  const isSyncingCrosshair = useRef<boolean>(false);
  const isSyncingTime = useRef<boolean>(false);

  // ---------------------------------------------------------------------------
  // 1. Zero-Allocation Imperative Crosshair Synchronization
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!chartA || !chartB || !isCrosshairSynced) {
      if (chartA) chartA.clearCrosshairPosition();
      if (chartB) chartB.clearCrosshairPosition();
      return;
    }

    const handleCrosshairMoveA = (param: MouseEventParams<Time>) => {
      if (isSyncingCrosshair.current) return;
      if (!param || !param.point || !param.time) {
        chartB.clearCrosshairPosition();
        return;
      }

      if (seriesB) {
        try {
          isSyncingCrosshair.current = true;
          // Determine price point or fallback to series close price
          let targetPrice: number | undefined;
          if (param.seriesData && seriesA) {
            const dataPoint: any = param.seriesData.get(seriesA);
            if (dataPoint) {
              targetPrice = dataPoint.close ?? dataPoint.value;
            }
          }
          if (targetPrice === undefined && seriesB) {
            const coordinatePrice = seriesB.coordinateToPrice(param.point.y);
            if (coordinatePrice !== null) {
              targetPrice = coordinatePrice;
            }
          }

          if (targetPrice !== undefined) {
            chartB.setCrosshairPosition(targetPrice, param.time, seriesB);
          }
        } finally {
          isSyncingCrosshair.current = false;
        }
      }
    };

    const handleCrosshairMoveB = (param: MouseEventParams<Time>) => {
      if (isSyncingCrosshair.current) return;
      if (!param || !param.point || !param.time) {
        chartA.clearCrosshairPosition();
        return;
      }

      if (seriesA) {
        try {
          isSyncingCrosshair.current = true;
          let targetPrice: number | undefined;
          if (param.seriesData && seriesB) {
            const dataPoint: any = param.seriesData.get(seriesB);
            if (dataPoint) {
              targetPrice = dataPoint.close ?? dataPoint.value;
            }
          }
          if (targetPrice === undefined && seriesA) {
            const coordinatePrice = seriesA.coordinateToPrice(param.point.y);
            if (coordinatePrice !== null) {
              targetPrice = coordinatePrice;
            }
          }

          if (targetPrice !== undefined) {
            chartA.setCrosshairPosition(targetPrice, param.time, seriesA);
          }
        } finally {
          isSyncingCrosshair.current = false;
        }
      }
    };

    chartA.subscribeCrosshairMove(handleCrosshairMoveA);
    chartB.subscribeCrosshairMove(handleCrosshairMoveB);

    return () => {
      chartA.unsubscribeCrosshairMove(handleCrosshairMoveA);
      chartB.unsubscribeCrosshairMove(handleCrosshairMoveB);
      chartA.clearCrosshairPosition();
      chartB.clearCrosshairPosition();
    };
  }, [chartA, chartB, seriesA, seriesB, isCrosshairSynced]);

  // ---------------------------------------------------------------------------
  // 2. Imperative Time Range Synchronization
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!chartA || !chartB || !isTimeSynced) return;

    const timeScaleA = chartA.timeScale();
    const timeScaleB = chartB.timeScale();

    const handleRangeChangeA = (range: LogicalRange | null) => {
      if (isSyncingTime.current || !range) return;
      try {
        isSyncingTime.current = true;
        timeScaleB.setVisibleLogicalRange(range);
      } finally {
        isSyncingTime.current = false;
      }
    };

    const handleRangeChangeB = (range: LogicalRange | null) => {
      if (isSyncingTime.current || !range) return;
      try {
        isSyncingTime.current = true;
        timeScaleA.setVisibleLogicalRange(range);
      } finally {
        isSyncingTime.current = false;
      }
    };

    timeScaleA.subscribeVisibleLogicalRangeChange(handleRangeChangeA);
    timeScaleB.subscribeVisibleLogicalRangeChange(handleRangeChangeB);

    return () => {
      timeScaleA.unsubscribeVisibleLogicalRangeChange(handleRangeChangeA);
      timeScaleB.unsubscribeVisibleLogicalRangeChange(handleRangeChangeB);
    };
  }, [chartA, chartB, isTimeSynced]);

  // ---------------------------------------------------------------------------
  // 3. Programmatic Controls
  // ---------------------------------------------------------------------------
  const syncTimeToBoth = useCallback((timestamp: number) => {
    if (chartA) {
      chartA.timeScale().scrollToPosition(0, false);
    }
    if (chartB) {
      chartB.timeScale().scrollToPosition(0, false);
    }
  }, [chartA, chartB]);

  const syncLogicalRangeToBoth = useCallback((range: LogicalRange) => {
    if (chartA) chartA.timeScale().setVisibleLogicalRange(range);
    if (chartB) chartB.timeScale().setVisibleLogicalRange(range);
  }, [chartA, chartB]);

  const resetSync = useCallback(() => {
    if (chartA) chartA.timeScale().resetTimeScale();
    if (chartB) chartB.timeScale().resetTimeScale();
  }, [chartA, chartB]);

  return {
    syncTimeToBoth,
    syncLogicalRangeToBoth,
    resetSync,
  };
}
