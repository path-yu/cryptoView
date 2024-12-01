import type { NextRequest } from "next/server";
import crypto from "crypto";
import { NextApiRequest } from "next/types";
import { API_KEY, API_PASSPHRASE, signData } from "@/key";

// const API_KEY = process.env.OKX_API_KEY;
// const API_SECRET = process.env.OKX_API_SECRET;
// const API_PASSPHRASE = process.env.OKX_API_PASSPHRASE;

export async function GET(req: NextApiRequest) {
  // 创建一个新的 Date 对象，表示当前时间
  const date = new Date(); // 获取时间戳（单位是毫秒）
  const timestampMillis = date.getTime();
  // 将毫秒转换为秒
  const timestamp = Math.floor(timestampMillis / 1000);
  const signature = signData(
    timestamp.toString(),
    "GET",
    "/users/self/verify",
    ""
  );
  return Response.json({
    apiKey: API_KEY,
    passphrase: API_PASSPHRASE,
    timestamp,
    sign: signature,
  });
}
