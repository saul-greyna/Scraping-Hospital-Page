const fs = require('fs');
const http = require('http');
const { URL } = require('url');
const { default: open } = require('open');
const { google } = require('googleapis');

const credentials = require('../oauth.json');

const {
    client_id,
    client_secret,
} = credentials.installed;

const PORT = 3333;

const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    `http://localhost:${PORT}`
);

const SCOPES = [
    'https://www.googleapis.com/auth/webmasters.readonly'
];

const server = http.createServer(async (req, res) => {

    try {

        const reqUrl =
            new URL(req.url, `http://localhost:${PORT}`);

        const code = reqUrl.searchParams.get('code');

        if (!code) {

            res.writeHead(400);
            res.end('No authorization code.');

            return;
        }

        console.log('Authorization code recibido.');

        const { tokens } =
            await oAuth2Client.getToken(code);

        oAuth2Client.setCredentials(tokens);

        fs.writeFileSync(
            'token.json',
            JSON.stringify(tokens, null, 2)
        );

        res.writeHead(200, {
            'Content-Type': 'text/html',
        });

        res.end(`
            <h1>OAuth completado</h1>
            <p>Cierre esta ventana.</p>
        `);

        console.log('Token guardado.');

        server.close();

    } catch (error) {

        console.error(error);

        res.writeHead(500);

        res.end('Error OAuth.');
    }

});

server.listen(PORT, async () => {

    console.log(`Servidor listo en puerto ${PORT}`);

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    });

    console.log('Abriendo navegador...');

    await open(authUrl);
});