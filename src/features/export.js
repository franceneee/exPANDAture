import { getCategoryMap } from "../app.js";
import { getExpensesByMonthKey } from "./expenses.js";

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

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "expenses.csv";
    a.click();
}
