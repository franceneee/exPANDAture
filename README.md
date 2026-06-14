# exPANDAture

A local-first, panda-powered expenditure tracker created for fun.

## Privacy Model

- Expenses and categories stay in the browser's IndexedDB and are not sent to a server.
- An optional local PIN gate can be enabled in **Grove > Privacy lock**.
- The PIN verifier is salted and stretched with PBKDF2; the raw PIN is never stored.
- The PIN gate protects against casual access, but does not encrypt IndexedDB against someone with device or browser-profile access.
- Exported CSV files are unencrypted, so store or share them carefully.

## PWA

Serve the `src` directory over HTTPS or localhost, then use the browser's **Add to Home Screen** action. The service worker caches the app shell for offline use.

## Folder Structure
```
exPANDAture/
│
├─ app.js
├─ index.html
├─ manifest.webmanifest
├─ service-worker.js
├─ styles.css
├─ web-icon.png
│
├─ db/
│   ├─ db.js
│   └─ seed.js
│
├─ features/
│   ├─ categories.js
│   ├─ expenses.js
│   ├─ export.js
│   ├─ privacy-lock.js
|   ├─ state.js
│   ├─ theme.js
│   └─ utils.js
│
├─ models/
│   └─ constants.js
|
└─ ui/
    ├─ category-manager.js
    ├─ category-select.js
    ├─ currency-select.js
    ├─ expense-form.js
    ├─ expense-list.js
    ├─ meal-type-ui.js
    ├─ month-switcher.js
    ├─ summary.js
    └─ tracker.js

```
