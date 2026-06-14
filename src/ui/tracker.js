import { getMonthRange, getYearRange, getExpensesByDateRange } from "../features/expenses.js";
import { filterByCategory } from "../features/categories.js";
import { formatLocalDate } from "../features/utils.js";

function countByDate(expenses) {
    const map = {};

    for (const e of expenses) {
        if (!map[e.date]) {
            map[e.date] = { count: 0, total: 0 };
        }
        map[e.date].count += 1;
        map[e.date].total += Number(e.amount);
    }

    return map;
}

function formatHeatmapDate(date) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-SG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function showHeatmapTooltip(containerId, date, day, cell, lockSelection = false) {
    const tooltip = document.getElementById(`${containerId}-tooltip`);
    if (!tooltip) return;

    const container = document.getElementById(containerId);
    if (lockSelection) {
        container.dataset.selectedDate = date;
    }

    document.querySelectorAll(`#${containerId} .heat-cell.previewing`)
        .forEach(selected => selected.classList.remove("previewing"));
    cell.classList.add("previewing");

    if (lockSelection) {
        document.querySelectorAll(`#${containerId} .heat-cell.selected`)
            .forEach(selected => selected.classList.remove("selected"));
        cell.classList.add("selected");
    }

    tooltip.innerHTML = `
        <span>${formatHeatmapDate(date)}</span>
        <strong>$${(day.total / 100).toFixed(2)} spent</strong>
    `;
}

function createHeatmapCell({ containerId, date, day, month }) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "heat-cell";
    cell.dataset.count = Math.min(day.count, 4);
    cell.setAttribute("aria-label", `${formatHeatmapDate(date)}: $${(day.total / 100).toFixed(2)} spent`);

    if (new Date(`${date}T00:00:00`).getMonth() !== month) {
        cell.classList.add("out-month");
    }

    cell.dataset.date = date;
    cell.dataset.total = day.total;
    cell.addEventListener("click", () => showHeatmapTooltip(containerId, date, day, cell, true));
    cell.addEventListener("mouseenter", () => showHeatmapTooltip(containerId, date, day, cell));
    cell.addEventListener("focus", () => showHeatmapTooltip(containerId, date, day, cell, true));
    return cell;
}

function restoreLockedHeatmapSelection(containerId) {
    const container = document.getElementById(containerId);
    const selectedDate = container?.dataset.selectedDate;
    if (!selectedDate) return;

    const cell = [...container.querySelectorAll(".heat-cell")]
        .find(candidate => candidate.dataset.date === selectedDate);
    if (!cell) return;

    showHeatmapTooltip(containerId, selectedDate, {
        count: Number(cell.dataset.count),
        total: Number(cell.dataset.total)
    }, cell);
}

function generateCalendarGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Calculate days to go back to Monday
    // Sunday (0) → 6 days back, Monday (1) → 0 days back, Tuesday (2) → 1 day back, etc.
    const daysToMonday = (firstDay.getDay() === 0) ? 6 : firstDay.getDay() - 1;

    const start = new Date(firstDay);
    start.setDate(start.getDate() - daysToMonday);

    // Calculate days forward to Sunday (end of Mon-Sun week)
    const daysToSunday = (lastDay.getDay() === 0) ? 0 : 7 - lastDay.getDay();

    const end = new Date(lastDay);
    end.setDate(end.getDate() + daysToSunday);
    const grid = [];
    const current = new Date(start);

    while (current <= end) {
        grid.push(formatLocalDate(current));
        current.setDate(current.getDate() + 1);
    }

    return grid;
}

function calculateTotal(countMap) {
    const cents = Object.values(countMap)
        .reduce((sum, day) => sum + day.total, 0);
    return (cents / 100).toFixed(2);
}

export async function renderCategoryHeatmap({
    containerId,
    categoryId,
    mode = "month", // "month" | "year"
    date = new Date()
}) {
    const range = mode === "year"
        ? getYearRange(date)
        : getMonthRange(date);

    const expenses = await getExpensesByDateRange(range.start, range.end);

    const filtered = categoryId ? filterByCategory(expenses, categoryId) : expenses;
    const countMap = countByDate(filtered);

    let year = date.getFullYear();
    let month = date.getMonth();

    let gridDates;

    if (mode === "month") {
        gridDates = generateCalendarGrid(year, month);
    } else {
        gridDates = generateYearGrid(year);
    }
    renderHeatmapGrid({ containerId, gridDates, countMap, month });

    document.getElementById(`${containerId}-sum`)
        .textContent = `$${calculateTotal(countMap)}`;
}

function generateYearGrid(year) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);

    const grid = [];
    const current = new Date(start);

    while (current <= end) {
        grid.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() + 1);
    }

    return grid;
}

function renderHeatmapGrid({ containerId, gridDates, countMap, month }) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id "${containerId}" not found`);
        return;
    }
    container.innerHTML = "";
    delete container.dataset.selectedDate;
    container.onmouseleave = () => restoreLockedHeatmapSelection(containerId);
    const tooltip = document.getElementById(`${containerId}-tooltip`);
    if (tooltip) {
        tooltip.innerHTML = "<span>Select a day</span><strong>Tap a square to see spending</strong>";
    }

    gridDates.forEach((date) => {
        const day = countMap[date] || { count: 0, total: 0 };

        container.appendChild(createHeatmapCell({ containerId, date, day, month }));
    });
}
