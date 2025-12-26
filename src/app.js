import { openDB } from "./db/db.js";
import { seedCategoriesIfEmpty } from "./db/seed.js";
import { exportCSV } from "./features/export.js";
import { initState, getActiveMonthKey } from "./features/state.js";
import { setupCategoryManager } from "./ui/category-manager.js";
import { populateCategorySelect } from "./ui/category-select.js";
import { populateCurrencySelect } from "./ui/currency-select.js";
import { setupExpenseForm } from "./ui/expense-form.js";
import { renderMonthlyExpenses } from "./ui/expense-list.js";
import { setupMealTypeUI } from "./ui/meal-type-ui.js";
import { setupMonthSwitcher } from "./ui/month-switcher.js";
import { renderMonthlySummary } from "./ui/summary.js";

let categoryMap = {};

export function getCategoryMap() {
  return categoryMap;
}

async function initApp() {
  await openDB();
  initState();
  setupMonthSwitcher();
  await seedCategoriesIfEmpty();
  categoryMap = await populateCategorySelect();
  await populateCurrencySelect();
  setupExpenseForm();
  setupCategoryManager();
  await renderMonthlyExpenses();
  await renderMonthlySummary();
  setupMealTypeUI();
}

initApp().catch(console.error);

document.getElementById("export-btn").onclick = async () =>
  await exportCSV(getActiveMonthKey());
