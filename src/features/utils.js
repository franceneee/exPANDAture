import { getCategoryMap } from "../app.js";

export function formatDateWithWeekday(dateStr) {
    const date = new Date(dateStr);
    const weekday = date.toLocaleDateString("en-SG", { weekday: "short" });
    const shortDate = date.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
    return `${weekday} · ${shortDate}`;
}

export function formatSmartDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const weekday = date.toLocaleDateString("en-SG", { weekday: "short" });
    const shortDate = date.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
    if (sameDay(date, today)) return `${weekday} · ${shortDate} (Today)`;
    if (sameDay(date, yesterday)) return `${weekday} · ${shortDate} (Yesterday)`;
    return `${weekday} · ${shortDate}`;
}

export function getDayEmoji(dayExpenses) {
    if (!dayExpenses.length) return "🧾 ";
    const categories = getCategoryMap();
    const hasFood = dayExpenses.some(expense => expense.mealType);
    const hasDrink = dayExpenses.some(expense => ["ssb", "bubble tea"].includes(categories[expense.categoryId]));
    const hasShopping = dayExpenses.some(expense => ["shopping", "groceries"].includes(categories[expense.categoryId]));
    const total = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    if (hasFood) return "🍙 ";
    if (hasDrink) return "🧋 ";
    if (hasShopping) return "🛍️ ";
    if (total > 10000) return "💸 ";
    return "🧾 ";
}

export function renderTodayDate() {
    document.getElementById("today-date").textContent = new Date().toLocaleDateString("en-SG", {
        month: "short",
        day: "numeric",
        weekday: "short"
    });
}

export function calculateTotalCount(countMap) {
    return Object.values(countMap).reduce((a, b) => a + b, 0);
}

export function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
