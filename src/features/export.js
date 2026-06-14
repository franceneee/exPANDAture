import { getCategoryMap } from "../app.js";
import { getExpensesByDateRange } from "./expenses.js";

function escapeCSVField(value) {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text)
        ? `"${text.replaceAll('"', '""')}"`
        : text;
}

function monthRange(startMonth, endMonth) {
    const [endYear, endIndex] = endMonth.split("-").map(Number);
    const lastDay = new Date(endYear, endIndex, 0).getDate();
    return {
        start: `${startMonth}-01`,
        end: `${endMonth}-${String(lastDay).padStart(2, "0")}`
    };
}

export async function exportCSV(startMonth, endMonth = startMonth) {
    if (startMonth > endMonth) {
        throw new Error("Start month must be before or equal to end month.");
    }

    const rows = [
        ["Date", "Description", "Amount", "Currency", "Category", "Meal Type"]
    ];
    const range = monthRange(startMonth, endMonth);
    const expenses = await getExpensesByDateRange(range.start, range.end);
    const categoryMap = getCategoryMap();
    expenses
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach(e => {
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
    const suffix = startMonth === endMonth ? startMonth : `${startMonth}-to-${endMonth}`;
    a.download = `expenses-${suffix}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
