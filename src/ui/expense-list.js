import { getCategoryMap, renderApp } from "../app.js";
import { getExpensesByMonthKey, getExpenseById, deleteExpense, groupByCategory } from "../features/expenses.js";
import { getActiveMonthKey, state } from "../features/state.js";
import { formatSmartDate, getDayEmoji } from "../features/utils.js";
import { openEditForm } from "./expense-form.js";

function groupExpensesByDay(expenses) {
  const groups = {};

  expenses.forEach(e => {
    if (!groups[e.date]) {
      groups[e.date] = {
        total: 0,
        items: []
      };
    }

    groups[e.date].items.push(e);
    groups[e.date].total += e.amount;
  });

  return groups;
}

export async function renderMonthlyExpenses() {
  const list = document.getElementById("expense-list");
  list.innerHTML = "";

  const expenses = await getExpensesByMonthKey(getActiveMonthKey());
  const groups = groupExpensesByDay(expenses);
  const monthlyTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  document.getElementById("trail-month-total").textContent =
    `$${(monthlyTotal / 100).toFixed(2)} spent`;

  if (Object.keys(groups).length === 0) {
    list.innerHTML = `<li class="empty-state"><strong>No bites logged this month.</strong><span>Your panda is confused.</span></li>`;
    return;
  }

  const categoryMap = getCategoryMap();

  expenses.sort((a, b) =>
    b.date.localeCompare(a.date) ||
    b.createdAt.localeCompare(a.createdAt)
  );

  renderGroupedByDay(expenses, list, categoryMap);
}

function renderGroupedByDay(expenses, list, categoryMap) {
  const groups = groupExpensesByDay(expenses);

  Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([date, group]) => {
      const emoji = getDayEmoji(groups[date].items);
      const dayContainer = document.createElement("li");
      dayContainer.className = "day-group";

      const header = document.createElement("div");
      header.className = "day-header";
      header.innerHTML = `
        ${emoji}${formatSmartDate(date)}
        <div class="sameline">$${(group.total / 100).toFixed(2)} <span class="material-symbols-outlined">arrow_forward_ios</span></div>
      `;

      const breakdown = document.createElement("ul");
      breakdown.style.display = "none";

      header.onclick = () => {
        breakdown.style.display =
          breakdown.style.display === "none" ? "block" : "none";
      };

      group.items.forEach(e => {

        const mealLabel = e.mealType ? `[${e.mealType}] ` : "";
        const li = document.createElement("li");
        li.className = "expense-item";

        li.innerHTML = `
        <div class="expense-main" data-id="${e.id}">
          <strong>${categoryMap[e.categoryId] || "Uncategorised"}</strong>
          <div class="meta">${mealLabel}${e.description}</div>
        </div>
        <div>
          $${(e.amount / 100).toFixed(2)}
          <button id="deleteBtn" class="small-button" data-id="${e.id}" aria-label="Delete expense">×</button>
          <button id="editBtn" class="material-symbols-outlined small-button" data-id="${e.id}" aria-label="Edit expense">edit</button>
        </div>
      `;

        li.querySelector("#deleteBtn").onclick = async () => {
          await deleteExpense(e.id);
          await renderMonthlyExpenses();
        };

        li.querySelector("#editBtn").onclick = async () => {
          const expense = await getExpenseById(e.id);
          state.view = "expenseForm";
          state.editingExpense = true;
          renderApp();
          await openEditForm(expense);
          renderApp()
        };

        breakdown.appendChild(li);
      });

      dayContainer.appendChild(header);
      dayContainer.appendChild(breakdown);

      list.appendChild(dayContainer);
    });
}

let categoryChartInstance;

function renderCategoryPie(expenses) {
  const ctx = document.getElementById("category-chart");
  if (!ctx) return;
  if (typeof Chart === "undefined") {
    ctx.replaceWith(Object.assign(document.createElement("p"), {
      className: "setting-note",
      textContent: "Charts need a connection the first time they are opened."
    }));
    return;
  }

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  const categoryMap = getCategoryMap();
  const grouped = groupByCategory(expenses);

  const labels = Object.keys(grouped).map(id => categoryMap[id] || "Other");
  const data = Object.values(grouped).map(v => v / 100);

  categoryChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

export async function renderAnalytics({ monthKey = getActiveMonthKey() } = {}) {
  const expenses = await getExpensesByMonthKey(monthKey);
  renderCategoryPie(expenses);
}
