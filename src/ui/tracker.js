import { getMonthRange, getYearRange, getExpensesByDateRange } from "../features/expenses.js";
import { filterByCategory } from "../features/categories.js";
import { state } from "../features/state.js";
import { getActiveMonthKey } from "../features/state.js";
import { getCategoryMap } from "../app.js";

function countByDate(expenses) {
    const map = {};

    for (const e of expenses) {
        map[e.date] = e.amount;
    }

    return map;
}

export function generateCalendarGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Helper to format date in local time (not UTC)
    const formatLocalDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

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

function calculateHabitSum(countMap, year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let sum = 0;

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d)
            .toISOString()
            .slice(0, 10);

        if (countMap[date] > 0)
            sum += countMap[date];
    }

    return (sum / 100).toFixed(2);
}

function calculateYearSum(countMap, year) {
    const days = (new Date(year, 11, 31) - new Date(year, 0, 1)) / 86400000 + 1;

    let sum = 0;

    for (let d = 1; d <= days; d++) {
        const date = new Date(year, 0, d)
            .toISOString()
            .slice(0, 10);

        if (countMap[date] > 0)
            sum += countMap[date];
    }

    return (sum / 100).toFixed(2);
}

export function renderHeatmap({ containerId, countMap, year, month }) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const grid = generateCalendarGrid(year, month);

    grid.forEach(date => {
        const count = countMap[date] || 0;

        const cell = document.createElement("div");
        cell.className = "heat-cell";
        cell.dataset.count = Math.min(count, 4); // cap at 4

        // fade out days not in current month
        const d = new Date(date);
        if (d.getMonth() !== month) {
            cell.classList.add("out-month");
        }

        cell.title = `${date}: ${count} entries`;

        container.appendChild(cell);

        categoryMap = getCategoryMap();
        console.log(categoryMap);
    });
}

export async function renderCategoryHeatmap({
    containerId,
    categoryId,
    mode = "month" // "month" | "year"
}) {
    const date = state.activeDate;
    const range = mode === "year"
        ? getYearRange(date)
        : getMonthRange(date);

    const expenses = await getExpensesByDateRange(range.start, range.end);

    const filtered = filterByCategory(expenses, categoryId);
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

    const sum = mode === "month"
        ? calculateHabitSum(countMap, year, month)
        : calculateYearSum(countMap, year);

    document.getElementById(`${containerId}-sum`)
        .textContent = `$${sum}`;
}

export function generateYearGrid(year) {
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

    gridDates.forEach((date) => {
        const count = countMap[date] || 0;

        const cell = document.createElement("div");
        cell.className = "heat-cell";
        cell.dataset.count = Math.min(count, 4);

        // grey out days not in current month
        const d = new Date(date);
        if (d.getMonth() !== month) {
            cell.classList.add("out-month");
        }

        container.appendChild(cell);
    });
}