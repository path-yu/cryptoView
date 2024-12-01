import { CandleData, TrendAnalysis } from "@/types";

export function calculateEMA(data: CandleData[], period: number): number[] {
  const k = 2 / (period + 1);
  const emaArray: number[] = [data[0].close]; // 初始化EMA值为第一个收盘价

  for (let i = 1; i < data.length; i++) {
    const price = data[i].close;
    const ema = price * k + emaArray[i - 1] * (1 - k);
    emaArray.push(ema);
  }
  return emaArray;
}

export function calculateRSI(data: CandleData[], period: number): number[] {
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const difference = data[i].close - data[i - 1].close;
    if (difference >= 0) {
      gains.push(difference);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(-difference);
    }
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const rsiArray: number[] = [];
  rsiArray.push(100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgGain / avgLoss;
    rsiArray.push(100 - 100 / (1 + rs));
  }

  return rsiArray;
}

export function calculatePriceRange(data: CandleData[]): {
  high: number;
  low: number;
} {
  const high = Math.max(...data.map((d) => d.high));
  const low = Math.min(...data.map((d) => d.low));
  return { high, low };
}
function isRangeBound(
  ema12: number[],
  ema26: number[],
  rsi14: number[],
  data: CandleData[]
): boolean {
  const priceRange = calculatePriceRange(data);
  const currentPrice = data[data.length - 1].close;

  // 判断价格是否在区间内波动
  const isPriceRangeBound =
    currentPrice >= priceRange.low && currentPrice <= priceRange.high;

  // 判断均线是否交缠
  const isEmaIntertwined =
    Math.abs(ema12[ema12.length - 1] - ema26[ema26.length - 1]) < 0.01; // 根据数据调整阈值

  // 判断RSI是否在50附近
  const isRsiNeutral =
    rsi14[rsi14.length - 1] >= 45 && rsi14[rsi14.length - 1] <= 55;

  return isPriceRangeBound && isEmaIntertwined && isRsiNeutral;
}
export function determineTrend(
  ema12: number[],
  ema26: number[],
  rsi14: number[],
  data: CandleData[]
): TrendAnalysis {
  if (isRangeBound(ema12, ema26, rsi14, data)) {
    return "neutral";
  }
  const currentEma12 = ema12[ema12.length - 1];
  const currentEma26 = ema26[ema26.length - 1];
  if (currentEma12 > currentEma26) {
    return "bullish";
  } else if (currentEma12 < currentEma26) {
    return "bearish";
  } else {
    return "neutral";
  }
}
