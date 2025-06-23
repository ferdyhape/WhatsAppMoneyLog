export const incomeKeywords = ["in"];

export const expenseKeywords = ["out"];

export const moneyConvert = [
  ["rb", 1_000],
  ["ribu", 1_000],
  ["k", 1_000],
  ["juta", 1_000_000],
  ["jt", 1_000_000],
  ["miliar", 1_000_000_000],
  ["mlr", 1_000_000_000],
  ["m", 1_000_000_000],
];

const allUnits = moneyConvert.map(([unit]) => unit);
const numberPattern = "\\d{1,3}(?:\\.\\d{3})*|\\d+";
const unitPattern = `(${allUnits.join("|")})?\\b`;

export const moneyPatterns = [
  new RegExp(`\\b(${numberPattern})${unitPattern}`, "i"),
];
