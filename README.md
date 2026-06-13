# exPANDAture
an expenditure tracking app, created for fun

## Privacy model

- Expenses and categories stay in the browser's IndexedDB and are not sent to a server.
- An optional local PIN gate can be enabled in **Grove > Privacy lock**.
- The PIN verifier is salted and stretched with PBKDF2; the raw PIN is never stored.
- The PIN gate protects against casual access, but it does **not** encrypt IndexedDB against someone with device or browser-profile access. Use your phone's screen lock as the primary security boundary.
- Exported CSV files are unencrypted, so store or share them carefully.


## Folder Structure
```
exPANDAture/
│
├─ index.html
├─ styles.css
├─ app.js
│
├─ db/
│   ├─ db.js
│   └─ seed.js
│
├─ features/
│   ├─ categories.js
│   ├─ expenses.js
│   ├─ export.js
|   ├─ state.js
│   └─ utils.js
│
├─ models/
│   ├─ category.js
│   ├─ constants.js
│   └─ expense.js
|
└─ ui/
    ├─ category-manager.js
    ├─ category-select.js
    ├─ currency-select.js
    ├─ expense-form.js
    ├─ expense-list.js
    ├─ list.js
    ├─ meal-type-ui.js
    ├─ month-switcher.js
    ├─ summary.js
    └─ tracker.js

```