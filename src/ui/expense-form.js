import { addExpense, updateExpense } from "../features/expenses.js";
import { state } from "../features/state.js";
import { renderMonthlySummary } from "./summary.js";
import { renderMonthlyExpenses } from "./expense-list.js";
import { setupMealTypeUI, hideMealTypeUI } from "./meal-type-ui.js";
import { getCategoryMap, renderApp } from "../app.js";
import { showToast } from "./toast.js";

const LAST_EXPENSE_DATE_KEY = "expandature_last_expense_date";

function getMonthKey(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function setupExpenseForm() {
    const f = document.getElementById("expense-form");
    const dateInput = f.querySelector("input[name='date']");
    const amountInput = f.querySelector("input[name='amount']");
    setDefaultDate(dateInput);
    syncDateDisplay(dateInput);
    dateInput.addEventListener("input", () => syncDateDisplay(dateInput));
    dateInput.addEventListener("change", () => syncDateDisplay(dateInput));
    document.getElementById("resetBtn").onclick = () => { resetFormMode(); };
    document.getElementById("closeBtn").onclick = () => { state.view = "home"; renderApp(); };
    amountInput.addEventListener("input", () => clearAmountError(amountInput));

    f.onsubmit = async e => {
        e.preventDefault();
        const rawAmount = Number(f.amount.value);

        if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
            showAmountError(amountInput, "Enter an amount greater than zero.");
            return;
        }
        clearAmountError(amountInput);

        const base = {
            description: f.description.value,
            date: f.date.value,
            amount: Math.round(Number(rawAmount) * 100),
            monthKey: getMonthKey(f.date.value),
            categoryId: f.category.value || null,
            mealType: f["meal-type-select"]?.value || null,
            updatedAt: new Date().toISOString(),
        };

        try {
            if (state.editingExpense) {
                setupMealTypeUI();
                await updateExpense({
                    ...state.editingExpense,
                    ...base
                });
                rememberExpenseDate(base.date);

                state.editingExpense = null;
                state.view = "history";

                resetFormMode();
                renderApp();
                await Promise.all([renderMonthlyExpenses(), renderMonthlySummary()]);
                showToast("Expense updated.");
            } else {
                await addExpense({
                    id: crypto.randomUUID(),
                    date: f.date.value,
                    description: f.description.value,
                    amount: Math.round(rawAmount * 100),
                    currency: f.currency.value,
                    monthKey: getMonthKey(f.date.value),
                    categoryId: f.category.value || null,
                    mealType: f["meal-type-select"].value || null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                rememberExpenseDate(f.date.value);

                renderApp();
                await Promise.all([renderMonthlyExpenses(), renderMonthlySummary()]);
                f.reset();
                setDefaultDate(dateInput);
                syncDateDisplay(dateInput);
                hideMealTypeUI();
                showToast("Expense saved.");
            }
        } catch (error) {
            showToast(error.message || "Could not save expense.", "error");
        }
    }
}

export function openEditForm(expense) {
    state.editingExpense = expense;

    const form = document.getElementById("expense-form");
    clearAmountError(form.amount);
    form.description.value = expense.description;
    form.amount.value = expense.amount / 100;
    form.date.value = expense.date;
    syncDateDisplay(form.date);
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
    clearAmountError(form.amount);
    const mealWrapper = form.querySelector("#meal-type-wrapper");
    mealWrapper.style.display = "none";

    const dateInput = form.querySelector("input[name='date']");
    setDefaultDate(dateInput);
    syncDateDisplay(dateInput);
    document.getElementById("form-title").textContent = "Add Expense";
    document.getElementById("submitBtn").textContent = "save";
}

function setDefaultDate(input) {
    input.value = getRememberedExpenseDate() || getTodayDate();
}

function syncDateDisplay(input) {
    const display = document.getElementById("date-display");
    if (!display) return;

    display.textContent = isDateInputValue(input.value)
        ? new Date(`${input.value}T00:00:00`).toLocaleDateString("en-SG", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
        : "Pick a date";
}

function rememberExpenseDate(date) {
    if (isDateInputValue(date)) {
        localStorage.setItem(LAST_EXPENSE_DATE_KEY, date);
    }
}

function getRememberedExpenseDate() {
    const rememberedDate = localStorage.getItem(LAST_EXPENSE_DATE_KEY);
    return isDateInputValue(rememberedDate) ? rememberedDate : null;
}

function getTodayDate() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function isDateInputValue(date) {
    return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function showAmountError(input, message) {
    const error = document.getElementById("amount-error");
    error.textContent = message;
    error.hidden = false;
    input.setAttribute("aria-invalid", "true");
    input.focus();
}

function clearAmountError(input) {
    const error = document.getElementById("amount-error");
    error.textContent = "";
    error.hidden = true;
    input.removeAttribute("aria-invalid");
}
