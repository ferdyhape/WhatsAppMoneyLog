import {
  moneyPatterns,
  incomeKeywords,
  expenseKeywords,
  moneyConvert,
} from "../config/keywordsTrigger.js";
import { errorResponse, successResponse } from "./response.js";

export const parseMoney = (text) => {
  for (const pattern of moneyPatterns) {
    const matches = text.matchAll(new RegExp(pattern, "gi"));
    for (const match of matches) {
      const val = match[1].replace(/\./g, "").replace(/,/g, "");
      const unit = match[2]?.toLowerCase() || "";

      let multiplier = 1;
      for (const [u, m] of moneyConvert) {
        if (u === unit) {
          multiplier = m;
          break;
        }
      }

      const amount = Number(val) * multiplier;

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

  // Cek expense dulu!
  for (const kw of expenseKeywords) {
    if (lower.includes(kw)) return "expense";
  }

  for (const kw of incomeKeywords) {
    if (lower.includes(kw)) return "income";
  }

  return "unknown";
};

export const parseDescription = (text, rawAmountStr) => {
  let desc = text;
  if (rawAmountStr) {
    const escapedRaw = rawAmountStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const rawPattern = new RegExp(`\\b${escapedRaw}\\b`, "gi");
    desc = desc.replace(rawPattern, "");
  }
  desc = desc.replace(
    new RegExp(
      `\\b(${[...incomeKeywords, ...expenseKeywords].join("|")})\\b`,
      "gi"
    ),
    ""
  );
  return desc.trim();
};

export const parseMessage = (message, params = []) => {
  if (!message || typeof message !== "string") {
    return errorResponse("Invalid message input", 400);
  }

  let msgWithoutParams = message;
  let date = null;

  // Look for date param in format -date:DD-MM-YYYY (case-insensitive)
  const datePattern = /-date:(\d{2}-\d{2}-\d{4})\b/i;
  const dateMatch = message.match(datePattern);
  if (dateMatch) {
    date = dateMatch[1];
    msgWithoutParams = msgWithoutParams.replace(dateMatch[0], "").trim();
  }

  // Remove other params
  for (const param of params) {
    const pattern = new RegExp(`-${param}(?::\\S+)?\\b`, "gi");
    msgWithoutParams = msgWithoutParams.replace(pattern, "").trim();
  }

  const parseResult = parseMoney(msgWithoutParams);
  if (!parseResult) {
    return errorResponse("Unable to parse amount from message", 400);
  }

  const { amount, raw } = parseResult;
  const type = parseType(msgWithoutParams);
  const description = parseDescription(msgWithoutParams, raw);

  if (amount === null || type === "unknown") {
    return errorResponse("Failed to determine amount or type", 400);
  }

  return successResponse({
    amount,
    type,
    description,
    transactionDate: date,
  });
};

// check if message starts with -show
export const checkIfShowCommand = (message) => {
  if (message.startsWith("-show")) {
    return true;
  }
  return false;
};

export const parsingShowCommand = (message) => {
  const commandPart = message.slice(5).trim();

  if (!commandPart) {
    return { type: null, day: null, month: null, year: null };
  }

  const [type, param] = commandPart.split(":").map((s) => s.trim());

  let day = null;
  let month = null;
  let year = null;

  if (param) {
    switch (type) {
      case "daily":
        if (/^\d{2}-\d{2}-\d{4}$/.test(param)) {
          [day, month, year] = param.split("-").map(Number);
        } else {
          return errorResponse(
            "Invalid date format for daily. Expected DD-MM-YYYY",
            400
          );
        }
        break;

      case "monthly":
        if (/^\d{2}-\d{4}$/.test(param)) {
          month = Number(param.slice(0, 2));
          year = Number(param.slice(3, 7));
        } else {
          return errorResponse(
            "Invalid period format for monthly. Expected MM-YYYY",
            400
          );
        }
        break;

      case "yearly":
        if (/^\d{4}$/.test(param)) {
          year = Number(param);
        } else {
          return errorResponse(
            "Invalid year format for yearly. Expected YYYY",
            400
          );
        }
        break;

      default:
        return errorResponse("Invalid command type", 400);
    }
  }

  return successResponse({
    type: type || null,
    day,
    month,
    year,
  });
};
