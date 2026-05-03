import { getStore, requestToPromise } from "../db/db.js";

export async function addExpense(expense) {
    const s = await getStore("expenses", "readwrite");
    s.add(expense);
}

export async function getAllExpenses() {
    const s = await getStore("expenses");
    return new Promise(r => {
        const q = s.getAll();
        q.onsuccess = () => r(q.result);
    });
}

export async function deleteExpense(id) {
    const s = await getStore("expenses", "readwrite");
    s.delete(id);
}

export async function getExpensesByMonthKey(monthKey) {
    const store = await getStore("expenses", "readonly");
    const index = store.index("monthKey");

    const request = index.getAll(monthKey);
    return requestToPromise(request);
}

export async function getExpenseById(id) {
    const store = await getStore("expenses", "readonly");
    const request = store.get(id);
    return requestToPromise(request);
}

export async function updateExpense(expense) {
    const store = await getStore("expenses", "readwrite");

    expense.updatedAt = new Date().toISOString();

    const request = store.put(expense);   // put = insert OR update by key
    return requestToPromise(request);
}

export async function getExpensesByDateRange(start, end) {
    const store = await getStore("expenses", "readonly");
    const all = await requestToPromise(store.getAll());

    return all.filter(e => e.date >= start && e.date <= end);
}

export function getMonthRange(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const start = new Date(year, month, 1).toISOString().slice(0, 10);
    const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    return { start, end };
}

export function getYearRange(date) {
    const year = date.getFullYear();

    return {
        start: `${year}-01-01`,
        end: `${year}-12-31`
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