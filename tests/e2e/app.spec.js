import { expect, test } from "@playwright/test";

const TEST_MONTH = getCurrentMonthKey();
const TEST_DAY_18 = `${TEST_MONTH}-18`;
const TEST_DAY_19 = `${TEST_MONTH}-19`;
const NEXT_MONTH = getRelativeMonthKey(1);

test.beforeEach(async ({ page, baseURL }) => {
  expect(baseURL).toBe("http://127.0.0.1:4173");
  await clearAppStorage(page);
  await page.reload();
});

test("loads the app without console errors", async ({ page }) => {
  const consoleMessages = [];
  page.on("console", message => {
    if (["error", "warning"].includes(message.type())) {
      consoleMessages.push(message.text());
    }
  });

  await expect(page).toHaveTitle("exPANDAture");
  await expect(page.getByRole("heading", { name: "exPANDAture" })).toBeVisible();
  await expect(page.getByRole("button", { name: /log a new expense/i })).toBeVisible();
  expect(consoleMessages.filter(message => !message.includes("Failed to load resource"))).toEqual([]);
});

test("validates amount inline when adding an expense", async ({ page }) => {
  await page.getByRole("button", { name: /log a new expense/i }).click();
  await page.locator("#amount").fill("0");
  await page.locator("#submitBtn").click();

  await expect(page.locator("#amount-error")).toHaveText("Enter an amount greater than zero.");
  await expect(page.locator("#amount")).toHaveAttribute("aria-invalid", "true");
});

test("adds an expense and updates Home and Trail totals", async ({ page }) => {
  await addExpenseThroughForm(page, {
    date: TEST_DAY_19,
    amount: "6.20",
    description: "bubble tea"
  });

  await expect(page.locator("#monthlyTotal")).toHaveText("6.20");
  await page.locator("#historyBtn").click();
  await expect(page.locator("#trail-month-total")).toHaveText("$6.20 spent");
  await expect(page.locator(".expense-item .meta")).toContainText("bubble tea");
});

test("remembers the last expense date after saving", async ({ page }) => {
  await addExpenseThroughForm(page, {
    date: TEST_DAY_18,
    amount: "3.50",
    description: "snack"
  });

  await expect(page.locator("#date")).toHaveValue(TEST_DAY_18);
});

test("opens edit form from the expense row and supports delete undo", async ({ page }) => {
  await addExpenseThroughForm(page, {
    date: TEST_DAY_19,
    amount: "6.20",
    description: "bubble tea"
  });

  await page.locator("#historyBtn").click();
  await page.locator(".day-header").click();
  await page.getByRole("button", { name: /edit bubble tea/i }).click();
  await expect(page.locator("#form-title")).toHaveText("Edit Expense");
  await expect(page.locator("#description")).toHaveValue("bubble tea");
  await page.locator("#closeBtn").click();

  await page.locator("#historyBtn").click();
  await page.locator(".day-header").click();
  await page.getByRole("button", { name: /delete expense/i }).click();
  await expect(page.getByText("Expense deleted.")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("Expense restored.")).toBeVisible();
  await page.locator(".day-header").click();
  await expect(page.locator(".expense-item .meta")).toContainText("bubble tea");
});

test("shows an empty pie chart state when there is no analytics data", async ({ page }) => {
  await page.locator("#historyBtn").click();
  await page.getByRole("button", { name: "Panda patterns" }).click();

  await expect(page.locator("#category-chart-empty")).toContainText("No spending to chart");
});

test("exports current month and selected month range CSV files", async ({ page }) => {
  await addExpenseThroughForm(page, {
    date: TEST_DAY_19,
    amount: "6.20",
    description: "bubble tea"
  });

  await page.locator("#historyBtn").click();
  await page.locator("#export-btn").click();
  const currentMonthDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  expect((await currentMonthDownload).suggestedFilename()).toBe(`expenses-${TEST_MONTH}.csv`);

  await page.locator("#export-btn").click();
  await page.locator("#export-btn").click();
  await page.getByLabel("Selected month range").check();
  await page.locator("#export-start-month").fill(TEST_MONTH);
  await page.locator("#export-end-month").fill(NEXT_MONTH);
  const rangeDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  expect((await rangeDownload).suggestedFilename()).toBe(`expenses-${TEST_MONTH}-to-${NEXT_MONTH}.csv`);
});

test("bulk add starts with one row, can add/remove rows, and saves valid rows", async ({ page }) => {
  await page.locator("#historyBtn").click();
  await page.locator("#catch-up-btn").click();

  await expect(page.locator(".bulk-row")).toHaveCount(1);
  await expect(page.locator(".bulk-remove-row")).toBeHidden();

  await page.locator("#bulk-add-row").click();
  await expect(page.locator(".bulk-row")).toHaveCount(2);
  await page.locator(".bulk-remove-row").last().click();
  await expect(page.locator(".bulk-row")).toHaveCount(1);

  const row = page.locator(".bulk-row").first();
  await row.locator('[name="date"]').fill(TEST_DAY_19);
  await row.locator('[name="description"]').fill("bulk tea");
  await row.locator('[name="amount"]').fill("7.10");
  await row.locator('[name="categoryId"]').selectOption({ label: "food" });
  await page.getByRole("button", { name: "Save valid rows" }).click();

  await expect(page.getByText("Bulk expenses saved. 1 expenses added.")).toBeVisible();
});

test("CSV import previews valid, invalid, and duplicate rows before saving", async ({ page }) => {
  await addExpenseThroughForm(page, {
    date: TEST_DAY_19,
    amount: "6.20",
    description: "bubble tea"
  });

  await page.locator("#historyBtn").click();
  await page.locator("#catch-up-btn").click();
  await page.locator("#csv-import-file").setInputFiles({
    name: "expenses.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([
      "Date,Description,Amount,Currency,Category,Meal Type",
      `${TEST_DAY_19},bubble tea,6.20,SGD,bubble tea,`,
      `${getDateInCurrentMonth(20)},valid tea,3.00,SGD,food,dessert`,
      "not-a-date,bad tea,-1,ZZZ,food,supper"
    ].join("\n"))
  });

  await expect(page.locator(".import-summary")).toContainText("1 ready");
  await expect(page.locator(".import-summary")).toContainText("1 duplicates skipped");
  await expect(page.locator(".import-summary")).toContainText("1 need fixes");
});

test("backup download and restore merge work with isolated test data", async ({ page }) => {
  await addExpenseThroughForm(page, {
    date: TEST_DAY_19,
    amount: "6.20",
    description: "backup tea"
  });

  await page.locator("#settingsBtn").click();
  const backupDownload = page.waitForEvent("download");
  await page.locator("#backup-export-btn").click();
  const backup = await backupDownload;
  expect(backup.suggestedFilename()).toMatch(/^expandature-backup-/);

  await clearAppStorage(page);
  await page.reload();
  await expect(page.locator("#monthlyTotal")).toHaveText("0.00");

  await page.locator("#settingsBtn").click();
  await page.locator("#restore-file").setInputFiles(await backup.path());
  await expect(page.locator("#restore-preview")).toContainText("1 expenses");
  await page.getByRole("button", { name: "Restore backup" }).click();
  await expect(page.getByText("Backup merged.")).toBeVisible();
  await expect(page.locator("#monthlyTotal")).toHaveText("6.20");
});

async function addExpenseThroughForm(page, { date, amount, description }) {
  await page.getByRole("button", { name: /log a new expense/i }).click();
  await page.locator("#date").fill(date);
  await page.locator("#amount").fill(amount);
  await page.locator("#description").fill(description);
  await page.locator("#submitBtn").click();
  await expect(page.getByText("Expense saved.")).toBeVisible();
}

async function clearAppStorage(page) {
  await page.goto("/");
  await page.evaluate(async () => {
    if (location.origin !== "http://127.0.0.1:4173") {
      throw new Error(`Refusing to clear storage for unsafe origin: ${location.origin}`);
    }

    localStorage.clear();

    const databases = indexedDB.databases ? await indexedDB.databases() : [{ name: "expense_tracker" }];
    await Promise.all(databases
      .map(database => database.name)
      .filter(Boolean)
      .map(name => new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => resolve();
      })));
  });
}

function getCurrentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function getRelativeMonthKey(offset) {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDateInCurrentMonth(day) {
  return `${TEST_MONTH}-${String(day).padStart(2, "0")}`;
}
