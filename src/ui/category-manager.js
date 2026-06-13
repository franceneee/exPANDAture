import { getCategories, addCategory, deleteCategory } from "../features/categories.js";
import { populateCategorySelect } from "./category-select.js";

export async function setupCategoryManager() {
  const form = document.getElementById("category-form");
  const list = document.getElementById("category-list");

  async function refresh() {
    const categories = await getCategories();
    list.innerHTML = "";

    categories.forEach(category => {
      const item = document.createElement("li");
      item.className = "expense-item";
      item.innerHTML = `<span>${category.name}</span><button aria-label="Delete ${category.name}">×</button>`;
      item.querySelector("button").onclick = async () => {
        await deleteCategory(category.id);
        refresh();
        populateCategorySelect();
      };
      list.appendChild(item);
    });
  }

  form.onsubmit = async event => {
    event.preventDefault();
    await addCategory(form["category-name"].value);
    form.reset();
    refresh();
    populateCategorySelect();
  };

  refresh();
}
