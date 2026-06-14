const DB_NAME = "expense_tracker";
const DB_VERSION = 1;
let db = null;

export function openDB() {
    if (db) return Promise.resolve(db);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            let expenseStore;
            if (!database.objectStoreNames.contains("expenses")) {
                expenseStore = database.createObjectStore("expenses", {
                    keyPath: "id",
                    autoIncrement: true
                });
            } else {
                expenseStore = event.target.transaction.objectStore("expenses");
            }

            if (!expenseStore.indexNames.contains("monthKey")) {
                expenseStore.createIndex("monthKey", "monthKey");
            }

            if (!expenseStore.indexNames.contains("categoryIds")) {
                expenseStore.createIndex("categoryIds", "categoryIds");
            }

            if (!database.objectStoreNames.contains("categories")) {
                const categoryStore = database.createObjectStore("categories", {
                    keyPath: "id",
                    autoIncrement: true
                });
                categoryStore.createIndex("name", "name", { unique: true });
            }
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onerror = () => reject(request.error);
    });
}

export function getStore(storeName, mode = "readonly") {
    if (!db) {
        throw new Error("DB not initialised. Call openDB() first.");
    }

    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error(`Object store "${storeName}" does not exist`);
    }

    return db.transaction(storeName, mode).objectStore(storeName);
}

export function requestToPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
