const { chromium } = require('playwright');

async function createBrowser() {
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--incognito',
        ]
    });

    const context = await browser.newContext({
        viewport: {
            width: 957,
            height: 968,
        },
        userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        locale: 'es-MX',
    });

    const page = await context.newPage();

    return {
        context,
        browser,
        page,
    };
}

async function randomDelay(page) {

    const delay =
        Math.floor(Math.random() * 4000) + 3000;

    await page.waitForTimeout(delay);
}

async function humanBehavior(page) {

    await page.mouse.move(
        Math.random() * 500,
        Math.random() * 500
    );

    await page.waitForTimeout(1000);

    await page.mouse.wheel(
        0,
        Math.random() * 1000
    );

    await page.waitForTimeout(1500);
}

async function captchaDelay() {

    const delay =
        Math.floor(Math.random() * 30000)
        + 90000; // entre 1:30 y 2:00 min

    console.log(
        `Primera búsqueda: esperando ${Math.round(delay / 1000)}s por si aparece el captcha...`
    );

    return delay;
}

async function searchKeyword(
    page,
    keyword,
    targetUrl,
    isFirstSearch = false
) {

    console.log(`Buscando: ${keyword}`);

    await page.goto(
        'https://www.google.com',
        {
            waitUntil: 'domcontentloaded',
        }
    );

    await randomDelay(page);

    const searchInput =
        page.locator('textarea[name="q"]');

    await searchInput.fill(keyword);

    await randomDelay(page);

    await page.keyboard.press('Enter');

    await page.waitForLoadState(
        'domcontentloaded'
    );

    if (isFirstSearch) {
        await page.waitForTimeout(
            await captchaDelay()
        );
    }

    await humanBehavior(page);

    let currentPage = 1;

    while (currentPage <= 10) {

        console.log(
            `Revisando página ${currentPage}`
        );

        await randomDelay(page);

        const links = await page
            .locator('div.yuRUbf a')
            .evaluateAll(elements =>
                elements.map(el => el.href)
            );

        const position =
            links.findIndex(link =>
                link.includes(targetUrl)
            );

        if (position !== -1) {

            const realPosition =
                ((currentPage - 1) * 10)
                + position
                + 1;

            return {
                keyword,
                found: true,
                position: realPosition,
                page: currentPage,
            };
        }

        const nextButton =
            page.locator('#pnnext');

        const hasNext =
            await nextButton.count();

        if (!hasNext) {
            break;
        }

        await humanBehavior(page);

        await nextButton.click();

        await page.waitForLoadState(
            'domcontentloaded'
        );

        currentPage++;
    }

    return {
        keyword,
        found: false,
        position: null,
        page: null,
    };
}

module.exports = {
    createBrowser,
    searchKeyword,
};