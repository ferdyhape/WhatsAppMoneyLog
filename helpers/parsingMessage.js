import {
  moneyPatterns,
  incomeKeywords,
  expenseKeywords,
} from "../config/keywordsTrigger.js";

export const parseMoney = (text) => {
  for (const pattern of moneyPatterns) {
    const match = text.match(pattern);
    if (match) {
      let val = match[1];
      val = val.toLowerCase().replace(/\./g, "");
      if (val.endsWith("rb") || val.endsWith("ribu")) {
        val = val.replace(/rb|ribu/g, "");
        return parseInt(val) * 1000;
      }
      return parseInt(val);
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

export const parseDescription = (text, amount) => {
  let desc = text;
  if (amount !== null) {
    const amountStrPattern = new RegExp(`\\b${amount.toString()}\\b`, "g");
    desc = desc.replace(amountStrPattern, "");
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
  const amount = parseMoney(message);
  const type = parseType(message);
  const description = parseDescription(message, amount);

  if (amount === null || type === "unknown") {
    return null;
  }

  return {
    amount,
    type,
    description,
  };
};
