import {
  moneyPatterns,
  incomeKeywords,
  moneyUnits,
  expenseKeywords,
} from "../config/keywordsTrigger.js";
import logger from "../helpers/logger.js";
import { params } from "../config/params.js";

export const formatRupiah = (number) => {
  return "Rp " + number.toLocaleString("id-ID");
};

export const parseMoney = (text) => {
  for (const pattern of moneyPatterns) {
    const match = text.match(pattern);
    if (match) {
      let val = match[1].toLowerCase().replace(/\./g, "");
      let unit = match[2] ? match[2].toLowerCase() : "";

      let amount =
        unit && moneyUnits.includes(unit)
          ? parseInt(val) * 1000
          : parseInt(val);

      return {
        amount,
        raw: match[0],
      };
    }
  }
  return null;
};

export const parseType = (text) => {
  const lower = text.toLowerCase();
  for (const kw of incomeKeywords) {
    if (lower.includes(kw)) return "income";
  }
  for (const kw of expenseKeywords) {
    if (lower.includes(kw)) return "expense";
  }
  return "unknown";
};

export const parseDescription = (text, rawAmountStr) => {
  let desc = text;
  if (rawAmountStr) {
    const escapedRaw = rawAmountStr.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const rawPattern = new RegExp(`\\b${escapedRaw}\\b`, "gi");
    desc = desc.replace(rawPattern, "");
  }
  desc = desc.replace(
    new RegExp(`(${[...incomeKeywords, ...expenseKeywords].join("|")})`, "gi"),
    ""
  );
  return desc.trim();
};

export const parseMessage = (message) => {
  if (!message || typeof message !== "string") {
    return null;
  }

  let msgWithoutParams = message;
  for (const param of params) {
    const pattern = new RegExp(`-${param}(:\\S+)?\\b`, "gi");
    msgWithoutParams = msgWithoutParams.replace(pattern, "").trim();
  }

  const parseResult = parseMoney(msgWithoutParams);
  if (!parseResult) return null;

  const { amount, raw } = parseResult;
  const type = parseType(msgWithoutParams);
  const description = parseDescription(msgWithoutParams, raw);

  logger.info(`Amount: ${amount}, Type: ${type}, Description: ${description}`);

  if (amount === null || type === "unknown") {
    return null;
  }

  return {
    amount: formatRupiah(amount),
    type,
    description,
  };
};
