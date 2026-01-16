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
