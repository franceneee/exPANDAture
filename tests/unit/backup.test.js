import { beforeEach, describe, expect, test, vi } from "vitest";
import { openDB, getStore, requestToPromise } from "../../src/db/db.js";
import { createBackup, getBackupSummary, restoreBackup } from "../../src/features/backup.js";

describe("backup and restore", () => {
  beforeEach(async () => {
    await openDB();
    await clearStore("expenses");
    await clearStore("categories");
    localStorage.clear();
  });

  test("creates a backup with app format, records, and local settings", async () => {
    await addCategory({ id: "food", name: "food" });
    await addExpense({ id: "expense-1", date: "2026-06-19", description: "Tea", amount: 620, currency: "SGD", monthKey: "2026-06", categoryId: "food", mealType: "dessert" });
    localStorage.setItem("expandature_theme", "red-panda");

    const backup = await createBackup();

    expect(backup).toMatchObject({
      format: "expandature-backup",
      version: 1,
      data: {
        expenses: [expect.objectContaining({ id: "expense-1" })],
        categories: [expect.objectContaining({ id: "food" })]
      },
      settings: {
        expandature_theme: "red-panda"
      }
    });
    expect(getBackupSummary(backup)).toMatchObject({ expenses: 1, categories: 1 });
  });

  test("merge restore adds new records without duplicating category names", async () => {
    await addCategory({ id: "existing-food", name: "food" });

    await restoreBackup({
      format: "expandature-backup",
      version: 1,
      exportedAt: "2026-06-20T00:00:00.000Z",
      data: {
        expenses: [{ id: "expense-1", date: "2026-06-19", description: "Tea", amount: 620, currency: "SGD", monthKey: "2026-06", categoryId: "backup-food", mealType: null }],
        categories: [{ id: "backup-food", name: "food" }]
      },
      settings: { expandature_theme: "red-panda" }
    });

    expect(await getAll("expenses")).toHaveLength(1);
    expect(await getAll("categories")).toHaveLength(1);
    expect(localStorage.getItem("expandature_theme")).toBe("red-panda");
  });

  test("replace restore clears existing records after creating a safety backup", async () => {
    mockDownload();
    await addCategory({ id: "old-food", name: "old food" });
    await addExpense({ id: "old-expense", date: "2026-05-01", description: "Old", amount: 100, currency: "SGD", monthKey: "2026-05", categoryId: "old-food", mealType: null });

    await restoreBackup({
      format: "expandature-backup",
      version: 1,
      exportedAt: "2026-06-20T00:00:00.000Z",
      data: {
        expenses: [{ id: "new-expense", date: "2026-06-19", description: "Tea", amount: 620, currency: "SGD", monthKey: "2026-06", categoryId: "food", mealType: null }],
        categories: [{ id: "food", name: "food" }]
      },
      settings: {}
    }, "replace");

    expect(await getAll("expenses")).toEqual([expect.objectContaining({ id: "new-expense" })]);
    expect(await getAll("categories")).toEqual([expect.objectContaining({ id: "food" })]);
  });

  test("rejects unsupported backup shapes", async () => {
    await expect(restoreBackup({ format: "other-app" })).rejects.toThrow("exPANDAture backup");
  });
});

async function addExpense(record) {
  await requestToPromise(getStore("expenses", "readwrite").add(record));
}

async function addCategory(record) {
  await requestToPromise(getStore("categories", "readwrite").add(record));
}

async function getAll(storeName) {
  return requestToPromise(getStore(storeName).getAll());
}

async function clearStore(storeName) {
  await requestToPromise(getStore(storeName, "readwrite").clear());
}

function mockDownload() {
  URL.createObjectURL = vi.fn(() => "blob:backup");
  URL.revokeObjectURL = vi.fn();
  globalThis.document = {
    body: {
      appendChild: vi.fn()
    },
    createElement: vi.fn(() => ({
      click: vi.fn(),
      remove: vi.fn()
    }))
  };
}
