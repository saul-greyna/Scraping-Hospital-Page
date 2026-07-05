const fs = require('fs');
const path = require('path');

async function saveRanking(results) {

    const timestamp =
        new Date()
            .toISOString()
            .replace(/:/g, '-');

    const fileName =
        `ranking-${timestamp}.json`;

    const filePath = path.join(
        __dirname,
        fileName
    );

    fs.writeFileSync(
        filePath,
        JSON.stringify(results, null, 2),
        'utf8'
    );

    console.log(
        `Ranking guardado en: ${filePath}`
    );
}

module.exports = {
    saveRanking,
};