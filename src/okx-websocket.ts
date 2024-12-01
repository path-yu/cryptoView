import { CandleData } from "./types";

export async function createWebSocket(
  instId: string,
  time: string,
  onMessage: (data: CandleData) => void
) {
  // 公共频道
  // const ws = new WebSocket("wss://ws.okx.com:8443/ws/v5/public");
  // 业务频道 ws
  const wsBusiness = new WebSocket("wss://ws.okx.com:8443/ws/v5/business");
  wsBusiness.onopen = async () => {
    wsBusiness.send(
      JSON.stringify({
        op: "subscribe",
        args: [
          {
            channel: `mark-price-candle${time}`,
            instType: "SWAP",
            instId: instId,
          },
        ],
      })
    );
  };

  wsBusiness.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.data && data.data[0]) {
      /*
       开始时间，Unix时间戳的毫秒数格式，如 1597026383085
      > o	String	开盘价格
      > h	String	最高价格
      > l	String	最低价格
      > c	String	收盘价格
      > vol	String	交易量，以张为单位
      如果是衍生品合约，数值为合约的张数。
      如果是币币/币币杠杆，数值为交易货币的数量。
      > volCcy	String	交易量，以币为单位
      如果是衍生品合约，数值为交易货币的数量。
      如果是币币/币币杠杆，数值为计价货币的数量。
      > volCcyQuote	String	交易量，以计价货币为单位
      如 BTC-USDT和BTC-USDT-SWAP单位均是USDT。
      BTC-USD-SWAP单位是USD。
      > confirm	String	K线状态
      0：K线未完结
      1：K线已完结
       */
      const [timestamp, open, high, low, close, vol] = data.data[0];
      onMessage({
        timestamp: parseInt(timestamp),
        open: open,
        high: high,
        low: low,
        close: close,
        vol: vol,
      });
    }
  };

  return wsBusiness;
}
