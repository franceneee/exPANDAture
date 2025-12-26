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