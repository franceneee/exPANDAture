import { addExpense, updateExpense } from "../features/expenses.js";
import { state } from "../features/state.js";
import { renderMonthlySummary } from "./summary.js";
import { renderMonthlyExpenses } from "./expense-list.js";
import { setupMealTypeUI, hideMealTypeUI } from "./meal-type-ui.js";
import { getCategoryMap, renderApp } from "../app.js";

function getMonthKey(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function setupExpenseForm() {
    const f = document.getElementById("expense-form");
    const dateInput = f.querySelector("input[name='date']");
    setToday(dateInput);
    document.getElementById("resetBtn").onclick = () => { resetFormMode(); };
    document.getElementById("closeBtn").onclick = () => { state.view = "home"; renderApp(); };

    f.onsubmit = async e => {
        e.preventDefault();
        const rawAmount = Number(f.amount.value);

        if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        const base = {
            description: f.description.value,
            date: f.date.value,
            amount: Math.round(Number(rawAmount) * 100),
            monthKey: getMonthKey(f.date.value),
            categoryId: f.category.value || null,
            mealType: f["meal-type-select"]?.value || null,
            updatedAt: new Date().toISOString(),
        };

        if (state.editingExpense) {
            setupMealTypeUI();
            await updateExpense({
                ...state.editingExpense,
                ...base
            });

            state.editingExpense = null;
            state.view = "history";

            resetFormMode();
            renderApp();
            await Promise.all([renderMonthlyExpenses(), renderMonthlySummary()]);
        } else {
            await addExpense({
                id: crypto.randomUUID(),
                date: f.date.value,
                description: f.description.value,
                amount: Math.round(parseFloat(f.amount.value) * 100),
                currency: f.currency.value,
                monthKey: getMonthKey(f.date.value),
                categoryId: f.category.value || null,
                mealType: f["meal-type-select"].value || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            renderApp();
            await Promise.all([renderMonthlyExpenses(), renderMonthlySummary()]);
            f.reset();
            setToday(dateInput);
            hideMealTypeUI();
        };
    }
}

export function openEditForm(expense) {
    state.editingExpense = expense;

    const form = document.getElementById("expense-form");
    form.description.value = expense.description;
    form.amount.value = expense.amount / 100;
    form.date.value = expense.date;
    form.category.value = expense.categoryId;
    setupMealTypeUI();

    const categorySelect = form.querySelector("#category");
    const mealWrapper = form.querySelector("#meal-type-wrapper");
    const mealSelect = form.querySelector("#meal-type-select");
    const selectedCategory = categorySelect.value;
    const categoryMap = getCategoryMap();
    const categoryName = categoryMap[selectedCategory]?.toLowerCase();

    if (categoryName === "food") {
        mealWrapper.style.display = "block";
        mealSelect.value = expense.mealType || "";
    } else {
        mealWrapper.style.display = "none";
        mealSelect.value = "";
    }

    document.getElementById("form-title").textContent = "Edit Expense";
    document.getElementById("submitBtn").textContent = "save";
}

function resetFormMode() {
    state.editingExpense = null;

    const form = document.getElementById("expense-form");
    form.reset();
    const mealWrapper = form.querySelector("#meal-type-wrapper");
    mealWrapper.style.display = "none";

    const dateInput = form.querySelector("input[name='date']");
    setToday(dateInput);
    document.getElementById("form-title").textContent = "Add Expense";
    document.getElementById("submitBtn").textContent = "save";
}

function setToday(input) {
    const today = new Date();
    input.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
