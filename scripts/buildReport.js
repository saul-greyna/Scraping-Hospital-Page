const fs = require('fs');
const path = require('path');

const RANKING_DIR = path.join(__dirname, '..', 'app', 'ranking');
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'data.json');

// Extrae el timestamp ISO del nombre de archivo:
// ranking-2026-07-13T05-33-53.065Z.json -> 2026-07-13T05:33:53.065Z
function parseTimestampFromFilename(fileName) {
    const match = fileName.match(
        /^ranking-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z)\.json$/
    );

    if (!match) {
        return null;
    }

    // Reponer los ':' que se reemplazaron por '-' al guardar
    const raw = match[1];
    const isoLike = raw.replace(
        /T(\d{2})-(\d{2})-(\d{2})/,
        'T$1:$2:$3'
    );

    return isoLike;
}

function buildReport() {

    const files = fs
        .readdirSync(RANKING_DIR)
        .filter(f => f.startsWith('ranking-') && f.endsWith('.json'))
        .sort();

    // keyword -> [{ date, position, found, clicks, impressions, ctr, gscAveragePosition }]
    const series = {};

    for (const fileName of files) {

        const isoDate = parseTimestampFromFilename(fileName);

        if (!isoDate) {
            continue;
        }

        const filePath = path.join(RANKING_DIR, fileName);

        let rows;

        try {
            rows = JSON.parse(
                fs.readFileSync(filePath, 'utf8')
            );
        } catch (error) {
            console.error(`No se pudo leer ${fileName}:`, error.message);
            continue;
        }

        for (const row of rows) {

            if (row.error) {
                continue;
            }

            const keyword = row.keyword;

            if (!series[keyword]) {
                series[keyword] = [];
            }

            series[keyword].push({
                date: isoDate,
                position: row.serpPosition ?? null,
                found: row.found ?? false,
                clicks: row.clicks ?? null,
                impressions: row.impressions ?? null,
                ctr: row.ctr ?? null,
                gscAveragePosition: row.gscAveragePosition ?? null,
            });
        }
    }

    // Ordenar cada serie por fecha
    for (const keyword of Object.keys(series)) {
        series[keyword].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );
    }

    const output = {
        generatedAt: new Date().toISOString(),
        keywords: Object.keys(series).sort(),
        series,
    };

    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

    fs.writeFileSync(
        OUTPUT_FILE,
        JSON.stringify(output, null, 2),
        'utf8'
    );

    console.log(
        `Reporte generado: ${OUTPUT_FILE} (${output.keywords.length} keywords, ${files.length} rastreos)`
    );
}

if (require.main === module) {
    buildReport();
}

module.exports = { buildReport };
