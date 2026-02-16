import { getCategoryMap } from "../app.js";

export function formatDateWithWeekday(dateStr) {
    const d = new Date(dateStr);

    const weekday = d.toLocaleDateString("en-SG", { weekday: "short" });
    const date = d.toLocaleDateString("en-SG", {
        day: "numeric",
        month: "short"
    });

    return `${weekday} · ${date}`;
}

export function formatSmartDate(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const weekday = d.toLocaleDateString("en-SG", { weekday: "short" });
    const date = d.toLocaleDateString("en-SG", {
        day: "numeric",
        month: "short"
    });

    if (sameDay(d, today)) return `${weekday} · ${date} (Today)`;
    if (sameDay(d, yesterday)) return `${weekday} · ${date} (Yesterday)`;

    return `${weekday} · ${date}`;
}


export function getDayEmoji(dayExpenses) {
    if (!dayExpenses.length) return "🧾";
    const categories = getCategoryMap();

    const hasFood = dayExpenses.some(e => e.mealType);
    const hasDrink = dayExpenses.some(e => categories[e.categoryId] === "ssb" || categories[e.categoryId] === "bubble tea");
    const hasShopping = dayExpenses.some(e => categories[e.categoryId] === "shopping" || categories[e.categoryId] === "groceries");
    const total = dayExpenses.reduce((s, e) => s + e.amount, 0);

    if (hasFood) return "🍔";
    if (hasDrink) return "🧋";
    if (hasShopping) return "🛒";
    if (total > 10000) return "💸";     // > $100
    return "🧾";
}
