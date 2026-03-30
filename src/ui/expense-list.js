import { getCategoryMap } from "../app.js";
import { getExpensesByMonthKey, getExpenseById, deleteExpense } from "../features/expenses.js";
import { getActiveMonthKey } from "../features/state.js";
import { formatSmartDate, getDayEmoji } from "../features/utils.js";
import { openEditForm } from "./expense-form.js";

export function groupExpensesByDay(expenses) {
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

  if (Object.keys(groups).length === 0) {
    list.innerHTML = "<li>No expenses this month</li>";
    return;
  }

  let categoryMap = getCategoryMap();

  expenses
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .sort((a, b) => b.date.localeCompare(a.date));

  renderGroupedByDay(expenses, list, categoryMap);
}

export function renderGroupedByDay(expenses, list, categoryMap) {
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
          <button id="deleteBtn" class="material-symbols-outlined small-button" data-id="${e.id}">delete</button>
          <button id="editBtn" class="material-symbols-outlined small-button" data-id="${e.id}">edit</button>
        </div>
      `;

        li.querySelector("#deleteBtn").onclick = async () => {
          await deleteExpense(e.id);
          await renderMonthlyExpenses();
        };

        li.querySelector("#editBtn").onclick = async () => {
          await getExpenseById(e.id).then(openEditForm);
        };

        breakdown.appendChild(li);
      });

      dayContainer.appendChild(header);
      dayContainer.appendChild(breakdown);

      list.appendChild(dayContainer);
    });
}
