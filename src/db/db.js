// db.js
const DB_NAME = "expense_tracker";
const DB_VERSION = 2;
let db = null;

export function openDB() {
    // indexedDB.deleteDatabase("expense_tracker");

    if (db) return Promise.resolve(db); // already open

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            console.log("Upgrading DB…");

            if (!database.objectStoreNames.contains("expenses")) {
                const expenseStore = database.createObjectStore("expenses", {
                    keyPath: "id",
                    autoIncrement: true
                });
                expenseStore.createIndex("date", "date");
                expenseStore.createIndex("categoryIds", "categoryIds", { multiEntry: true });
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
            console.log("DB opened. Stores:", [...db.objectStoreNames]);
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
