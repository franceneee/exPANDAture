import { seedCategoriesIfEmpty } from "./db/seed.js";
import { populateCurrencySelect } from "./ui/currency-select.js";
import { populateCategorySelect } from "./ui/category-select.js";
import { setupExpenseForm } from "./ui/expense-form.js";
import { renderExpenses } from "./ui/expense-list.js";
import { setupCategoryManager } from "./ui/category-manager.js";
import { exportCSV } from "./features/export.js";
import { openDB } from "./db/db.js";


let categoryMap = {};
let currentExpenses = [];

async function initApp() {
  console.log("Init app…");

  await openDB();
  await seedCategoriesIfEmpty();
  categoryMap = await populateCategorySelect();
  await populateCurrencySelect();
}

initApp().catch(console.error);
async function refresh() {
  currentExpenses = await renderExpenses(categoryMap);
}

setupExpenseForm(refresh);
setupCategoryManager();
refresh();

document.getElementById("export-btn").onclick = () =>
  exportCSV(currentExpenses, categoryMap);
