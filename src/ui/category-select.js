import { getCategories } from "../features/categories.js";

export async function populateCategorySelect() {
    const select = document.getElementById("category");
    if (!select) return {};
    console.log("Found category select element:", select);

    const categories = await getCategories();
    console.log("Populating category select with:", categories);

    // select.innerHTML = `<option value="">Uncategorised</option>`;
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
