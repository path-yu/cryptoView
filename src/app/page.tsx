"use client";

import { useState, useEffect, Key } from "react";

import { Card, CardHeader, CardBody } from "@nextui-org/card";
import { CurrencyPair, CandleData } from "@/types";
import { createWebSocket } from "@/okx-websocket";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { OKX_DOMAIN } from "@/key";
import { Chart, dispose, init, Nullable } from "klinecharts";
import { Spinner } from "@nextui-org/spinner";
import TimeFrameSelector from "@/components/TimeFrameSelector";
import { calculateEMA, calculateRSI, determineTrend } from "./utils";
import { useRef } from "react";

let chartEle: Nullable<Chart>;
let ws: WebSocket;
const timeList = ["1m", "3m", "5m", "15m", "1H", "2H", "4H", "1D", "1W", "1M"];
//回调函数
let callback: () => void;
export default function CurrencyAnalysis() {
  const [currencyPairs, setCurrPairs] = useState<CurrencyPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>("BTC-USDT-SWAP");
  const [trend, setTrend] = useState<string>();
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  // 时间级别选择列表
  // 使用useRef 保存k线数据列表
  const listData = useRef<CandleData[]>([]);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(timeList[3]);

  const handleTimeFrameSelect = (timeFrame: string) => {
    setSelectedTimeFrame(timeFrame);
    // 这里您可以添加逻辑来根据选择的时间框架更新图表数据
    fetchData(selectedPair, timeFrame);
  };
  // 数据加载loading
  const [loading, setLoading] = useState(true);
  async function fetchData(currentPair?: string, time?: string) {
    const resPair = currentPair ? currentPair : selectedPair;
    const resTime = time ? time : selectedTimeFrame;
    // 关闭旧连接
    if (ws) {
      ws.close();
      chartEle?.clearData();
      setLoading(true);
    }
    if (!loading) {
      setLoading(true);
    }

    // 获取k线数据
    const res = await fetch(
      `https://www.okx.com/api/v5/market/candles?instId=${resPair}&bar=${resTime}&limit=303&t=${new Date().getTime()}`
    );
    let curParsId;
    if (!currencyPairs.length) {
      //获取所有合约产品
      const products = await fetch(
        `${OKX_DOMAIN + "/api/v5/public/instruments?instType=SWAP"}`
      );
      const productsData = await products.json();
      const paris = productsData.data.map(
        (item: { instId: string; name: string }) => {
          return {
            instId: item.instId,
            name: item.instId,
          };
        }
      );
      setCurrPairs(paris);
      setSelectedPair(paris[0].instId);
      curParsId = paris[0].instId;
    } else {
      curParsId = resPair;
    }

    const data = await res.json();
    const candles = data.data.map((candle: never) => {
      return {
        timestamp: parseInt(candle[0]),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
      };
    }) as CandleData[];
    chartEle!.applyNewData(candles.reverse());
    listData.current = candles;
    if (callback) {
      callback();
    } else {
      setPricePrecision(candles[0].close + "");
    }
    calculateTrend();
    setLoading(false);
    createWebSocket(curParsId, resTime, (data) => {
      chartEle!.updateData(data);
      setCurrentPrice(data.close);
    }).then((socket) => {
      ws = socket;
    });
  }
  // 计算当前价格趋势
  const calculateTrend = () => {
    const data = chartEle?.getDataList() as CandleData[];
    const ema12 = calculateEMA(data, 12); // 计算12日EMA
    const ema26 = calculateEMA(data, 26); // 计算26日EMA
    const rsi14 = calculateRSI(data, 14); // 计算14日RSI

    const marketTrend = determineTrend(ema12, ema26, rsi14, data);

    setTrend(marketTrend);
  };
  useEffect(() => {
    chartEle = init("chart");
    // 设置价格精度
    chartEle!.setLoadDataCallback(({ type }) => {
      if (type === "forward") {
      } else {
      }
    });
    fetchData();
    return () => {
      dispose("chart");
      if (ws) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 编写一个设置价格精度函数
  const setPricePrecision = (price?: string) => {
    if (selectedPair === "BTC-USDT-SWAP" || selectedPair === "BTC-USD-SWAP") {
      chartEle!.setPriceVolumePrecision(1, 6);
    } else {
      chartEle!.setPriceVolumePrecision(calculatePrecision(price!), 6);
    }
  };
  function calculatePrecision(price: string): number {
    const decimalPart = price.toString().split(".")[1];
    return decimalPart ? decimalPart.length : 0;
  }

  const handleSelectProductChange = (value: Key | null) => {
    setSelectedPair(value as string);
    fetchData(value as string, selectedTimeFrame);
    if (value === "BTC-USDT-SWAP" || value === "BTC-USD-SWAP") {
      chartEle!.setPriceVolumePrecision(1, 6);
    } else {
      callback = () => {
        chartEle!.setPriceVolumePrecision(
          calculatePrecision(listData.current[0].close! + ""),
          6
        );
      };
    }
  };
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="mt-2">
          <p>OKX实时货币交易分析</p>
          <p>选择币种并查看实时K线数据和趋势分析</p>
        </div>
      </CardHeader>
      <CardBody>
        <div className="mb-6 flex space-x-4">
          <Autocomplete
            selectedKey={selectedPair}
            onSelectionChange={handleSelectProductChange}
            label="选择币种"
          >
            {currencyPairs.map((pair) => (
              <AutocompleteItem key={pair.instId} value={pair.instId}>
                {pair.name}
              </AutocompleteItem>
            ))}
          </Autocomplete>
          {currentPrice && (
            <div className="text-2xl font-bold">当前价格: ${currentPrice}</div>
          )}
        </div>
        {/* 选择时间周期 */}
        <TimeFrameSelector
          timeFrames={timeList}
          selectedTimeFrame={selectedTimeFrame}
          onSelectTimeFrame={handleTimeFrameSelect}
        />
        {loading ? (
          <div
            style={{
              width: "800px",
              height: "600px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
            }}
          >
            <Spinner label="Loading..." color="warning" />
          </div>
        ) : null}
        <div
          id="chart"
          style={{
            width: 800,
            height: 600,
          }}
        />
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">当前趋势分析</h3>
          <p
            className={`text-xl font-bold ${
              trend === "bullish"
                ? "text-green-600"
                : trend === "bearish"
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {trend === "bullish"
              ? "多头趋势"
              : trend === "bearish"
              ? "空头趋势"
              : "中性趋势"}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
