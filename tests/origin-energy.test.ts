import {test} from '@playwright/test';
import {PricingPage} from '../pages/PricingPage';



test('Origin Energy pricing page flow', async ({ page }) => {

    const pricingPage = new PricingPage(page);

    await test.step('Navigate to Origin Energy pricing page', async () => {
        await pricingPage.navigate();
    });

    await test.step('Search and select address', async () => {
        await pricingPage.searchAddress('17 Bolinda Road, Balwyn North, VIC 3104');
    });

    await test.step('Verify plans list is displayed', async () => {
        await pricingPage.verifyPlansDisplayed();
    });

    await test.step('Uncheck electricity checkbox and verify plans still displayed', async () => {
        await pricingPage.uncheckElectricityIfChecked();
        await pricingPage.verifyPlansDisplayed();
    });

    await test.step('Open random plan, download and verify PDF', async () => {
        const newPage = await pricingPage.clickRandomPlanLinkAndVerifyNewTab();
        await pricingPage.verifyPlanDetailsPdfPageOpened(newPage);
        const pdfText = await pricingPage.downloadPlanPdf(newPage);
        pricingPage.verifyPdfContainsGasPlan(pdfText);
    });
});
