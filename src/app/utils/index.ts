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
// 格式化k线数据
export function formatCandleData(data: []): CandleData[] {
  return data.map((candle) => ({
    timestamp: parseInt(candle[0]),
    open: +candle[1],
    high: +candle[2],
    low: +candle[3],
    close: +candle[4],
    volume: +candle[5],
    // 成交额
    turnover: parseFloat(candle[7]),
  }));
}
export function isValid<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
// 计算简单移动平均线（SMA）
function calculateSMA(data: CandleData[], period: number): number[] {
  const sma: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data
      .slice(i - period + 1, i + 1)
      .reduce((acc, val) => acc + val.close, 0);
    sma.push(sum / period);
  }
  return sma;
}

// 计算布林带（Bollinger Bands）
interface BollingerBands {
  upper: number[];
  lower: number[];
}

function calculateBollingerBands(
  data: CandleData[],
  period: number,
  stdDevMultiplier: number
): BollingerBands {
  const sma = calculateSMA(data, period);
  const bands: BollingerBands = { upper: [], lower: [] };
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = sma[i - period + 1];
    const stdDev = Math.sqrt(
      slice.reduce((acc, val) => acc + Math.pow(val.close - mean, 2), 0) /
        period
    );
    bands.upper.push(mean + stdDevMultiplier * stdDev);
    bands.lower.push(mean - stdDevMultiplier * stdDev);
  }
  return bands;
}

// 计算支撑位和压力位（Pivot Points）
interface PivotPoints {
  pivot: number;
  resistance1: number;
  support1: number;
  resistance2: number;
  support2: number;
}

function calculatePivotPoints(
  high: number,
  low: number,
  close: number
): PivotPoints {
  const pivot = (high + low + close) / 3;
  const resistance1 = 2 * pivot - low;
  const support1 = 2 * pivot - high;
  const resistance2 = pivot + (high - low);
  const support2 = pivot - (high - low);

  return { pivot, resistance1, support1, resistance2, support2 };
}

// 计算费波纳奇回调水平（Fibonacci Retracement）
interface FibonacciLevels {
  [key: string]: number;
}

function calculateFibonacciRetracement(
  high: number,
  low: number
): FibonacciLevels {
  const diff = high - low;
  return {
    "0%": high,
    "23.6%": high - 0.236 * diff,
    "38.2%": high - 0.382 * diff,
    "50%": high - 0.5 * diff,
    "61.8%": high - 0.618 * diff,
    "100%": low,
  };
}

// 综合计算压力位和支撑位
export interface SupportResistanceLevels {
  pivotPoints: PivotPoints;
  fibonacciLevels: FibonacciLevels;
  bollingerBands: BollingerBands;
}

export function calculateSupportResistance(
  data: CandleData[]
): SupportResistanceLevels {
  const recentHigh = Math.max(...data.map((c) => +c.high));
  const recentLow = Math.min(...data.map((c) => +c.low));
  const recentClose = +data[data.length - 1].close;

  const pivotPoints = calculatePivotPoints(recentHigh, recentLow, recentClose);
  const fibonacciLevels = calculateFibonacciRetracement(recentHigh, recentLow);
  const bollingerBands = calculateBollingerBands(data, 20, 2); // 以20日移动平均线和2倍标准差为例

  return {
    pivotPoints,
    fibonacciLevels,
    bollingerBands,
  };
}
// 生成交易建议
export function generateTradeRecommendations(
  data: CandleData[],
  levels: SupportResistanceLevels
): { entryPoints: string[]; exitPoints: string[] } {
  const lastPrice = data[data.length - 1].close;
  const entryPoints: string[] = [];
  const exitPoints: string[] = [];

  // 入场建议
  if (
    lastPrice <= levels.pivotPoints.support1 ||
    lastPrice <= levels.fibonacciLevels["61.8%"] ||
    lastPrice <=
      levels.bollingerBands.lower[levels.bollingerBands.lower.length - 1]
  ) {
    entryPoints.push("当前价格接近支撑位或布林带下轨，可以考虑入场做多。");
  }

  // 离场建议
  if (
    lastPrice >= levels.pivotPoints.resistance1 ||
    lastPrice >= levels.fibonacciLevels["23.6%"] ||
    lastPrice >=
      levels.bollingerBands.upper[levels.bollingerBands.upper.length - 1]
  ) {
    exitPoints.push("当前价格接近压力位或布林带上轨，可以考虑离场。");
  }

  return { entryPoints, exitPoints };
}
