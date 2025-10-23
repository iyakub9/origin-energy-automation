import { defineConfig } from '@playwright/test';

export default defineConfig({
    timeout: 60_000,
    expect: { timeout: 10_000 },
    retries: 1,
    workers: process.env.CI ? 2 : 4,
    use: {
        headless: true,
        actionTimeout: 15_000,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
        storageState: undefined,
    },
    reporter: [['list'], ['html', { open: 'on-failure' }]],
});