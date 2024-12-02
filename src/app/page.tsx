"use client";

import { useState, useEffect, Key } from "react";

import { Card, CardHeader, CardBody } from "@nextui-org/card";
import { CurrencyPair, CandleData } from "@/types";
import { createWebSocket } from "@/okx-websocket";
import { Autocomplete, AutocompleteItem } from "@nextui-org/autocomplete";
import { OKX_DOMAIN } from "@/key";
import { Chart, dispose, init, Nullable, registerLocale } from "klinecharts";
import { Spinner } from "@nextui-org/spinner";
import TimeFrameSelector from "@/components/TimeFrameSelector";
import {
  calculateEMA,
  calculateRSI,
  calculateSupportResistance,
  determineTrend,
  formatCandleData,
  generateTradeRecommendations,
  SupportResistanceLevels,
} from "./utils";
import { useRef } from "react";
registerLocale("zh-CN", {
  time: "时间：",
  open: "开盘：",
  high: "最高：",
  low: "最低：",
  close: "收盘：",
  volume: "成交量：",
  turnover: "成交额：",
  change: "涨幅：",
});
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
  const selectPairRef = useRef<string>("BTC-USDT-SWAP");
  // 当前压力位和阻力位数据 使用对象保存
  const [levels, setLevels] = useState<SupportResistanceLevels | null>();
  // 交易建议
  const [advice, setAdvice] = useState<{
    entryPoints: string[];
    exitPoints: string[];
  }>();
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
    const candles = formatCandleData(data.data);
    const moreData = await fetchMoreData(candles);
    const result = [...moreData, ...candles.reverse()];
    chartEle!.applyNewData(result);
    // 计算当前走势的压力位和支撑位
    const levels = calculateSupportResistance(result);
    setLevels(levels);
    console.log(generateTradeRecommendations(result, levels));

    setAdvice(generateTradeRecommendations(result, levels));
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
      listData.current = chartEle?.getDataList() as CandleData[];
      setCurrentPrice(data.close);
    }).then((socket) => {
      ws = socket;
    });
  }
  // 将这个函数 改写成递归调用3次 每次传入上一次数据的最后一项 将所有fetch的返回数据进行合并
  const fetchMoreData = async (
    data: CandleData[],
    iteration = 3
  ): Promise<CandleData[]> => {
    if (iteration === 0) {
      return data;
    }

    const lastItem = iteration === 3 ? data[data.length - 1] : data[0];
    const res = await fetch(
      OKX_DOMAIN +
        `/api/v5/market/history-candles?after=${lastItem?.timestamp}&instId=${selectPairRef.current}`
    );
    const response = await res.json();
    const candles = formatCandleData(response.data);

    // 第一次获取的数据直接返回，不合并
    if (iteration === 3) {
      return fetchMoreData(candles, iteration - 1);
    }

    // 之后的每次获取都将新数据插入到前面
    return fetchMoreData([...candles.reverse(), ...data], iteration - 1);
  };

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
    chartEle = init("chart", {
      locale: "zh-CN",
    });

    chartEle!.setLoadMoreDataCallback(({ type, callback }) => {
      const firstData = chartEle?.getDataList()[0] as CandleData;
      console.log(type);

      fetch(
        OKX_DOMAIN +
          `/api/v5/market/history-candles?after=${firstData?.timestamp}&instId=${selectPairRef.current}`
      ).then(async (res) => {
        const data = await res.json();
        const candles = formatCandleData(data.data);
        console.log(candles);

        if (type === "forward") {
          callback(candles);
        }
        // const newData = [...candles.reverse(), ...listData.current];
        // chartEle?.applyNewData(newData);
      });
      // 获取更多k线数据
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
      chartEle!.setPrecision({ price: 1, volume: 6 });
    } else {
      chartEle!.setPrecision({ price: calculatePrecision(price!), volume: 6 });
    }
  };
  function calculatePrecision(price: string): number {
    const decimalPart = price.toString().split(".")[1];
    return decimalPart ? decimalPart.length : 0;
  }

  const handleSelectProductChange = (value: Key | null) => {
    setSelectedPair(value as string);
    fetchData(value as string, selectedTimeFrame);
    selectPairRef.current = value as string;
    if (value === "BTC-USDT-SWAP" || value === "BTC-USD-SWAP") {
      chartEle!.setPrecision({ price: 1, volume: 6 });
    } else {
      callback = () => {
        console.log(listData.current[0].close);

        chartEle!.setPrecision({
          price: calculatePrecision(listData.current[0].close! + ""),
          volume: 6,
        });
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
        <div className="mb-6 flex space-x-4 flex-wrap">
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
            <div className="text-2xl font-bold mt-2">
              当前价格: ${currentPrice}
            </div>
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
              width: "100vw",
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
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold text-center mb-6">
            支撑位和压力位
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white shadow-md rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">Pivot Points</h2>
              <ul className="list-disc list-inside">
                <li>Pivot: {levels?.pivotPoints.pivot}</li>
                <li>Resistance 1: {levels?.pivotPoints.resistance1}</li>
                <li>Support 1: {levels?.pivotPoints.support1}</li>
                <li>Resistance 2: {levels?.pivotPoints.resistance2}</li>
                <li>Support 2: {levels?.pivotPoints.support2}</li>
              </ul>
            </div>
            <div className="bg-white shadow-md rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">Fibonacci Levels</h2>
              <ul className="list-disc list-inside">
                {levels?.fibonacciLevels
                  ? Object.entries(levels?.fibonacciLevels).map(
                      ([key, value]) => (
                        <li key={key}>
                          {key}: {value}
                        </li>
                      )
                    )
                  : null}
              </ul>
            </div>
            <div>
              <div className="bg-white shadow-md rounded-lg p-4 mt-4">
                <h2 className="text-xl font-semibold mb-2">
                  交易建议:{advice?.entryPoints[0]} {advice?.exitPoints[0]}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
