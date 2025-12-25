import { getStore } from "./db.js";

const DEFAULT_CATEGORIES = [
    "food", "travel", "groceries",
    "games", "gacha", "social", 
    "bubble tea", "ssb", "shopping",
    "lunch", "dinner", "snacks",
    "gifts"
];

export async function seedCategoriesIfEmpty() {
    console.log("Seeding categories if empty…");    
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