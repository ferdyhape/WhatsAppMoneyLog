import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { successResponse, errorResponse } from "../helpers/response.js";

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
      throw new Error("'year' and 'month' is required for filter monthly.");
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
      throw new Error("'year' is required for filter yearly.");
    }

    const year = parseInt(params.year);

    const start = dayjs.tz(`${year}-01-01 00:00:00`, JAKARTA_TZ).utc().toDate();
    const end = dayjs
      .tz(`${year}-12-31 23:59:59.999`, JAKARTA_TZ)
      .utc()
      .toDate();

    return { start, end };
  }

  throw new Error("Params should be daily, monthly, or yearly.");
}

export async function store(data) {
  try {
    if (!data.type || !data.amount || !data.description) {
      return errorResponse(
        "Missing required fields: type, amount, description",
        400
      );
    }

    if (data.type !== "expense" && data.type !== "income") {
      return errorResponse("type must be 'expense' or 'income'", 400);
    }

    let transactionDate;

    if (data.transactionDate) {
      const [day, month, year] = data.transactionDate.split("-").map(Number);
      if (!day || !month || !year) {
        return errorResponse(
          "Invalid transactionDate format, expected DD-MM-YYYY",
          400
        );
      }

      transactionDate = dayjs
        .tz(`${year}-${month}-${day} 00:00:00`, JAKARTA_TZ)
        .utc()
        .toISOString();
    } else {
      transactionDate = dayjs()
        .tz(JAKARTA_TZ)
        .startOf("day")
        .utc()
        .toISOString();
    }

    const transaction = await prisma.transaction.create({
      data: {
        type: data.type,
        amount: data.amount,
        description: data.description,
        transactionDate,
      },
    });

    return successResponse(transaction);
  } catch (error) {
    return errorResponse(error.message || "Unknown error", 500);
  }
}

export async function getBy(by, params) {
  try {
    const { start, end } = getStartEndDate(by, params);

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

    let total_income = 0;
    let total_expense = 0;

    for (const row of result) {
      if (row.type === "income") {
        total_income = row._sum.amount || 0;
      } else if (row.type === "expense") {
        total_expense = row._sum.amount || 0;
      }
    }

    return successResponse({ total_income, total_expense });
  } catch (error) {
    return errorResponse(error.message || "Unknown error", 500);
  }
}

export async function deleteById(id) {
  try {
    if (!id) {
      return errorResponse("Missing required id", 400);
    }

    const deleted = await prisma.transaction.delete({
      where: { id },
    });

    return successResponse(deleted);
  } catch (error) {
    return errorResponse(error.message || "Unknown error", 500);
  }
}
