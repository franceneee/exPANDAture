import { getStore } from "../db/db.js";

export async function getCategories() {
    const store = getStore("categories");
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function addCategory(name) {
    const s = await getStore("categories", "readwrite");
    s.add({
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString()
    });
}

export async function deleteCategory(id) {
    const s = await getStore("categories", "readwrite");
    s.delete(id);
}

export function filterByCategory(expenses, categoryId) {
    return expenses.filter(
        e => String(e.categoryId) === String(categoryId)
    );
}
