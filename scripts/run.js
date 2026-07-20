const {
    getQueries
} = require('../app/gsc/searchConsole');

const {
    createBrowser,
    searchKeyword,
} = require('../app/scraper/googleScraper');

const {
    saveRanking
} = require('../app/ranking/saveRanking');

const {
    buildReport
} = require('./buildReport');

async function run() {

    const targetUrl =
        'hospitalhdr.com';

    const queries =
        await getQueries(
            'https://hospitalhdr.com/'
        );

    const {
        context,
        browser,
        page,
    } = await createBrowser();

    const results = [];

    for (let i = 0; i < queries.length; i++) {
        const row = queries[i];
        const keyword = row.keys[0];
        const isFirstSearch = i === 0;

        try {
            const ranking =
                await searchKeyword(
                    page,
                    keyword,
                    targetUrl,
                    isFirstSearch
                );

            results.push({

                keyword,

                clicks:
                    row.clicks,

                impressions:
                    row.impressions,

                ctr:
                    row.ctr,

                gscAveragePosition:
                    row.position,

                serpPosition:
                    ranking.position,

                found:
                    ranking.found,
            });

            console.log(ranking);

            const delay =
                Math.floor(Math.random() * 10000)
                + 5000;

            console.log(
                `Esperando ${delay / 1000}s`
            );

            await page.waitForTimeout(delay);

        } catch (error) {

            console.error(error);

            results.push({
                keyword,
                error: true,
            });
        }
    }

    console.dir(results, {
        depth: null,
    });

    await context.close();

    if (browser) {
        await browser.close();
    }

    await saveRanking(results);

    buildReport();
}

run();