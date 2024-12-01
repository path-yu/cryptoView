export type CurrencyPair = {
  instId: string;
  name: string;
};

export type CandleData = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;
};

export type TrendAnalysis = "bullish" | "bearish" | "neutral" | "null";
