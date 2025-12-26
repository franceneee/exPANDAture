import { getStore } from "./db.js";

const DEFAULT_CATEGORIES = [
    "bubble tea", "food", "gacha", "games",
    "gifts", "groceries", "social", "travel",
    "ssb", "shopping",
];

export async function seedCategoriesIfEmpty() {
    const store = getStore("categories");
    const countRequest = store.count();

    return new Promise((resolve) => {
        countRequest.onsuccess = () => {
            if (countRequest.result === 0) {
                const writeStore = getStore("categories", "readwrite");
                DEFAULT_CATEGORIES.forEach(name => {
                    writeStore.add({ name });
                });
            }
            resolve();
        };
    });
}