import { openDB } from "./db/db.js";
import { seedCategoriesIfEmpty } from "./db/seed.js";
import { exportCSV } from "./features/export.js";
import { initState, getActiveMonthKey, state } from "./features/state.js";
import { renderTodayDate } from "./features/utils.js";
import { setupCategoryManager } from "./ui/category-manager.js";
import { populateCategorySelect } from "./ui/category-select.js";
import { populateCurrencySelect } from "./ui/currency-select.js";
import { setupExpenseForm } from "./ui/expense-form.js";
import { renderMonthlyExpenses, renderAnalytics } from "./ui/expense-list.js";
import { setupMealTypeUI } from "./ui/meal-type-ui.js";
import { setupMonthSwitcher } from "./ui/month-switcher.js";
import { renderMonthlySummary } from "./ui/summary.js";
import { renderCategoryHeatmap } from "./ui/tracker.js";

let categoryMap = {};
let heatmapMode = "month";

export function getCategoryMap() {
  return categoryMap;
}

function getHeatmapCategoryId() {
  const categorySelect = document.getElementById("heatmap-category");
  return categorySelect ? Number(categorySelect.value) : 1;
}

window.setMode = (mode) => {
  heatmapMode = mode;
  renderCategoryHeatmap({
    containerId: "heatmap",
    categoryId: getHeatmapCategoryId(),
    mode
  });
};

async function initApp() {
  await openDB();
  initState();
  setupMonthSwitcher();
  await seedCategoriesIfEmpty();
  categoryMap = await populateCategorySelect();

  const heatmapCategorySelect = document.getElementById("heatmap-category");
  heatmapCategorySelect?.addEventListener("change", () => {
    renderCategoryHeatmap({
      containerId: "heatmap",
      categoryId: getHeatmapCategoryId(),
      mode: heatmapMode
    });
  });

  await renderHome();
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

const dateInput = document.querySelector('input[type="date"]');

dateInput.addEventListener("click", () => {
  if (dateInput.showPicker) {
    dateInput.showPicker();
  }
});

document.querySelectorAll(".tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;

    document.getElementById("list-tab").style.display =
      tab === "list" ? "block" : "none";

    document.getElementById("analytics-tab").style.display =
      tab === "analytics" ? "block" : "none";

    if (tab === "analytics") renderAnalytics();
  };
});

async function renderHome() {
  const categoryId = getHeatmapCategoryId();
  console.log("Rendering home with categoryId", categoryId);
  await renderCategoryHeatmap({
    containerId: "heatmap",
    categoryId,
    mode: heatmapMode
  });
}

export function renderApp() {
  const home = document.getElementById("home-view");
  const history = document.getElementById("history-view");
  const settings = document.getElementById("settings-view");
  const expenseForm = document.getElementById("expense-form-view");
  console.log("Rendering app, current view:", state.view);

  switch (state.view) {
    case "home":
      home.style.display = "block";
      history.style.display = "none";
      settings.style.display = "none";
      expenseForm.style.display = "none";
      break;
    case "history":
      home.style.display = "none";
      history.style.display = "block";
      settings.style.display = "none";
      expenseForm.style.display = "none";
      break;
    case "settings":
      home.style.display = "none";
      history.style.display = "none";
      settings.style.display = "block";
      expenseForm.style.display = "none";
      break;
    case "expenseForm":
      home.style.display = "none";
      history.style.display = "none";
      settings.style.display = "none";
      expenseForm.style.display = "block";
      break;
    default:
      console.error("Unknown view:", state.view);
      break;
  }
}

document.querySelector("#historyBtn").onclick = () => {
  state.view = "history";
  renderApp();
};

document.querySelector("#settingsBtn").onclick = () => {
  state.view = "settings";
  renderApp();
};

document.querySelector("#addExpenseBtn").onclick = () => {
  state.view = "expenseForm";
  renderApp();
};

window.goHome = () => {
  console.log("Going home");
  state.view = "home";
  renderApp();
};

renderApp();
renderTodayDate();