import { getAllExpenses, deleteExpense } from "../features/expenses.js";

export async function renderList() {
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
          <div>${e.description}</div>
          <div class="expense-meta">${e.date} · ${e.category || "Uncategorised"}</div>
        </div>
        <div>
          <strong>$${(e.amount / 100).toFixed(2)}</strong>
          <button class="delete-btn">✕</button>
        </div>
      `;

            li.querySelector(".delete-btn").onclick = async () => {
                await deleteExpense(e.id);
                renderList();
            };

            list.appendChild(li);
        });

    return expenses;
}
