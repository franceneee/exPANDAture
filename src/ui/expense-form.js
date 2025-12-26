import { addExpense } from "../features/expenses.js";
import { renderMonthlySummary } from "./summary.js";
import { renderMonthlyExpenses } from "./expense-list.js";
import { setupMealTypeUI, hideMealTypeUI } from "./meal-type-ui.js";

function getMonthKey(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function setupExpenseForm() {
    const f = document.getElementById("expense-form");
    // Set default date
    const dateInput = f.querySelector("input[name='date']");
    const today = new Date();
    dateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    f.onsubmit = async e => {
        e.preventDefault();

        await addExpense({
            id: crypto.randomUUID(),
            date: f.date.value,
            description: f.description.value,
            amount: Math.round(parseFloat(f.amount.value) * 100),
            currency: f.currency.value,
            monthKey: getMonthKey(f.date.value),
            categoryId: f.category.value || null,
            mealType: f["meal-type-select"].value || "other",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }).then(() => {
            renderMonthlyExpenses();
        }).then(() => {
            renderMonthlySummary();
        });

        f.reset();
        dateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        hideMealTypeUI();
    };
}
