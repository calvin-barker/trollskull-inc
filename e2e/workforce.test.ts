import { test, expect, type Page } from '@playwright/test';

// Helper: reset DB via settings page (clear all data)
async function clearData(page: Page) {
	await page.goto('/settings');
	// The confirm dialog fires synchronously during use:enhance
	// Use page.on then remove after handling
	const handler = async (d: import('@playwright/test').Dialog) => {
		await d.accept();
		page.off('dialog', handler);
	};
	page.on('dialog', handler);
	await page.locator('button', { hasText: /clear all data/i }).click();
	await page.waitForLoadState('networkidle');
	// Ensure handler is removed even if no dialog fired
	page.off('dialog', handler);
}

test.describe('Staff Roster', () => {
	test.beforeEach(async ({ page }) => {
		await clearData(page);
	});

	test('add a staff member', async ({ page }) => {
		await page.goto('/workforce');

		// Open the hire form
		await page.locator('summary', { hasText: /hire staff/i }).click();

		// Fill and submit
		await page.locator('input[name="name"]').last().fill('Test Worker');
		await page.locator('input[name="role"]').last().fill('Porter');
		await page.locator('input[name="daily_wage"]').last().fill('3');
		await page.locator('button', { hasText: /^hire$/i }).click();
		await page.waitForLoadState('networkidle');

		// Verify appears in table
		await expect(page.locator('td', { hasText: 'Test Worker' })).toBeVisible();
		await expect(page.locator('td', { hasText: 'Porter' })).toBeVisible();
		await expect(page.locator('td', { hasText: '3 gp' })).toBeVisible();
	});

	test('edit a staff member', async ({ page }) => {
		await page.goto('/workforce');

		// Add staff first
		await page.locator('summary', { hasText: /hire staff/i }).click();
		await page.locator('input[name="name"]').last().fill('Edit Me');
		await page.locator('input[name="role"]').last().fill('Cook');
		await page.locator('input[name="daily_wage"]').last().fill('2');
		await page.locator('button', { hasText: /^hire$/i }).click();
		await page.waitForLoadState('networkidle');

		// Click edit
		await page.locator('button[title="Edit"]').click();

		// Change name
		const nameInput = page.locator('input[name="name"]').first();
		await nameInput.fill('Edited Name');
		await page.locator('button', { hasText: /^save$/i }).click();
		await page.waitForLoadState('networkidle');

		// Verify
		await expect(page.locator('td', { hasText: 'Edited Name' })).toBeVisible();
		await expect(page.locator('td', { hasText: 'Edit Me' })).not.toBeVisible();
	});

	test('dismiss a staff member', async ({ page }) => {
		await page.goto('/workforce');

		// Add staff
		await page.locator('summary', { hasText: /hire staff/i }).click();
		await page.locator('input[name="name"]').last().fill('Dismissable');
		await page.locator('input[name="role"]').last().fill('Guard');
		await page.locator('input[name="daily_wage"]').last().fill('4');
		await page.locator('button', { hasText: /^hire$/i }).click();
		await page.waitForLoadState('networkidle');

		// Dismiss (accept confirm dialog)
		const handler = async (d: import('@playwright/test').Dialog) => {
			await d.accept();
			page.off('dialog', handler);
		};
		page.on('dialog', handler);
		await page.locator('button[title="Dismiss"]').click();
		await page.waitForLoadState('networkidle');
		page.off('dialog', handler);

		// Status should change to dismissed
		await expect(page.locator('span', { hasText: 'dismissed' })).toBeVisible();
	});

	test('pay a staff member creates transaction', async ({ page }) => {
		await page.goto('/workforce');

		// Add staff
		await page.locator('summary', { hasText: /hire staff/i }).click();
		await page.locator('input[name="name"]').last().fill('Payable Worker');
		await page.locator('input[name="role"]').last().fill('Barkeep');
		await page.locator('input[name="daily_wage"]').last().fill('5');
		await page.locator('button', { hasText: /^hire$/i }).click();
		await page.waitForLoadState('networkidle');

		// Click Pay button to open inline form
		await page.locator('button', { hasText: /^pay$/i }).click();

		// Set days to 10 and submit
		const daysInput = page.locator('input[name="days"]');
		await daysInput.fill('10');
		await page.locator('form[action="?/payStaff"] button[type="submit"]').click();
		await page.waitForLoadState('networkidle');

		// Check ledger for the wage transaction
		await page.goto('/ledger');
		await expect(page.locator('td', { hasText: /Wages: Payable Worker/ })).toBeVisible();
	});
});

test.describe('Faction Job Board', () => {
	test.beforeEach(async ({ page }) => {
		await clearData(page);
	});

	test('add a faction posting', async ({ page }) => {
		await page.goto('/workforce');

		// Open add form
		await page.locator('summary', { hasText: /new posting/i }).click();

		// Fill and submit
		await page.locator('input[name="faction"]').last().fill('Harpers');
		await page.locator('input[name="title"]').last().fill('Test Mission');
		await page.locator('input[name="reward"]').last().fill('100');
		await page.locator('button', { hasText: /^post$/i }).click();
		await page.waitForLoadState('networkidle');

		// Verify appears in table
		await expect(page.locator('td', { hasText: 'Harpers' })).toBeVisible();
		await expect(page.locator('td', { hasText: 'Test Mission' })).toBeVisible();
		await expect(page.locator('span', { hasText: 'open' })).toBeVisible();
	});

	test('accept and complete a posting', async ({ page }) => {
		await page.goto('/workforce');

		// Add posting
		await page.locator('summary', { hasText: /new posting/i }).click();
		await page.locator('input[name="faction"]').last().fill('Zhentarim');
		await page.locator('input[name="title"]').last().fill('Deliver Package');
		await page.locator('input[name="reward"]').last().fill('200');
		await page.locator('button', { hasText: /^post$/i }).click();
		await page.waitForLoadState('networkidle');

		// Accept
		await page.locator('button', { hasText: /^accept$/i }).click();
		await page.waitForLoadState('networkidle');
		await expect(page.locator('span', { hasText: 'accepted' })).toBeVisible();

		// Complete
		await page.locator('button', { hasText: /^complete$/i }).click();
		await page.waitForLoadState('networkidle');
		await expect(page.locator('span', { hasText: 'completed' })).toBeVisible();

		// Verify reward transaction in ledger
		await page.goto('/ledger');
		await expect(page.locator('td', { hasText: /Contract: Deliver Package/ })).toBeVisible();
	});

	test('edit a faction posting', async ({ page }) => {
		await page.goto('/workforce');

		// Add posting
		await page.locator('summary', { hasText: /new posting/i }).click();
		await page.locator('input[name="faction"]').last().fill('Emerald Enclave');
		await page.locator('input[name="title"]').last().fill('Original Title');
		await page.locator('input[name="reward"]').last().fill('50');
		await page.locator('button', { hasText: /^post$/i }).click();
		await page.waitForLoadState('networkidle');

		// Edit
		await page.locator('button[title="Edit"]').click();
		const titleInput = page.locator('input[name="title"]').first();
		await titleInput.fill('Updated Title');
		await page.locator('button', { hasText: /^save$/i }).click();
		await page.waitForLoadState('networkidle');

		// Verify
		await expect(page.locator('td', { hasText: 'Updated Title' })).toBeVisible();
		await expect(page.locator('td', { hasText: 'Original Title' })).not.toBeVisible();
	});
});
