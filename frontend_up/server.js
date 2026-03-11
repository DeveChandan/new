const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = false; // Always production on cPanel
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(port, () => {
        console.log(`> Next.js server running on port ${port}`);
    });
});
