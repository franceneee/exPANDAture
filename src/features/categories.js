import { getStore, requestToPromise } from "../db/db.js";

export async function getCategories() {
    const store = getStore("categories");
    return requestToPromise(store.getAll());
}

export async function addCategory(name) {
    const store = getStore("categories", "readwrite");
    return requestToPromise(store.add({
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString()
    }));
}

export async function deleteCategory(id) {
    const store = getStore("categories", "readwrite");
    return requestToPromise(store.delete(id));
}

export function filterByCategory(expenses, categoryId) {
    return expenses.filter(
        e => String(e.categoryId) === String(categoryId)
    );
}
