export const state = {
    activeDate: new Date(),
    editingExpense: null,   // null = creating new
    view: "home"
};

export function initState() {
    if (!state.activeDate) {
        state.activeDate = new Date();
    }
}

export function getActiveDate() {
    if (!state.activeDate) {
        initState();
    }
    return state.activeDate;
}

export function setActiveDate(date) {
    state.activeDate = date;
}

export function getActiveMonthKey() {
    const d = getActiveDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
