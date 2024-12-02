// 获取交易产品K线数据 获取K线数据。K线数据按请求的粒度分组返回，K线数据每个粒度最多可获取最近1,440条。

// import { NextApiRequest } from "next/types";
// import { API_KEY, API_PASSPHRASE, OKX_DOMAIN, signData } from "@/key";
/*

  所有REST私有请求头都必须包含以下内容：

OK-ACCESS-KEY字符串类型的APIKey。

OK-ACCESS-SIGN使用HMAC SHA256哈希函数获得哈希值，再使用Base-64编码（请参阅签名）。

OK-ACCESS-TIMESTAMP发起请求的时间（UTC），如：2020-12-08T09:08:57.715Z

OK-ACCESS-PASSPHRASE您在创建API密钥时指定的Passphrase。
*/
export async function GET() {
  // 从请求对象中获取 URL
  // const { searchParams } = new URL(request.url!);
  // 从 URL 的查询参数中获取参数值
  // const instrument_id = searchParams.get("instrument_id") || "BTC-USDT-SWAP";
  // const granularity = searchParams.get("granularity") || "15m";
  // const timestamp = new Date().toISOString();
  // const method = "GET";
  // const requestPath = `/api/v5/market/candles?instId=${instrument_id}&bar=${granularity}&limit=300`;
  // const body = "";
  // const signature = signData(timestamp, method, requestPath, body);
  // fetch 设置请求头 Authorization: OK-ACCESS-SIGNATURE
  // const headers = {
  //   "OK-ACCESS-KEY": API_KEY,
  //   "OK-ACCESS-SIGN": signature,
  //   "OK-ACCESS-TIMESTAMP": timestamp,
  //   "OK-ACCESS-PASSPHRASE": API_PASSPHRASE,
  // };
  // try {
  //   const data = await fetch(OKX_DOMAIN + requestPath);
  //   const json = await data.json();
  //   return Response.json(json);
  // } catch (error) {
  //   console.log(error);
  //   return Response.json({ error });
  // }
}
