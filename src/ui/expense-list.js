import { getAllExpenses, deleteExpense } from "../features/expenses.js";

export async function renderExpenses(categoryMap) {
  const list = document.getElementById("expense-list");
  const expenses = await getAllExpenses();

  list.innerHTML = "";
  expenses
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach(e => {
      const li = document.createElement("li");
      li.className = "expense-item";
      li.innerHTML = `
        <div>
          <strong>${e.description}</strong>
          <div class="meta">${e.date} · ${categoryMap[e.categoryId] || "Uncategorised"}</div>
        </div>
        <div>
          $${(e.amount / 100).toFixed(2)}
          <button data-id="${e.id}">✕</button>
        </div>
      `;

      li.querySelector("button").onclick = async () => {
        await deleteExpense(e.id);
        renderExpenses(categoryMap);
      };

      list.appendChild(li);
    });

  return expenses;
}
