const http = require('http');

const URLS = [
    { path: '/', method: 'GET' },
    { path: '/login', method: 'POST', body: JSON.stringify({username: 'admin', password: 'badpassword'}) },
    { path: '/login', method: 'POST', body: JSON.stringify({username: 'admin', password: 'password123'}) }
];

function generateTraffic() {
    const target = URLS[Math.floor(Math.random() * URLS.length)];
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: target.path,
        method: target.method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        // Just consume data to free memory
        res.on('data', () => {});
    });

    req.on('error', (e) => {
        // console.error(`Problem with request: ${e.message}`);
    });

    if (target.body) {
        req.write(target.body);
    }
    req.end();

    // Random interval between 10ms and 200ms to generate decent load
    setTimeout(generateTraffic, Math.random() * 190 + 10);
}

console.log("Starting test traffic generator... Press Ctrl+C to stop.");
generateTraffic();
