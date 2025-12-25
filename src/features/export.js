export function exportCSV(expenses, categoryMap) {
    const rows = [
        ["Date", "Description", "Amount", "Currency", "Category"]
    ];

    expenses.forEach(e => {
        rows.push([
            e.date,
            e.description,
            (e.amount / 100).toFixed(2),
            e.currency,
            categoryMap[e.categoryId] || "Uncategorised"
        ]);
    });

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "expenses.csv";
    a.click();
}
