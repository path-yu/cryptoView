export const API_KEY = "5d1cc3a5-2efa-436d-9594-58ce2aade07b";
export const API_SECRET = "4BBA18722CA934E78F701873B61B43B6";
export const API_PASSPHRASE = "fengyusha999Q!";
import crypto from "crypto";

export function signData(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string = ""
) {
  const message = timestamp + method + requestPath + body;
  const hmac = crypto.createHmac("sha256", API_SECRET!);
  return hmac.update(message).digest("base64");
}
// okx 域名
export const OKX_DOMAIN = "https://www.okx.com";
