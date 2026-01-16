import { getCategoryMap } from "../app.js";
import { getExpensesByMonthKey, getExpenseById, deleteExpense } from "../features/expenses.js";
import { getActiveMonthKey } from "../features/state.js";
import { openEditForm } from "./expense-form.js";

export async function renderMonthlyExpenses() {
  const list = document.getElementById("expense-list");
  list.innerHTML = "";

  const expenses = await getExpensesByMonthKey(getActiveMonthKey());

  if (expenses.length === 0) {
    list.innerHTML = "<li>No expenses this month</li>";
    return;
  }

  let categoryMap = getCategoryMap();

  expenses
    .sort((a, b) => b.date.localeCompare(a.date))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .forEach(e => {
      const mealLabel = e.mealType ? `[${e.mealType}] ` : "";
      const li = document.createElement("li");
      li.className = "expense-item";
      li.innerHTML = `
        <div class="expense-main" data-id="${e.id}">
          <strong>${mealLabel}${e.description}</strong>
          <div class="meta">${e.date} · ${categoryMap[e.categoryId] || "Uncategorised"}</div>
        </div>
        <div>
          $${(e.amount / 100).toFixed(2)}
          <button class="material-symbols-outlined small-button" data-id="${e.id}">delete</button>
          <button class="material-symbols-outlined small-button">edit</button>
        </div>
      `;

      li.querySelector("button").onclick = async () => {
        await deleteExpense(e.id);
        await renderMonthlyExpenses();
      };

      li.querySelector(".expense-main").onclick = async () => {
        await getExpenseById(e.id).then(openEditForm);
      };

      list.appendChild(li);
    });

  return expenses;
}

