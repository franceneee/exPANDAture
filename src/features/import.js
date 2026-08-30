import { getStore, requestToPromise } from "../db/db.js";
import { CURRENCIES, DEFAULT_CURRENCY } from "../models/constants.js";

const CSV_HEADERS = ["Date", "Description", "Amount", "Currency", "Category", "Meal Type"];
const MEAL_TYPES = ["", "breakfast", "lunch", "dinner", "snack", "dessert"];
const LAST_EXPENSE_DATE_KEY = "expandature_last_expense_date";

export function parseExpenseCSV(text) {
    const rows = parseCSV(text);
    if (rows.length === 0) {
        throw new Error("CSV file is empty.");
    }

    const headers = rows[0].map(normalizeHeader);
    const missing = CSV_HEADERS.filter(header => !headers.includes(normalizeHeader(header)));
    if (missing.length) {
        throw new Error(`CSV is missing: ${missing.join(", ")}.`);
    }

    const indexes = Object.fromEntries(
        CSV_HEADERS.map(header => [header, headers.indexOf(normalizeHeader(header))])
    );

    return rows.slice(1)
        .map((row, index) => ({
            rowNumber: index + 2,
            date: row[indexes.Date] || "",
            description: row[indexes.Description] || "",
            amount: row[indexes.Amount] || "",
            currency: row[indexes.Currency] || DEFAULT_CURRENCY,
            categoryName: row[indexes.Category] || "",
            mealType: row[indexes["Meal Type"]] || ""
        }))
        .filter(row => !isBlankRow(row));
}

export async function prepareCSVImport(text, categoryMap) {
    const existingKeys = await getExistingExpenseKeys();
    const pendingKeys = new Set();
    const categoryNames = getCategoryNames(categoryMap);

    return parseExpenseCSV(text).map(row => {
        const result = normalizeExpenseInput(row, categoryNames);
        const key = result.expense ? getExpenseKey(result.expense) : null;
        const duplicate = key && (existingKeys.has(key) || pendingKeys.has(key));
        if (key) pendingKeys.add(key);

        return {
            ...row,
            ...result,
            duplicate,
            selected: result.valid && !duplicate
        };
    });
}

export async function prepareBulkImport(rows) {
    const existingKeys = await getExistingExpenseKeys();
    const pendingKeys = new Set();

    return rows
        .map((row, index) => ({ ...row, rowNumber: index + 1 }))
        .filter(row => !isBlankBulkRow(row))
        .map(row => {
            const result = normalizeExpenseInput(row);
            const key = result.expense ? getExpenseKey(result.expense) : null;
            const duplicate = key && (existingKeys.has(key) || pendingKeys.has(key));
            if (key) pendingKeys.add(key);

            return {
                ...row,
                ...result,
                duplicate,
                selected: result.valid && !duplicate
            };
        });
}

export async function importPreparedExpenses(rows) {
    const importableRows = rows.filter(row => row.selected && row.valid && !row.duplicate);
    const timestamp = new Date().toISOString();

    for (const row of importableRows) {
        await requestToPromise(getStore("expenses", "readwrite").add({
            ...row.expense,
            id: crypto.randomUUID(),
            createdAt: timestamp,
            updatedAt: timestamp
        }));
    }

    rememberLastImportedDate(importableRows);
    return importableRows.length;
}

export function getDefaultImportDate() {
    const rememberedDate = localStorage.getItem(LAST_EXPENSE_DATE_KEY);
    return isDateInputValue(rememberedDate) ? rememberedDate : getTodayDate();
}

function normalizeExpenseInput(row, categoryNames = null) {
    const errors = [];
    const warnings = [];
    const date = String(row.date || "").trim();
    const description = String(row.description || "").trim();
    const rawAmount = String(row.amount || "").trim().replace(/^\$/, "");
    const amountValue = Number(rawAmount);
    const currency = String(row.currency || DEFAULT_CURRENCY).trim().toUpperCase();
    const mealType = String(row.mealType || "").trim().toLowerCase();
    let categoryId = row.categoryId || null;

    if (!isRealDateInputValue(date)) {
        errors.push("Use YYYY-MM-DD date.");
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
        errors.push("Amount must be greater than zero.");
    }

    if (!CURRENCIES.some(currencyOption => currencyOption.code === currency)) {
        errors.push("Currency is not supported.");
    }

    if (!MEAL_TYPES.includes(mealType)) {
        errors.push("Meal type is not supported.");
    }

    if (categoryNames) {
        const categoryName = String(row.categoryName || "").trim();
        if (categoryName && categoryName.toLowerCase() !== "uncategorised") {
            categoryId = categoryNames.get(categoryName.toLowerCase()) || null;
            if (!categoryId) {
                warnings.push(`Unknown category "${categoryName}" will import as uncategorised.`);
            }
        }
    }

    const valid = errors.length === 0;
    const expense = valid
        ? {
            date,
            description,
            amount: Math.round(amountValue * 100),
            currency,
            monthKey: date.slice(0, 7),
            categoryId,
            mealType: mealType || null
        }
        : null;

    return { valid, errors, warnings, expense };
}

async function getExistingExpenseKeys() {
    const expenses = await requestToPromise(getStore("expenses").getAll());
    return new Set(expenses.map(getExpenseKey));
}

function getExpenseKey(expense) {
    return [
        expense.date,
        String(expense.description || "").trim().toLowerCase(),
        expense.amount,
        expense.currency,
        expense.categoryId || "",
        expense.mealType || ""
    ].join("|");
}

function getCategoryNames(categoryMap) {
    return new Map(
        Object.entries(categoryMap).map(([id, name]) => [String(name).trim().toLowerCase(), id])
    );
}

function isBlankRow(row) {
    return ["date", "description", "amount", "currency", "categoryName", "categoryId", "mealType"]
        .every(key => !String(row[key] || "").trim());
}

function isBlankBulkRow(row) {
    return !String(row.description || "").trim()
        && !String(row.amount || "").trim()
        && !String(row.categoryId || "").trim()
        && !String(row.mealType || "").trim();
}

function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        const nextChar = text[index + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            field += '"';
            index += 1;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            row.push(field);
            field = "";
        } else if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && nextChar === "\n") index += 1;
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else {
            field += char;
        }
    }

    if (inQuotes) {
        throw new Error("CSV has an unmatched quote.");
    }

    row.push(field);
    rows.push(row);

    return rows.filter(parsedRow => parsedRow.some(value => String(value).trim()));
}

function normalizeHeader(header) {
    return String(header || "").replace(/^\uFEFF/, "").trim().toLowerCase();
}

function rememberLastImportedDate(rows) {
    const latestDate = rows
        .map(row => row.expense.date)
        .sort()
        .at(-1);

    if (latestDate) {
        localStorage.setItem(LAST_EXPENSE_DATE_KEY, latestDate);
    }
}

function getTodayDate() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function isDateInputValue(date) {
    return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isRealDateInputValue(date) {
    if (!isDateInputValue(date)) return false;
    const parsed = new Date(`${date}T00:00:00`);
    return !Number.isNaN(parsed.getTime()) && date === getTodayLikeDate(parsed);
}

function getTodayLikeDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
