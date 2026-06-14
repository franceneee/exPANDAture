import { getCategories } from "../features/categories.js";

export async function populateCategorySelect() {
    const selects = document.querySelectorAll("select[data-category-dropdown]");
    if (selects.length === 0) return {};

    const categories = await getCategories();
    const map = {};
    categories.forEach(c => {
        map[c.id] = c.name;
    });

    selects.forEach(select => {
        select.innerHTML = "";
        categories.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
    });

    return map;
}
