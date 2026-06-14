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
import { setupMonthSwitcher, resetToCurrentMonth } from "./ui/month-switcher.js";
import { renderMonthlySummary } from "./ui/summary.js";
import { renderCategoryHeatmap } from "./ui/tracker.js";
import { setupPrivacyLock } from "./features/privacy-lock.js";
import { setupThemeToggle } from "./features/theme.js";

let categoryMap = {};
let heatmapMode = "month";

export function getCategoryMap() {
  return categoryMap;
}

function getHeatmapCategoryId() {
  const categorySelect = document.getElementById("heatmap-category");
  return categorySelect?.value || null;
}

function getHeatmapDate() {
  const value = document.getElementById("heatmap-month")?.value;
  if (!value) return new Date();
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function renderSelectedHeatmap() {
  return renderCategoryHeatmap({
    containerId: "heatmap",
    categoryId: getHeatmapCategoryId(),
    mode: heatmapMode,
    date: getHeatmapDate()
  });
}

function getAnalyticsMonthKey() {
  const date = getHeatmapDate();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

async function renderFilteredAnalytics() {
  await Promise.all([
    renderAnalytics({
      monthKey: getAnalyticsMonthKey()
    }),
    renderSelectedHeatmap()
  ]);
}

window.setMode = (mode) => {
  heatmapMode = mode;
  document.querySelectorAll("[data-heatmap-mode]").forEach(button => {
    const isActive = button.dataset.heatmapMode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderSelectedHeatmap();
};

async function initApp() {
  await openDB();
  initState();
  setupMonthSwitcher();
  await seedCategoriesIfEmpty();
  categoryMap = await populateCategorySelect();

  const heatmapCategorySelect = document.getElementById("heatmap-category");
  heatmapCategorySelect?.addEventListener("change", renderSelectedHeatmap);
  const heatmapMonth = document.getElementById("heatmap-month");
  const today = new Date();
  heatmapMonth.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  heatmapMonth.addEventListener("change", renderFilteredAnalytics);
  window.setMode(heatmapMode);

  await populateCurrencySelect();
  setupExpenseForm();
  setupCategoryManager();
  await renderMonthlyExpenses();
  await renderMonthlySummary();
  setupMealTypeUI();
  setupThemeToggle();
  setupPrivacyLock();
}

initApp().catch(console.error);

const exportPanel = document.getElementById("export-panel");
const exportRangeFields = document.getElementById("export-range-fields");
const exportPeriodOptions = exportPanel.querySelectorAll('input[name="export-period"]');

exportPeriodOptions.forEach(option => {
  option.onchange = () => {
    exportRangeFields.hidden = option.value !== "range";
    exportPanel.querySelector("#export-message").textContent = "";
  };
});

document.getElementById("export-btn").onclick = () => {
  exportPanel.hidden = !exportPanel.hidden;
  if (!exportPanel.hidden) {
    const monthKey = getActiveMonthKey();
    exportPanel.querySelector('input[name="export-period"][value="current"]').checked = true;
    exportRangeFields.hidden = true;
    exportPanel.querySelector("#export-start-month").value = monthKey;
    exportPanel.querySelector("#export-end-month").value = monthKey;
    exportPanel.querySelector("#export-message").textContent = "";
  }
};

exportPanel.onsubmit = async event => {
  event.preventDefault();
  const message = exportPanel.querySelector("#export-message");
  try {
    const currentMonthOnly =
      exportPanel.querySelector('input[name="export-period"]:checked').value === "current";
    const currentMonth = getActiveMonthKey();
    await exportCSV(
      currentMonthOnly ? currentMonth : exportPanel.querySelector("#export-start-month").value,
      currentMonthOnly ? currentMonth : exportPanel.querySelector("#export-end-month").value
    );
    message.textContent = "CSV downloaded.";
  } catch (error) {
    message.textContent = error.message;
  }
};

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

    if (tab === "analytics") renderFilteredAnalytics();
  };
});

export function renderApp() {
  const home = document.getElementById("home-view");
  const history = document.getElementById("history-view");
  const settings = document.getElementById("settings-view");
  const expenseForm = document.getElementById("expense-form-view");
  const activeNavigation = state.view === "expenseForm" ? "home" : state.view;
  document.querySelectorAll(".nav-button").forEach(button => {
    const isActive = button.id === `${activeNavigation}Btn`;
    button.classList.toggle("active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

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

document.querySelector("#historyBtn").onclick = async () => {
  state.view = "history";
  renderApp();
  document.querySelectorAll(".tab").forEach(button =>
    button.classList.toggle("active", button.dataset.tab === "list")
  );
  document.getElementById("list-tab").style.display = "block";
  document.getElementById("analytics-tab").style.display = "none";
  await resetToCurrentMonth();
};

document.querySelector("#settingsBtn").onclick = () => {
  state.view = "settings";
  renderApp();
};

document.querySelector("#addExpenseBtn").onclick = () => {
  state.view = "expenseForm";
  renderApp();
};

window.goHome = async () => {
  state.view = "home";
  renderApp();
  await renderMonthlySummary();
};

renderApp();
renderTodayDate();

if ("serviceWorker" in navigator) {
  const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (isLocalDevelopment) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => registrations.forEach(registration => registration.unregister()))
      .catch(console.error);
  } else {
    navigator.serviceWorker.register("./service-worker.js").catch(console.error);
  }
}
