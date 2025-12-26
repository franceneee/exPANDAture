let activeDate = null;

export function initState() {
    if (!activeDate) {
        activeDate = new Date();
    }
}

export function getActiveDate() {
    if (!activeDate) {
        initState();
    }
    return activeDate;
}

export function setActiveDate(date) {
    activeDate = date;
}

export function getActiveMonthKey() {
    const d = getActiveDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
