export function getPrecision(number: number): number {
  // 将数字转换为字符串
  const numStr = number.toString();

  // 如果是科学计数法表示
  if (numStr.includes("e")) {
    const [base, exponent] = numStr.split("e");
    const decimalPlaces =
      (base.split(".")[1]?.length || 0) - parseInt(exponent);
    return Math.max(0, decimalPlaces);
  }

  // 查找小数点的位置
  const dotIndex = numStr.indexOf(".");

  // 如果没有小数点，精度为 0
  if (dotIndex === -1) {
    return 0;
  }

  // 计算小数点后的数字位数
  const decimalPlaces = numStr.split(".")[1]?.length || 0;

  return decimalPlaces;
}
export function toDecimalString(number: number): string {
  const [base, exponent] = number.toString().split("e");
  const exp = parseInt(exponent, 10);
  let decimalString = "";

  // 处理正负数
  if (exp < 0) {
    decimalString =
      "0." + "0".repeat(Math.abs(exp) - 1) + base.replace(".", "");
  } else {
    decimalString = base + "0".repeat(exp);
  }

  return decimalString;
}


