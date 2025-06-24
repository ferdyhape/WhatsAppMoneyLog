import { readFile } from "fs/promises";

const formatRupiah = (number) => {
  return "Rp " + number.toLocaleString("id-ID");
};

export const buildMessageLog = async (id, type, amount, description) => {
  try {
    const template = await readFile(
      "./templates/template_message.txt",
      "utf-8"
    );

    amount = formatRupiah(amount);

    const message = template
      .replace("${type}", type)
      .replace("${id}", id)
      .replace("${amount}", amount)
      .replace("${description}", description || "-");

    return message;
  } catch (err) {
    console.error("Error reading message template:", err);
    return null;
  }
};

export const buildMessageReport = async (
  total_income,
  total_expense,
  type,
  param
) => {
  try {
    const template = await readFile("./templates/template_report.txt", "utf-8");

    total_income = formatRupiah(total_income);
    total_expense = formatRupiah(total_expense);

    let formattedDate = null;

    if (type === "daily" && param.day == null) {
      const now = new Date();
      formattedDate = now.toLocaleDateString("id-ID"); // Atau format sesuai kebutuhan
    } else if (type === "daily" && param.day != null) {
      formattedDate = `${String(param.day).padStart(2, "0")}/${String(
        param.month
      ).padStart(2, "0")}/${param.year}`;
    } else if (type === "monthly") {
      formattedDate = `${String(param.month).padStart(2, "0")}/${param.year}`;
    } else if (type === "yearly") {
      formattedDate = `${param.year}`;
    }

    const message = template
      .replace("${total_income}", total_income)
      .replace("${total_expense}", total_expense)
      .replace("${type}", type)
      .replace("${param}", formattedDate);

    return message;
  } catch (err) {
    console.error("Error reading message template:", err);
    return null;
  }
};

// getHelpCommand

export const getHelpCommand = async () => {
  try {
    const template = await readFile("./templates/help.txt", "utf-8");
    return template;
  } catch (err) {
    console.error("Error reading message template:", err);
    return null;
  }
};
