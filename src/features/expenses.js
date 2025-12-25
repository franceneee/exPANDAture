import { getStore } from "../db/db.js";

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
