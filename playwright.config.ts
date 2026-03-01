import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	timeout: 15000,
	retries: 0,
	workers: 1,
	use: {
		baseURL: 'http://localhost:5173',
	},
	webServer: {
		command: 'npm run dev',
		port: 5173,
		reuseExistingServer: true,
	},
	projects: [
		{ name: 'chromium', use: { browserName: 'chromium' } },
	],
});
