import { getStore, requestToPromise } from "../db/db.js";

const BACKUP_FORMAT = "expandature-backup";
const BACKUP_VERSION = 1;
const STORE_NAMES = ["expenses", "categories"];
const LOCAL_STORAGE_KEYS = ["expandature_theme", "expandature_pin"];

export async function createBackup() {
    const data = {};

    for (const storeName of STORE_NAMES) {
        data[storeName] = await requestToPromise(getStore(storeName).getAll());
    }

    return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        data,
        settings: readLocalSettings()
    };
}

export async function downloadBackup(prefix = "expandature-backup") {
    const backup = await createBackup();
    downloadJson(backup, `${prefix}-${formatDateForFilename(new Date())}.json`);
    return backup;
}

export async function parseBackupFile(file) {
    if (!file) {
        throw new Error("Choose a backup file first.");
    }

    let backup;
    try {
        backup = JSON.parse(await file.text());
    } catch {
        throw new Error("That file is not valid JSON.");
    }

    validateBackup(backup);
    return backup;
}

export function getBackupSummary(backup) {
    return {
        expenses: backup.data.expenses.length,
        categories: backup.data.categories.length,
        exportedAt: backup.exportedAt
    };
}

export async function restoreBackup(backup, mode = "merge") {
    validateBackup(backup);

    if (mode === "replace") {
        await downloadBackup("expandature-pre-restore");
        await clearStores();
        await putRecords("expenses", backup.data.expenses);
        await putRecords("categories", backup.data.categories);
    } else {
        await mergeRecords("expenses", backup.data.expenses);
        await mergeRecords("categories", backup.data.categories, "name");
    }

    restoreLocalSettings(backup.settings);
}

function validateBackup(backup) {
    if (!backup || backup.format !== BACKUP_FORMAT) {
        throw new Error("This does not look like an exPANDAture backup.");
    }

    if (backup.version !== BACKUP_VERSION) {
        throw new Error(`Backup version ${backup.version} is not supported yet.`);
    }

    for (const storeName of STORE_NAMES) {
        if (!Array.isArray(backup.data?.[storeName])) {
            throw new Error(`Backup is missing ${storeName}.`);
        }
    }
}

async function clearStores() {
    for (const storeName of STORE_NAMES) {
        await requestToPromise(getStore(storeName, "readwrite").clear());
    }
}

async function putRecords(storeName, records) {
    for (const record of records) {
        await requestToPromise(getStore(storeName, "readwrite").put(record));
    }
}

async function mergeRecords(storeName, records, uniqueField = null) {
    const existing = await requestToPromise(getStore(storeName).getAll());
    const existingIds = new Set(existing.map(record => String(record.id)));
    const existingUniqueValues = uniqueField
        ? new Set(existing.map(record => String(record[uniqueField]).toLowerCase()))
        : new Set();

    for (const record of records) {
        if (existingIds.has(String(record.id))) continue;
        if (uniqueField && existingUniqueValues.has(String(record[uniqueField]).toLowerCase())) continue;
        await requestToPromise(getStore(storeName, "readwrite").add(record));
    }
}

function readLocalSettings() {
    return LOCAL_STORAGE_KEYS.reduce((settings, key) => {
        const value = localStorage.getItem(key);
        if (value !== null) settings[key] = value;
        return settings;
    }, {});
}

function restoreLocalSettings(settings = {}) {
    Object.entries(settings).forEach(([key, value]) => {
        if (LOCAL_STORAGE_KEYS.includes(key) && typeof value === "string") {
            localStorage.setItem(key, value);
        }
    });
}

function downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDateForFilename(date) {
    return date.toISOString().slice(0, 19).replace(/[:T]/g, "-");
}
