const CACHE_NAME = "expandature-v7";
const APP_SHELL = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./website-icon.png", "./db/db.js", "./db/seed.js", "./features/categories.js", "./features/expenses.js", "./features/export.js", "./features/privacy-lock.js", "./features/theme.js", "./features/state.js", "./features/utils.js", "./models/constants.js", "./ui/category-manager.js", "./ui/category-select.js", "./ui/currency-select.js", "./ui/expense-form.js", "./ui/expense-list.js", "./ui/meal-type-ui.js", "./ui/month-switcher.js", "./ui/summary.js", "./ui/tracker.js", "./ui/undo-toast.js"];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;
    event.respondWith(caches.match(event.request).then(async cached => {
        if (cached) return cached;

        const response = await fetch(event.request);
        if (response.ok && new URL(event.request.url).origin === location.origin) {
            const cacheCopy = response.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, cacheCopy);
        }
        return response;
    }));
});
