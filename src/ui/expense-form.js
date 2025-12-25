import { addExpense } from "../features/expenses.js";

export function setupExpenseForm(onAdd) {
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
            categoryId: f.category.value || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        f.reset();
        onAdd();
        dateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    };
}
