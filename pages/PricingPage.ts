import { expect, Page } from '@playwright/test';
import { CONSTANTS } from '../config/constants';
import * as fs from "node:fs";
import path from "node:path";

const pdfjsLib = require('pdfjs-dist');
pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.js');



export class PricingPage {
    readonly page: Page;
    readonly addressInput;
    readonly suggestionList;
    readonly plansList;
    readonly electricityCheckbox;
    readonly planLinks;

    constructor(page: Page) {
        this.page = page;
        this.addressInput = page.locator('[data-id="connectionAddressInput-autocomplete-textfield-input"]');
        this.suggestionList = page.locator('ul[role="listbox"]');
        this.plansList = page.locator('table[data-id="table"]:has(td a[data-id^="energy-fact-sheet-Origin"])');
        this.electricityCheckbox = page.locator('span[data-id="elc-checkbox-checkbox-base"]');
        this.planLinks = page.locator('table[data-id="table"] td a[data-id^="energy-fact-sheet-Origin"]');
    }

    async navigate() {
        const context = this.page.context();
        await context.clearCookies();
        await context.clearPermissions();

        await this.page.setExtraHTTPHeaders({
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        });

        await this.page.goto(CONSTANTS.BASE_URL);

        await expect(this.addressInput.first()).toBeVisible({
            timeout: CONSTANTS.TIMEOUTS.long,
        });
    }

    async searchAddress(address: string) {
        await this.addressInput.fill('');
        await this.addressInput.type(address, { delay: CONSTANTS.DEFAULT_TYPE_DELAY });

        const firstSuggestion = this.suggestionList.first();
        await expect(firstSuggestion).toBeVisible({ timeout: CONSTANTS.TIMEOUTS.long });

        await firstSuggestion.click();
    }


    async uncheckElectricityIfChecked() {
        const checkbox = this.electricityCheckbox.first();

        if (await checkbox.count() === 0) {
            return;
        }

        const input = checkbox.locator('input[type="checkbox"]');
        if (await input.isChecked()) {
            await checkbox.click();
            await expect(input).not.toBeChecked();
        }
    }

    async clickRandomPlanLinkAndVerifyNewTab() {
        const count = await this.planLinks.count();

        if (count === 0) {
            throw new Error('No plan links found in the table');
        }

        const randomIndex = Math.floor(Math.random() * count);
        const link = this.planLinks.nth(randomIndex);

        await expect(link).toBeVisible({ timeout: CONSTANTS.TIMEOUTS.long });

        const target = await link.getAttribute('target');
        if (target !== '_blank') {
            throw new Error('Plan link does not open in a new tab');
        }

        const [newPage] = await Promise.all([
            this.page.context().waitForEvent('page', { timeout: CONSTANTS.TIMEOUTS.long }),
            link.click()
        ]);

        await newPage.waitForLoadState('domcontentloaded', { timeout: CONSTANTS.TIMEOUTS.long });

        return newPage;
    }

    async verifyPlansDisplayed() {
        await expect(this.plansList).toBeVisible({ timeout: CONSTANTS.TIMEOUTS.long });
        const links = await this.plansList.locator('a').count();
        expect(links).toBeGreaterThan(0);
    }

    async verifyPlanDetailsPdfPageOpened(page: Page) {
        await expect(page).toHaveURL(/\.pdf$/i);
    }

    async downloadPlanPdf(page: Page): Promise<string> {
        const pdfUrl = page.url();
        console.log(`📥 Trying to download PDF from: ${pdfUrl}`);

        const commonHeaders: Record<string, string> = {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'application/pdf,application/octet-stream',
        };

        // 1️⃣ Direct GET
        try {
            const response = await page.request.get(pdfUrl, {
                timeout: CONSTANTS.TIMEOUTS.long,
                headers: commonHeaders,
            });
            if (response.ok()) {
                const buffer = await response.body();
                console.log(`✅ Direct GET succeeded (${buffer.length} bytes)`);
                return await this.extractTextFromPdfBuffer(buffer);
            }
            console.warn(`Basic GET failed: ${response.status()}`);
        } catch (err) {
            console.warn('Basic GET threw error:', err);
        }

        // 2️⃣ Retry with Referer and cookies
        try {
            const cookies = await page.context().cookies();
            const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            const headers: Record<string, string> = {
                ...commonHeaders,
                Referer: CONSTANTS.BASE_URL,
            };
            if (cookieHeader) headers['Cookie'] = cookieHeader;

            const response = await page.request.get(pdfUrl, {
                timeout: CONSTANTS.TIMEOUTS.long,
                headers,
            });
            if (response.ok()) {
                const buffer = await response.body();
                console.log(`✅ Header-based GET succeeded (${buffer.length} bytes)`);
                return await this.extractTextFromPdfBuffer(buffer);
            }
            console.warn(`Header GET failed: ${response.status()}`);
        } catch (err) {
            console.warn('Header GET threw error:', err);
        }

        // 3️⃣ Fallback — in-page fetch
        try {
            console.log('🔁 Trying in-page fetch fallback...');
            const result = await page.evaluate(
                async ({ url, headers }: { url: string; headers: Record<string, string> }) => {
                    try {
                        const res = await fetch(url, {
                            method: 'GET',
                            credentials: 'include',
                            headers,
                        });
                        if (!res.ok) return { ok: false, status: res.status };
                        const ab = await res.arrayBuffer();
                        const bytes = Array.from(new Uint8Array(ab));
                        return { ok: true, status: res.status, bytes };
                    } catch {
                        return { ok: false, status: 0 };
                    }
                },
                { url: pdfUrl, headers: commonHeaders }
            );

            if (result.ok && Array.isArray(result.bytes)) {
                const buffer = Buffer.from(result.bytes);
                console.log(`✅ Fallback fetch succeeded (${buffer.length} bytes)`);
                return await this.extractTextFromPdfBuffer(buffer);
            }
            console.warn(`In-page fetch failed: status=${result.status}`);
        } catch (err) {
            console.error('In-page fetch fallback threw:', err);
        }

        console.warn(`⚠️ All PDF fetch attempts failed (${pdfUrl}). Skipping verification.`);
        return '';
    }


    private async extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
        try {
            const filePath = path.resolve('downloads', `plan-${Date.now()}.pdf`);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, buffer);
            console.log(`📂 Saved PDF locally: ${filePath}`);
        } catch (err) {
            console.warn('Failed to save local PDF copy:', err);
        }

        const uint8Array = new Uint8Array(buffer);
        const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const pageData = await pdf.getPage(i);
            const content = await pageData.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(' ');
            text += pageText + '\n';
        }

        console.log(`📖 Extracted ${text.length} characters of text from PDF`);
        return text;
    }



    verifyPdfContainsGasPlan(pdfText: string) {
        const gasPlanText = 'estimated gas cost';
        const textLower = pdfText.toLowerCase();
        expect(textLower).toContain(gasPlanText);
    }
}
