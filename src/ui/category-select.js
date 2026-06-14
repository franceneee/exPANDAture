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
        if (select.hasAttribute("data-all-categories")) {
            const allOption = document.createElement("option");
            allOption.value = "";
            allOption.textContent = "All categories";
            select.appendChild(allOption);
        }
        categories.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
    });

    return map;
}
