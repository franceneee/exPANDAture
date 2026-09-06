import { beforeEach, describe, expect, test } from "vitest";
import { openDB, getStore, requestToPromise } from "../../src/db/db.js";
import { seedCategoriesIfEmpty } from "../../src/db/seed.js";
import {
  getDefaultImportDate,
  importPreparedExpenses,
  parseExpenseCSV,
  prepareBulkImport,
  prepareCSVImport
} from "../../src/features/import.js";

describe("CSV parsing", () => {
  test("parses app export rows including quoted commas and escaped quotes", () => {
    const rows = parseExpenseCSV([
      "Date,Description,Amount,Currency,Category,Meal Type",
      "2026-06-19,\"bubble tea, large\",6.20,SGD,food,dessert",
      "2026-06-20,\"said \"\"hello\"\"\",3.50,SGD,social,"
    ].join("\n"));

    expect(rows).toMatchObject([
      {
        rowNumber: 2,
        date: "2026-06-19",
        description: "bubble tea, large",
        amount: "6.20",
        currency: "SGD",
        categoryName: "food",
        mealType: "dessert"
      },
      {
        rowNumber: 3,
        description: "said \"hello\"",
        mealType: ""
      }
    ]);
  });

  test("requires the fixed exPANDAture CSV headers", () => {
    expect(() => parseExpenseCSV("Date,Amount\n2026-06-19,6.20"))
      .toThrow("CSV is missing: Description, Currency, Category, Meal Type.");
  });

  test("reports unmatched quotes", () => {
    expect(() => parseExpenseCSV("Date,Description,Amount,Currency,Category,Meal Type\n2026-06-19,\"tea,6.20,SGD,food,"))
      .toThrow("CSV has an unmatched quote.");
  });
});

describe("import preparation", () => {
  beforeEach(async () => {
    await openDB();
    await clearStore("expenses");
    await clearStore("categories");
    await seedCategoriesIfEmpty();
  });

  test("prepares valid CSV rows and maps categories by name", async () => {
    const rows = await prepareCSVImport(
      "Date,Description,Amount,Currency,Category,Meal Type\n2026-06-19,Bubble tea,6.20,SGD,food,dessert",
      { food: "food" }
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      valid: true,
      duplicate: false,
      selected: true,
      expense: {
        date: "2026-06-19",
        description: "Bubble tea",
        amount: 620,
        currency: "SGD",
        monthKey: "2026-06",
        categoryId: "food",
        mealType: "dessert"
      }
    });
  });

  test("warns unknown CSV categories and imports them as uncategorised", async () => {
    const rows = await prepareCSVImport(
      "Date,Description,Amount,Currency,Category,Meal Type\n2026-06-19,Tea,6.20,SGD,mystery,",
      {}
    );

    expect(rows[0].valid).toBe(true);
    expect(rows[0].warnings[0]).toContain("Unknown category");
    expect(rows[0].expense.categoryId).toBeNull();
  });

  test("marks invalid rows and keeps them unselected", async () => {
    const rows = await prepareCSVImport(
      "Date,Description,Amount,Currency,Category,Meal Type\nnot-a-date,Tea,-1,ZZZ,food,supper",
      { food: "food" }
    );

    expect(rows[0].valid).toBe(false);
    expect(rows[0].selected).toBe(false);
    expect(rows[0].errors).toEqual([
      "Use YYYY-MM-DD date.",
      "Amount must be greater than zero.",
      "Currency is not supported.",
      "Meal type is not supported."
    ]);
  });

  test("skips likely duplicates by default", async () => {
    const first = await prepareBulkImport([
      {
        date: "2026-06-19",
        description: " Bubble Tea ",
        amount: "6.20",
        currency: "SGD",
        categoryId: "food",
        mealType: "dessert"
      }
    ]);
    await importPreparedExpenses(first);

    const second = await prepareBulkImport([
      {
        date: "2026-06-19",
        description: "bubble tea",
        amount: "6.20",
        currency: "SGD",
        categoryId: "food",
        mealType: "dessert"
      }
    ]);

    expect(second[0].duplicate).toBe(true);
    expect(second[0].selected).toBe(false);
  });

  test("bulk add ignores blank rows and remembers the latest imported date", async () => {
    const rows = await prepareBulkImport([
      { date: "2026-06-01", description: "", amount: "", currency: "SGD", categoryId: "", mealType: "" },
      { date: "2026-06-18", description: "Lunch", amount: "12.30", currency: "SGD", categoryId: "food", mealType: "lunch" },
      { date: "2026-06-20", description: "Dessert", amount: "4.50", currency: "SGD", categoryId: "food", mealType: "dessert" }
    ]);

    expect(rows).toHaveLength(2);
    await importPreparedExpenses(rows);
    expect(getDefaultImportDate()).toBe("2026-06-20");
  });
});

async function clearStore(storeName) {
  await requestToPromise(getStore(storeName, "readwrite").clear());
}
