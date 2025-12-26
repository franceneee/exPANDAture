import { getExpensesByMonthKey } from "../features/expenses.js";
import { getActiveMonthKey } from "../features/state.js";

export async function renderMonthlySummary() {
    const totalEl = document.getElementById("monthlyTotal");
    const monthKey = getActiveMonthKey();

    const expenses = await getExpensesByMonthKey(monthKey);
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // 2 decimal places
    totalEl.textContent = (total / 100).toFixed(2);
}