import { getStore, requestToPromise } from "./db.js";

const DEFAULT_CATEGORIES = [
    "bubble tea", "food", "gacha", "games",
    "gifts", "groceries", "social", "travel",
    "ssb", "shopping",
];

export async function seedCategoriesIfEmpty() {
    const count = await requestToPromise(getStore("categories").count());
    if (count > 0) return;

    const store = getStore("categories", "readwrite");
    await Promise.all(
        DEFAULT_CATEGORIES.map(name => requestToPromise(store.add({ name })))
    );
}
