import { getCategoryMap } from "../app.js";

export function setupMealTypeUI() {
    var foodCategory;
    const categoryMap = getCategoryMap();

    for (const [id, name] of Object.entries(categoryMap)) {
        if (name.toLowerCase() === "food") {
            foodCategory = Number(id);
            break;
        }
    }

    const categorySelect = document.getElementById("category");
    const wrapper = document.getElementById("meal-type-wrapper");
    const mealSelect = document.getElementById("meal-type-select");

    categorySelect.addEventListener("change", () => {
        if (Number(categorySelect.value) === foodCategory) {
            wrapper.style.display = "block";
        } else {
            wrapper.style.display = "none";
            mealSelect.value = "";
        }
    });
}

export function hideMealTypeUI() {
    const wrapper = document.getElementById("meal-type-wrapper");
    const mealSelect = document.getElementById("meal-type-select");
    wrapper.style.display = "none";
    mealSelect.value = "";
}
