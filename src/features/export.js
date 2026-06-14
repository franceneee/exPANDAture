import { getCategoryMap } from "../app.js";
import { getExpensesByMonthKey } from "./expenses.js";

function escapeCSVField(value) {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text)
        ? `"${text.replaceAll('"', '""')}"`
        : text;
}

export async function exportCSV(monthKey) {
    const rows = [
        ["Date", "Description", "Amount", "Currency", "Category", "Meal Type"]
    ];
    const expenses = await getExpensesByMonthKey(monthKey);
    const categoryMap = getCategoryMap();
    expenses.forEach(e => {
        rows.push([
            e.date,
            e.description,
            (e.amount / 100).toFixed(2),
            e.currency,
            categoryMap[e.categoryId] || "Uncategorised",
            e.mealType || ""
        ]);
    });

    const csv = rows.map(row => row.map(escapeCSVField).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });

    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `expenses-${monthKey}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
