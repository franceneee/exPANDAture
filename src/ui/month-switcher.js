import { getActiveDate, setActiveDate, initState } from "../features/state.js";
import { renderMonthlyExpenses } from "./expense-list.js";
import { renderMonthlySummary } from "./summary.js";

function updateLabel() {
    const d = getActiveDate();
    document.getElementById("currentMonth").textContent =
        d.toLocaleString("default", { month: "long", year: "numeric" });
}

export function setupMonthSwitcher() {
    initState();

    document.getElementById("prevMonth").onclick = async () => {
        const d = getActiveDate();
        setActiveDate(new Date(d.getFullYear(), d.getMonth() - 1, 1));
        await refresh();
    };

    document.getElementById("nextMonth").onclick = async () => {
        const d = getActiveDate();
        setActiveDate(new Date(d.getFullYear(), d.getMonth() + 1, 1));
        await refresh();
    };

    updateLabel();
}

async function refresh() {
    updateLabel();
    await renderMonthlyExpenses();
    await renderMonthlySummary();
}
