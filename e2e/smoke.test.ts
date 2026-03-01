import { test, expect } from '@playwright/test';

const routes = [
	{ path: '/', heading: 'Dashboard' },
	{ path: '/ledger', heading: 'Ledger' },
	{ path: '/reports', heading: 'Reports' },
	{ path: '/equity', heading: 'Equity' },
	{ path: '/loans', heading: 'Loans' },
	{ path: '/balances', heading: 'Balances' },
	{ path: '/hospitality', heading: 'Hospitality' },
	{ path: '/workforce', heading: 'Workforce' },
	{ path: '/settings', heading: 'Settings' },
];

for (const route of routes) {
	test(`${route.path} loads without error`, async ({ page }) => {
		const response = await page.goto(route.path);
		expect(response?.status()).toBe(200);
		await expect(page.locator('h2, h1').first()).toBeVisible();
	});
}

test('sidebar navigation links all present', async ({ page }) => {
	await page.goto('/');
	const nav = page.locator('nav');
	for (const route of routes) {
		await expect(nav.locator(`a[href="${route.path}"]`)).toBeVisible();
	}
});
