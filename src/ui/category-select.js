import { getCategories } from "../features/categories.js";

export async function populateCategorySelect() {
    const select = document.getElementById("category");
    if (!select) return {};
    const categories = await getCategories();
    select.innerHTML = "";

    const map = {};

    categories.forEach(c => {
        map[c.id] = c.name;

        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
    });

    return map;
}
