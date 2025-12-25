import { getCategories, addCategory, deleteCategory } from "../features/categories.js";
import { populateCategorySelect } from "./category-select.js";

export async function setupCategoryManager() {
  const form = document.getElementById("category-form");
  const list = document.getElementById("category-list");

  async function refresh() {
    const cats = await getCategories();
    list.innerHTML = "";

    cats.forEach(c => {
      const li = document.createElement("li");
      li.className = "expense-item";
      li.innerHTML = `<span>${c.name}</span><button>✕</button>`;
      li.querySelector("button").onclick = async () => {
        await deleteCategory(c.id);
        refresh();
        populateCategorySelect();
      };
      list.appendChild(li);
    });
  }

  form.onsubmit = async e => {
    e.preventDefault();
    await addCategory(form["category-name"].value);
    form.reset();
    refresh();
    populateCategorySelect();
  };

  refresh();
}
