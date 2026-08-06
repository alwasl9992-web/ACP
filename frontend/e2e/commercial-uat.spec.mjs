import { test, expect } from "@playwright/test";

const adminEmail = process.env.STAGING_ADMIN_EMAIL;
const adminPassword = process.env.STAGING_ADMIN_PASSWORD;

function assertCredentials() {
  if (!adminEmail || !adminPassword) throw new Error("STAGING_ADMIN_EMAIL and STAGING_ADMIN_PASSWORD are required");
}

async function clickNavigation(page, label) {
  const mobileMenu = page.getByRole("button", { name: "فتح القائمة" });
  const mobile = await mobileMenu.isVisible();
  if (mobile) await mobileMenu.click();
  const item = page.locator(".MuiListItemButton-root:visible").filter({ hasText: label }).first();
  await expect(item, `Navigation item ${label}`).toBeVisible();
  await item.click();
  if (mobile) await expect(page.locator(".MuiDrawer-modal")).toBeHidden();
}

async function assertNoHorizontalOverflow(page) {
  await expect.poll(
    () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2),
    { message: "The application shell must not overflow horizontally" },
  ).toBe(true);
}

async function assertHealthyScreen(page, heading) {
  await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await assertNoHorizontalOverflow(page);
  await expect(page.locator("body")).not.toContainText(/قريبًا|وصف مؤقت|غير متوفر(?:ة)?/u);
}

function collectRuntimeFailures(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  page.on("response", (response) => {
    const url = response.url();
    if (response.status() >= 400 && (url.includes("supabase.co/") || url.includes("127.0.0.1:4173"))) {
      failures.push(`HTTP ${response.status()}: ${url}`);
    }
  });
  return failures;
}

async function login(page) {
  assertCredentials();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "تسجيل الدخول" })).toBeVisible();
  await page.getByLabel("البريد الإلكتروني").fill(adminEmail);
  await page.getByLabel("كلمة المرور").fill(adminPassword);
  await page.getByRole("button", { name: "دخول آمن" }).click();
  await expect(page.getByRole("heading", { name: "لوحة التحكم التنفيذية" })).toBeVisible();
}

async function selectFirstProject(page) {
  await clickNavigation(page, "المشاريع");
  await assertHealthyScreen(page, "المشاريع");
  const openProject = page.getByRole("button", { name: "فتح", exact: true }).first();
  await expect(openProject, "At least one project must be available for UAT").toBeVisible();
  await openProject.click();
  await assertHealthyScreen(page, "سجل الأصول");
}

async function verifyAssetProfile(page) {
  await clickNavigation(page, "الأصول");
  await assertHealthyScreen(page, "سجل الأصول");

  const mobileOpen = page.getByRole("button", { name: "فتح الأصل", exact: true }).first();
  const desktopOpen = page.getByRole("button", { name: "فتح", exact: true }).first();
  const openAsset = await mobileOpen.isVisible() ? mobileOpen : desktopOpen;
  await expect(openAsset, "At least one asset must expose a visible open action").toBeVisible();
  await openAsset.click();

  await expect(page.getByRole("heading", { name: "هوية QR للأصل" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "أوامر العمل" })).toBeVisible();
  const qr = page.locator('img[alt^="QR للأصل"]').first();
  await expect(qr).toBeVisible();
  await expect.poll(() => qr.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "طباعة البطاقة" })).toBeEnabled();
  await assertNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "العودة إلى سجل الأصول" }).click();
  await assertHealthyScreen(page, "سجل الأصول");
}

function visibleReportItems(page) {
  return page.locator('[data-report-id]:visible, .MuiDataGrid-row:visible');
}

async function reportIdentifier(item) {
  return item.evaluate((element) => element.getAttribute("data-report-id") || element.getAttribute("data-id"));
}

function reportItemById(page, reportId) {
  return page.locator(`[data-report-id="${reportId}"]:visible, .MuiDataGrid-row[data-id="${reportId}"]:visible`);
}

async function deleteReportItem(page, reportId) {
  const item = reportItemById(page, reportId);
  if (await item.count()) {
    page.once("dialog", (dialog) => void dialog.accept());
    await item.getByRole("button", { name: "حذف", exact: true }).click();
    await expect(item).toHaveCount(0);
  }
}

async function verifyPdfAndCleanup(page) {
  await clickNavigation(page, "التقارير");
  await assertHealthyScreen(page, "مركز التقارير");

  const items = visibleReportItems(page);
  const firstBefore = await items.count() ? await reportIdentifier(items.first()) : null;
  let createdId = null;

  try {
    await page.getByRole("button", { name: "إنشاء تقرير يومي" }).click();
    await expect.poll(async () => {
      const first = visibleReportItems(page).first();
      return await first.count() ? await reportIdentifier(first) : null;
    }, { message: "A generated report must become the newest visible report" }).not.toBe(firstBefore);

    createdId = await reportIdentifier(visibleReportItems(page).first());
    expect(createdId).toBeTruthy();
    const createdItem = reportItemById(page, createdId);
    await expect(createdItem).toContainText("تقرير التشغيل اليومي");
    await expect(createdItem.getByRole("button", { name: "PDF", exact: true })).toBeVisible();

    const popupPromise = page.waitForEvent("popup");
    await createdItem.getByRole("button", { name: "PDF", exact: true }).click();
    const popup = await popupPromise;
    await expect(popup.getByText("ACP ENTERPRISE").first()).toBeVisible();
    await expect(popup.getByRole("button", { name: "طباعة / حفظ PDF" })).toBeVisible();
    await expect(popup.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(popup.locator('img[alt="رمز التحقق"]')).toBeVisible();
    await popup.close();
  } finally {
    if (createdId) await deleteReportItem(page, createdId);
  }
}

test("commercial authenticated workflow is healthy across all primary screens", async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  await login(page);
  await assertHealthyScreen(page, "لوحة التحكم التنفيذية");
  await selectFirstProject(page);

  const screens = [
    ["المواقع", "إدارة المواقع"],
    ["البوابات", "إدارة البوابات"],
    ["الموظفون", "إدارة الموظفين"],
    ["المستودعات", "إدارة المستودعات"],
    ["البلاغات", "إدارة البلاغات"],
  ];

  for (const [navigation, heading] of screens) {
    await clickNavigation(page, navigation);
    await assertHealthyScreen(page, heading);
  }

  await verifyAssetProfile(page);
  await verifyPdfAndCleanup(page);
  await clickNavigation(page, "الإعدادات");
  await assertHealthyScreen(page, "إعدادات النظام");

  expect(failures, failures.join("\n")).toEqual([]);
});
