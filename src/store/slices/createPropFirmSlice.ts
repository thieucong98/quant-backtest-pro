export interface PropFirmSliceState {
  isPropFirmMode: boolean;
  propFirmDailyLossLimit: number;
  propFirmMaxDrawdownLimit: number;
  propFirmProfitTarget: number;
  propFirmStartingDayBalance: number;
}

export interface PropFirmSliceActions {
  togglePropFirmMode: (enabled?: boolean) => void;
  setPropFirmLimits: (dailyLoss: number, maxDD: number, target: number) => void;
  resetPropFirmDailyBalance: (balance: number) => void;
}

export type PropFirmSlice = PropFirmSliceState & PropFirmSliceActions;

export const createPropFirmSlice = (
  set: (fn: (state: any) => any) => void,
  _get: () => any,
  initialBalance: number = 10000
): PropFirmSlice => ({
  isPropFirmMode: true,
  propFirmDailyLossLimit: 5,
  propFirmMaxDrawdownLimit: 10,
  propFirmProfitTarget: 10,
  propFirmStartingDayBalance: initialBalance,

  togglePropFirmMode: (enabled) =>
    set((s) => ({ isPropFirmMode: enabled !== undefined ? enabled : !s.isPropFirmMode })),

  setPropFirmLimits: (dailyLoss, maxDD, target) =>
    set(() => ({
      propFirmDailyLossLimit: dailyLoss,
      propFirmMaxDrawdownLimit: maxDD,
      propFirmProfitTarget: target
    })),

  resetPropFirmDailyBalance: (balance) =>
    set(() => ({ propFirmStartingDayBalance: balance }))
});
