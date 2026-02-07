export function formatDateWithWeekday(dateStr) {
    const d = new Date(dateStr);

    const weekday = d.toLocaleDateString("en-SG", { weekday: "short" });
    const date = d.toLocaleDateString("en-SG", {
        day: "numeric",
        month: "short"
    });

    return `${weekday} · ${date}`;
}
