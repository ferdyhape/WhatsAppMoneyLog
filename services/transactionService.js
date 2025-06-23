import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new PrismaClient();
const JAKARTA_TZ = "Asia/Jakarta";

function getStartEndDate(by, params) {
  const now = dayjs().tz(JAKARTA_TZ);

  if (by === "daily") {
    const year = parseInt(params.year) || now.year();
    const month = parseInt(params.month) || now.month() + 1;
    const day = parseInt(params.day || params.date) || now.date();

    const start = dayjs
      .tz(`${year}-${month}-${day} 00:00:00`, JAKARTA_TZ)
      .utc()
      .toDate();
    const end = dayjs
      .tz(`${year}-${month}-${day} 23:59:59.999`, JAKARTA_TZ)
      .utc()
      .toDate();

    return { start, end };
  }

  if (by === "monthly") {
    if (!params.year || !params.month) {
      throw new Error(
        "Parameter 'year' dan 'month' wajib untuk filter monthly."
      );
    }

    const year = parseInt(params.year);
    const month = parseInt(params.month);

    const start = dayjs
      .tz(`${year}-${month}-01 00:00:00`, JAKARTA_TZ)
      .utc()
      .toDate();
    const end = dayjs
      .tz(
        dayjs(`${year}-${month}-01`).endOf("month").format("YYYY-MM-DD") +
          " 23:59:59.999",
        JAKARTA_TZ
      )
      .utc()
      .toDate();

    return { start, end };
  }

  if (by === "yearly") {
    if (!params.year) {
      throw new Error("Parameter 'year' wajib untuk filter yearly.");
    }

    const year = parseInt(params.year);

    const start = dayjs.tz(`${year}-01-01 00:00:00`, JAKARTA_TZ).utc().toDate();
    const end = dayjs
      .tz(`${year}-12-31 23:59:59.999`, JAKARTA_TZ)
      .utc()
      .toDate();

    return { start, end };
  }

  throw new Error('Parameter "by" harus "daily", "monthly", atau "yearly".');
}

export async function store(data) {
  if (!data.type || !data.amount || !data.description) {
    throw new Error("Missing required fields: type, amount, description");
  }

  if (data.type !== "expense" && data.type !== "income") {
    throw new Error("type must be 'expense' or 'income'");
  }

  let transactionDate;

  if (data.transactionDate) {
    const [day, month, year] = data.transactionDate.split("-").map(Number);
    if (!day || !month || !year) {
      throw new Error("Invalid transactionDate format, expected DD-MM-YYYY");
    }

    transactionDate = dayjs
      .tz(`${year}-${month}-${day} 00:00:00`, JAKARTA_TZ)
      .utc()
      .toISOString();
  } else {
    transactionDate = dayjs().tz(JAKARTA_TZ).startOf("day").utc().toISOString();
  }

  const transaction = await prisma.transaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      description: data.description,
      transactionDate,
    },
  });

  return transaction;
}

export async function getBy(by, params) {
  const { start, end } = getStartEndDate(by, params);

  console.log("▶ Filter Time Range:");
  console.log("Start (WIB):", dayjs(start).tz(JAKARTA_TZ).format());
  console.log("End   (WIB):", dayjs(end).tz(JAKARTA_TZ).format());

  const result = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      transactionDate: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      amount: true,
    },
  });

  console.log("▶ Result:" + JSON.stringify(result));

  let total_income = 0;
  let total_expense = 0;

  for (const row of result) {
    if (row.type === "income") {
      total_income = row._sum.amount || 0;
    } else if (row.type === "expense") {
      total_expense = row._sum.amount || 0;
    }
  }

  return {
    total_income,
    total_expense,
  };
}

export async function deleteById(id) {
  if (!id) {
    throw new Error("Missing required id");
  }

  return await prisma.transaction.delete({
    where: { id },
  });
}
