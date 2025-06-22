export const moneyUnits = ["rb", "ribu", "k"];

const numberPattern = "(\\d{1,3}(?:\\.\\d{3})+|\\d+)";
const unitPattern = `(${moneyUnits.join("|")})?`;

export const moneyPatterns = [new RegExp(numberPattern + unitPattern, "i")];

export const incomeKeywords = [
  // Bahasa
  "terima",
  "dapat",
  "masuk",
  "transfer",
  "bayar saya",
  "pendapatan",
  "gaji",
  "bonus",
  "hadiah",
  "refund",
  "cashback",
  "penjualan",
  "uang masuk",
  "pemasukan",

  // English
  "income",
  "in",
  "salary",
  "pay",
  "paid",
  "received",
  "bonus",
  "reward",
  "refund",
  "cashback",
  "transfer in",
  "deposit",
  "earnings",
];

export const expenseKeywords = [
  // Bahasa
  "bayar",
  "keluar",
  "pakai",
  "tarik",
  "beli",
  "utang",
  "pengeluaran",
  "biaya",
  "gaji karyawan",
  "sewa",
  "tagihan",
  "belanja",
  "pembayaran",
  "uang keluar",
  "cash out",
  "charge",

  // English
  "expense",
  "out",
  "pay",
  "paid",
  "withdraw",
  "purchase",
  "debit",
  "charge",
  "bill",
  "rent",
  "shopping",
  "payment",
  "fees",
  "cost",
  "outgoing",
];
