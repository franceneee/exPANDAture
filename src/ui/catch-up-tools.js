import { DEFAULT_CURRENCY, CURRENCIES } from "../models/constants.js";
import { getDefaultImportDate, importPreparedExpenses, prepareBulkImport, prepareCSVImport } from "../features/import.js";
import { showToast } from "./toast.js";

const BULK_START_ROWS = 1;
const MEAL_TYPES = ["", "breakfast", "lunch", "dinner", "snack", "dessert"];

export function setupCatchUpTools(getCategoryMap, onImportComplete) {
    const panel = document.getElementById("catch-up-panel");
    const toggleButton = document.getElementById("catch-up-btn");
    const csvForm = document.getElementById("csv-import-form");
    const csvInput = document.getElementById("csv-import-file");
    const csvPreview = document.getElementById("csv-import-preview");
    const csvSaveButton = document.getElementById("csv-import-save");
    const bulkBody = document.getElementById("bulk-add-rows");
    const addBulkRowButton = document.getElementById("bulk-add-row");
    const bulkForm = document.getElementById("bulk-add-form");
    const bulkPreview = document.getElementById("bulk-add-preview");
    let csvRows = [];

    toggleButton.onclick = () => {
        panel.hidden = !panel.hidden;
    };

    csvInput.onchange = async () => {
        csvRows = [];
        csvSaveButton.disabled = true;
        csvPreview.innerHTML = "";

        try {
            const file = csvInput.files[0];
            if (!file) throw new Error("Choose a CSV file first.");
            csvRows = await prepareCSVImport(await file.text(), getCategoryMap());
            const updateCSVSaveState = () => {
                csvSaveButton.disabled = csvRows.filter(row => row.selected).length === 0;
            };
            renderImportPreview(csvPreview, csvRows, { onSelectionChange: updateCSVSaveState });
            updateCSVSaveState();
        } catch (error) {
            csvPreview.innerHTML = `<p class="form-message">${escapeHTML(error.message)}</p>`;
            showToast(error.message || "Could not read CSV.", "error");
        }
    };

    csvForm.onsubmit = async event => {
        event.preventDefault();
        const count = await savePreparedRows(csvRows, csvPreview, csvSaveButton, onImportComplete, "CSV import complete.");
        if (count > 0) {
            csvForm.reset();
            csvRows = [];
        }
    };

    addBulkRowButton.onclick = () => addBulkRow(bulkBody, getCategoryMap);

    bulkForm.onsubmit = async event => {
        event.preventDefault();
        const bulkRows = await prepareBulkImport(readBulkRows(bulkBody));
        renderImportPreview(bulkPreview, bulkRows, { interactive: false });

        const selectedRows = bulkRows.filter(row => row.selected);
        if (selectedRows.length === 0) {
            showToast("No valid new bulk rows to save.", "error");
            return;
        }

        const count = await savePreparedRows(bulkRows, bulkPreview, null, onImportComplete, "Bulk expenses saved.");
        if (count > 0 && bulkRows.every(row => row.valid && !row.duplicate)) {
            resetBulkRows(bulkBody, getCategoryMap);
        }
    };

    resetBulkRows(bulkBody, getCategoryMap);
}

function renderImportPreview(container, rows, { interactive = true, onSelectionChange = null } = {}) {
    if (rows.length === 0) {
        container.innerHTML = `<p class="setting-note">No rows found yet.</p>`;
        return;
    }

    const counts = rows.reduce((summary, row) => {
        if (!row.valid) summary.invalid += 1;
        else if (row.duplicate) summary.duplicates += 1;
        else summary.ready += 1;
        return summary;
    }, { ready: 0, duplicates: 0, invalid: 0 });

    container.innerHTML = `
        <div class="import-summary">
            <strong>${counts.ready} ready</strong>
            <span>${counts.duplicates} duplicates skipped</span>
            <span>${counts.invalid} need fixes</span>
        </div>
        <div class="import-preview-list"></div>
    `;

    const list = container.querySelector(".import-preview-list");
    rows.forEach(row => {
        const item = document.createElement("label");
        item.className = `import-preview-row ${row.valid ? "" : "invalid"} ${row.duplicate ? "duplicate" : ""}`;
        const details = getRowDetails(row);
        item.innerHTML = `
            ${interactive ? `<input type="checkbox" ${row.selected ? "checked" : ""} ${!row.valid || row.duplicate ? "disabled" : ""} />` : ""}
            <span>
                <strong>Row ${row.rowNumber}: ${escapeHTML(details.title)}</strong>
                <small>${escapeHTML(details.meta)}</small>
                ${getRowNotes(row)}
            </span>
        `;

        const checkbox = item.querySelector("input");
        if (checkbox) {
            checkbox.onchange = () => {
                row.selected = checkbox.checked;
                onSelectionChange?.();
            };
        }

        list.appendChild(item);
    });
}

async function savePreparedRows(rows, preview, saveButton, onImportComplete, successMessage) {
    try {
        const count = await importPreparedExpenses(rows);
        if (count === 0) {
            showToast("No selected rows to import.", "error");
            return 0;
        }
        await onImportComplete();
        preview.innerHTML = "";
        if (saveButton) saveButton.disabled = true;
        showToast(`${successMessage} ${count} expenses added.`);
        return count;
    } catch (error) {
        showToast(error.message || "Could not import expenses.", "error");
        return 0;
    }
}

function addBulkRow(container, categoryMap) {
    const row = document.createElement("div");
    row.className = "bulk-row";
    row.innerHTML = `
        <div class="bulk-row-title">
            <span>Expense</span>
            <button type="button" class="bulk-remove-row secondary-button">Remove</button>
        </div>
        <label>Date
            <input type="date" name="date" value="${getDefaultImportDate()}" />
        </label>
        <label class="wide-field">Description
            <input type="text" name="description" placeholder="What was this for?" />
        </label>
        <label>Amount
            <input type="number" name="amount" step="0.01" min="0" placeholder="0.00" />
        </label>
        <label>Currency
            <select name="currency">${getCurrencyOptions()}</select>
        </label>
        <label>Category
            <select name="categoryId">${getCategoryOptions(categoryMap)}</select>
        </label>
        <label>Meal
            <select name="mealType">${getMealTypeOptions()}</select>
        </label>
    `;
    row.querySelector(".bulk-remove-row").onclick = () => {
        row.remove();
        syncBulkRows(container);
    };
    container.appendChild(row);
    syncBulkRows(container);
}

function resetBulkRows(container, categoryMap) {
    container.innerHTML = "";
    for (let index = 0; index < BULK_START_ROWS; index += 1) {
        addBulkRow(container, categoryMap);
    }
}

function syncBulkRows(container) {
    const rows = [...container.querySelectorAll(".bulk-row")];
    rows.forEach((row, index) => {
        row.querySelector(".bulk-row-title span").textContent = `Expense ${index + 1}`;
        const removeButton = row.querySelector(".bulk-remove-row");
        removeButton.hidden = rows.length === 1;
        removeButton.setAttribute("aria-label", `Remove expense ${index + 1}`);
    });
}

function readBulkRows(container) {
    return [...container.querySelectorAll(".bulk-row")].map(row => ({
        date: row.querySelector('[name="date"]').value,
        description: row.querySelector('[name="description"]').value,
        amount: row.querySelector('[name="amount"]').value,
        currency: row.querySelector('[name="currency"]').value,
        categoryId: row.querySelector('[name="categoryId"]').value || null,
        categoryName: row.querySelector('[name="categoryId"] option:checked')?.textContent || "",
        mealType: row.querySelector('[name="mealType"]').value
    }));
}

function getCurrencyOptions() {
    return CURRENCIES.map(currency =>
        `<option value="${currency.code}" ${currency.code === DEFAULT_CURRENCY ? "selected" : ""}>${currency.label}</option>`
    ).join("");
}

function getCategoryOptions(categoryMap) {
    return [
        `<option value="">Uncategorised</option>`,
        ...Object.entries(categoryMap()).map(([id, name]) =>
            `<option value="${escapeHTML(id)}">${escapeHTML(name)}</option>`
        )
    ].join("");
}

function getMealTypeOptions() {
    return MEAL_TYPES.map(mealType =>
        `<option value="${mealType}">${mealType || "No meal type"}</option>`
    ).join("");
}

function getRowDetails(row) {
    const expense = row.expense;
    if (!expense) {
        return {
            title: "Invalid row",
            meta: [row.date, row.description, row.amount].filter(Boolean).join(" | ")
        };
    }

    return {
        title: `${expense.date} | ${expense.description || "No description"} | $${(expense.amount / 100).toFixed(2)}`,
        meta: [expense.currency, row.categoryName || row.categoryId || "Uncategorised", expense.mealType || "No meal type"].join(" | ")
    };
}

function getRowNotes(row) {
    const notes = [
        ...row.errors,
        ...row.warnings,
        ...(row.duplicate ? ["Likely duplicate. Skipped by default."] : [])
    ];

    return notes.length ? `<em>${escapeHTML(notes.join(" "))}</em>` : "";
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
