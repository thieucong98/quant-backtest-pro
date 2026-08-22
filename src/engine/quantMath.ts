import { InstrumentSpec } from '../types/market';
import { OrderSide } from '../types/order';

export class MultiAssetMathEngine {
  /**
   * Tính giá trị tương đương tiền USD của 1 Pip
   */
  public static calculatePipValue(
    spec: InstrumentSpec,
    lotSize: number,
    currentPrice: number
  ): number {
    switch (spec.category) {
      case 'METALS':
        // XAUUSD (100 oz): 1 pip (0.10) * 100 = $10 per lot
        // XAGUSD (5000 oz): 1 pip (0.01) * 5000 = $50 per lot
        return lotSize * spec.contractSize * spec.pipSize;

      case 'CRYPTO':
        // BTCUSD: 1 pip ($1.0) * 1 BTC = $1 per lot
        return lotSize * spec.contractSize * spec.pipSize;

      case 'INDICES':
        // DXY / US30
        return lotSize * spec.contractSize * spec.pipSize;

      case 'FOREX':
      default:
        if (spec.symbol.endsWith('USD')) {
          // EURUSD, GBPUSD: lot * 100,000 * 0.0001 = $10 / pip
          return lotSize * spec.contractSize * spec.pipSize;
        } else if (spec.symbol.startsWith('USD')) {
          // USDJPY: (lot * 100,000 * 0.01) / currentPrice
          return (lotSize * spec.contractSize * spec.pipSize) / currentPrice;
        } else {
          // Cross currency
          return lotSize * spec.contractSize * spec.pipSize;
        }
    }
  }

  /**
   * Tính PnL (Lợi nhuận/Thua lỗ)
   */
  public static calculatePnL(
    spec: InstrumentSpec,
    side: OrderSide,
    lotSize: number,
    entryPrice: number,
    currentPrice: number
  ): number {
    const priceDiff = side === 'BUY' ? (currentPrice - entryPrice) : (entryPrice - currentPrice);

    switch (spec.category) {
      case 'METALS':
      case 'CRYPTO':
      case 'INDICES':
        return lotSize * spec.contractSize * priceDiff;

      case 'FOREX':
      default:
        if (spec.symbol.endsWith('USD')) {
          return lotSize * spec.contractSize * priceDiff;
        } else if (spec.symbol.startsWith('USD')) {
          return (lotSize * spec.contractSize * priceDiff) / (currentPrice || 1);
        } else {
          return lotSize * spec.contractSize * priceDiff;
        }
    }
  }

  /**
   * Tính Margin yêu cầu cho vị thế
   */
  public static calculateRequiredMargin(
    spec: InstrumentSpec,
    lotSize: number,
    currentPrice: number
  ): number {
    const notionalValue = lotSize * spec.contractSize * currentPrice;
    return notionalValue / (spec.leverage || 100);
  }

  /**
   * Tính Phí hoa hồng (Commission)
   */
  public static calculateCommission(
    spec: InstrumentSpec,
    lotSize: number,
    currentPrice: number
  ): number {
    if (spec.commissionType === 'PER_LOT') {
      return spec.commissionValue * lotSize;
    } else {
      const notionalValue = lotSize * spec.contractSize * currentPrice;
      return notionalValue * (spec.commissionValue / 100);
    }
  }
}
