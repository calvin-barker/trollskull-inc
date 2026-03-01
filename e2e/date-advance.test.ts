import { test, expect, type Page } from '@playwright/test';

async function clearData(page: Page) {
	await page.goto('/settings');
	const handler = async (d: import('@playwright/test').Dialog) => {
		await d.accept();
		page.off('dialog', handler);
	};
	page.on('dialog', handler);
	await page.locator('button', { hasText: /clear all data/i }).click();
	await page.waitForLoadState('networkidle');
	page.off('dialog', handler);
}

async function addStaff(page: Page, name: string, role: string, wage: number) {
	await page.goto('/workforce');
	await page.locator('summary', { hasText: /hire staff/i }).click();
	await page.locator('input[name="name"]').last().fill(name);
	await page.locator('input[name="role"]').last().fill(role);
	await page.locator('input[name="daily_wage"]').last().fill(String(wage));
	await page.locator('button', { hasText: /^hire$/i }).click();
	await page.waitForLoadState('networkidle');
}

test.describe('Date advance auto-transactions', () => {
	test.beforeEach(async ({ page }) => {
		await clearData(page);
	});

	test('advancing date creates wage and revenue transactions', async ({ page }) => {
		// Add staff with known wage
		await addStaff(page, 'Test Barkeep', 'Barkeep', 5);

		// Go to dashboard and click a future day
		await page.goto('/');

		// Current date after clear is Eleasis 19 (day 19 in the calendar grid)
		// Click day 22 (3 days ahead)
		const dayButtons = page.locator('.grid button');
		// Day 22 is the 22nd button (0-indexed: 21)
		await dayButtons.nth(21).click();
		await page.waitForLoadState('networkidle');

		// Check ledger for auto-generated transactions
		await page.goto('/ledger');

		// Wages transaction: 5 gp/day × 3 days = -15 gp
		const wagesRow = page.locator('td', { hasText: /Staff wages \(3 days\)/ });
		await expect(wagesRow).toBeVisible();

		// Tavern revenue transaction should exist
		const revenueRow = page.locator('td', { hasText: /Tavern revenue \(3 days\)/ });
		await expect(revenueRow).toBeVisible();
	});

	test('going backward in time creates no transactions', async ({ page }) => {
		await page.goto('/');

		// Click day 15 (4 days behind current date of 19)
		const dayButtons = page.locator('.grid button');
		await dayButtons.nth(14).click();
		await page.waitForLoadState('networkidle');

		// Ledger should have no auto-generated transactions
		await page.goto('/ledger');
		await expect(page.locator('td', { hasText: /Staff wages/ })).not.toBeVisible();
		await expect(page.locator('td', { hasText: /Tavern revenue/ })).not.toBeVisible();
	});

	test('no wages posted when no active staff', async ({ page }) => {
		// Don't add any staff, just advance date
		await page.goto('/');

		const dayButtons = page.locator('.grid button');
		await dayButtons.nth(20).click(); // day 21, 2 days ahead
		await page.waitForLoadState('networkidle');

		await page.goto('/ledger');
		// Should have tavern revenue but NOT wages
		await expect(page.locator('td', { hasText: /Tavern revenue/ })).toBeVisible();
		await expect(page.locator('td', { hasText: /Staff wages/ })).not.toBeVisible();
	});

	test('revenue range is configurable via settings', async ({ page }) => {
		// Set revenue range to exactly 10-10 (deterministic)
		await page.goto('/settings');
		await page.locator('input[name="min"]').fill('10');
		await page.locator('input[name="max"]').fill('10');
		await page.locator('button', { hasText: /^save$/i }).click();
		await page.waitForLoadState('networkidle');

		// Advance 1 day
		await page.goto('/');
		const dayButtons = page.locator('.grid button');
		await dayButtons.nth(19).click(); // day 20, 1 day ahead
		await page.waitForLoadState('networkidle');

		// Check ledger — revenue should be exactly 10 gp
		await page.goto('/ledger');
		// With min=max=10, 1 day should produce exactly 10 gp
		await expect(page.locator('td', { hasText: /Tavern revenue \(1 day\)/ })).toBeVisible();
		// Verify the amount is 10 gp (in the same row)
		const revenueRow = page.locator('tr', { hasText: /Tavern revenue/ });
		await expect(revenueRow).toContainText('10 gp');
	});
});
