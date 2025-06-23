import {
  moneyPatterns,
  incomeKeywords,
  expenseKeywords,
  moneyConvert,
} from "../config/keywordsTrigger.js";

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
    return null;
  }

  let msgWithoutParams = message;
  let date = null;

  // Look for date param in format -date:DD-MM-YYYY (case-insensitive)
  const datePattern = /-date:(\d{2}-\d{2}-\d{4})\b/i;
  const dateMatch = message.match(datePattern);
  if (dateMatch) {
    date = dateMatch[1]; // The captured date string e.g. "22-06-2025"
    msgWithoutParams = msgWithoutParams.replace(dateMatch[0], "").trim();
  }

  // Remove other params
  for (const param of params) {
    const pattern = new RegExp(`-${param}(?::\\S+)?\\b`, "gi");
    msgWithoutParams = msgWithoutParams.replace(pattern, "").trim();
  }

  const parseResult = parseMoney(msgWithoutParams);
  if (!parseResult) return null;

  const { amount, raw } = parseResult;
  const type = parseType(msgWithoutParams);
  const description = parseDescription(msgWithoutParams, raw);

  if (amount === null || type === "unknown") {
    return null;
  }

  return {
    amount,
    type,
    description,
    transactionDate: date,
  };
};

// check if message starts with -show
export const checkIfManualCommand = (message) => {
  if (message.startsWith("-show")) {
    return true;
  }
  return false;
};

export const parsingManualCommand = (message) => {
  const commandPart = message.slice(5).trim();

  if (!commandPart) {
    return { type: null, day: null, month: null, year: null };
  }

  const [type, param] = commandPart.split(":").map((s) => s.trim());

  // Inisialisasi default semua variabel
  let day = null;
  let month = null;
  let year = null;

  if (param) {
    switch (type) {
      case "daily":
        if (/^\d{2}-\d{2}-\d{4}$/.test(param)) {
          [day, month, year] = param.split("-").map(Number);
        } else {
          throw new Error("Invalid date format for daily. Expected DD-MM-YYYY");
        }
        break;

      case "monthly":
        if (/^\d{2}-\d{4}$/.test(param)) {
          month = Number(param.slice(0, 2));
          year = Number(param.slice(3, 7));
        } else {
          throw new Error(
            "Invalid period format for monthly. Expected MM-YYYY"
          );
        }
        break;

      case "yearly":
        if (/^\d{4}$/.test(param)) {
          year = Number(param);
        } else {
          throw new Error("Invalid period format for yearly. Expected YYYY");
        }
        break;

      default:
        throw new Error(`Unsupported type with parameter: ${type}`);
    }
  }

  return {
    type: type || null,
    day,
    month,
    year,
  };
};
