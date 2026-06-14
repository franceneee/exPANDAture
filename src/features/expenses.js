import { getStore, requestToPromise } from "../db/db.js";
import { formatLocalDate } from "./utils.js";

export async function addExpense(expense) {
    const store = getStore("expenses", "readwrite");
    return requestToPromise(store.add(expense));
}

export async function deleteExpense(id) {
    const store = getStore("expenses", "readwrite");
    return requestToPromise(store.delete(id));
}

export async function getExpensesByMonthKey(monthKey) {
    const store = getStore("expenses");
    const index = store.index("monthKey");

    const request = index.getAll(monthKey);
    return requestToPromise(request);
}

export async function getExpenseById(id) {
    const store = getStore("expenses");
    const request = store.get(id);
    return requestToPromise(request);
}

export async function updateExpense(expense) {
    const store = getStore("expenses", "readwrite");

    expense.updatedAt = new Date().toISOString();

    const request = store.put(expense);   // put = insert OR update by key
    return requestToPromise(request);
}

export async function getExpensesByDateRange(start, end) {
    const store = getStore("expenses");
    const all = await requestToPromise(store.getAll());

    return all.filter(e => e.date >= start && e.date <= end);
}

export function getMonthRange(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const start = formatLocalDate(new Date(year, month, 1));
    const end = formatLocalDate(new Date(year, month + 1, 0));

    return { start, end };
}

export function getYearRange(date) {
    const year = date.getFullYear();

    return {
        start: formatLocalDate(new Date(year, 0, 1)),
        end: formatLocalDate(new Date(year, 11, 31))
    };
}

export function groupByCategory(expenses) {
    const map = {};

    for (const e of expenses) {
        if (!Number.isFinite(e.amount)) continue;

        map[e.categoryId] = (map[e.categoryId] || 0) + e.amount;
    }

    return map;
}
