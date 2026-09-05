# exPANDAture

A local-first, panda-powered expenditure tracker built as a lightweight PWA.

exPANDAture is meant for quick personal spending logs: open it on your phone, add a leaf to the trail, and keep your data on your own device. It has giant panda and red panda themes, offline app-shell caching, exports, full JSON backup/restore, and catch-up tools for importing old expenses without poking at IndexedDB directly.

## Features

- Add, edit, delete, and undo-delete expenses.
- Track monthly totals on Home and Trail.
- Browse spending history by month.
- Categorise expenses, including meal types such as snacks and desserts.
- View analytics with a category pie chart and spending heatmap.
- Filter heatmap activity by month/year and category.
- Export the current month or a selected month range as CSV.
- Import the app's own CSV format with preview, validation, and duplicate detection.
- Bulk add multiple older expenses from the Trail tab.
- Download and restore full JSON backups.
- Switch between giant panda and red panda themes.
- Install as a PWA from localhost or HTTPS.

## Quick Start

This project is a static frontend app. Serve the `src` directory with any local web server, then open the app in a browser.

For example, with VS Code Live Server:

```text
http://127.0.0.1:5501/src/index.html
```

Because the app uses browser APIs such as IndexedDB and a service worker, avoid opening `src/index.html` directly with `file://` for normal testing.

## PWA Usage

Serve the app over `localhost` or HTTPS, then use your browser's install action:

- Chrome/Edge desktop: install icon in the address bar, or browser menu > install app.
- Android Chrome: menu > Add to Home screen.
- iOS Safari: Share > Add to Home Screen.

The service worker caches the app shell so the app can open offline after it has been loaded once.

When changing cached files during development, update the cache name in `src/service-worker.js` or unregister the old service worker from browser dev tools. A normal page refresh may still show cached assets.

## Privacy Model

- Expenses, categories, settings, and backups are handled locally in the browser.
- Expense records live in IndexedDB for the current browser origin.
- The app does not send expense data to a server.
- The optional PIN gate can be enabled in **Grove > Privacy lock**.
- The PIN verifier is salted and stretched with PBKDF2; the raw PIN is never stored.
- The PIN gate protects against casual access, but it does not encrypt IndexedDB against someone with device or browser-profile access.
- CSV exports and JSON backups are unencrypted, so store or share them carefully.

## Data Portability

Use **Grove > Backup garden** to download a full JSON backup before changing browsers, clearing site data, or moving to another device.

Restore modes:

- **Merge** adds backup data into the current browser data.
- **Replace all** clears current app data first, after creating a safety backup.

For spreadsheet-friendly records, use **Trail > Export CSV**. CSV export is good for review and reporting; JSON backup is better for restoring the app.

## Catch-Up Tools

Open **Trail > Import / bulk add** when you need to enter old expenses quickly.

CSV import expects the app's own export format:

```csv
Date,Description,Amount,Currency,Category,Meal Type
```

The import preview marks:

- valid rows that can be imported
- likely duplicates that are skipped by default
- invalid rows with inline errors
- unknown categories, which import as uncategorised

Bulk add starts with one expense card and lets you add more rows as needed. Blank rows are ignored.

## Project Structure

```text
exPANDAture/
└─ src/
   ├─ app.js
   ├─ index.html
   ├─ manifest.webmanifest
   ├─ service-worker.js
   ├─ styles.css
   ├─ website-icon.png
   ├─ db/
   │  ├─ db.js
   │  └─ seed.js
   ├─ features/
   │  ├─ backup.js
   │  ├─ categories.js
   │  ├─ expenses.js
   │  ├─ export.js
   │  ├─ import.js
   │  ├─ privacy-lock.js
   │  ├─ state.js
   │  ├─ theme.js
   │  └─ utils.js
   ├─ models/
   │  └─ constants.js
   └─ ui/
      ├─ backup-restore.js
      ├─ catch-up-tools.js
      ├─ category-manager.js
      ├─ category-select.js
      ├─ currency-select.js
      ├─ expense-form.js
      ├─ expense-list.js
      ├─ meal-type-ui.js
      ├─ month-switcher.js
      ├─ summary.js
      ├─ toast.js
      ├─ tracker.js
      └─ undo-toast.js
```
