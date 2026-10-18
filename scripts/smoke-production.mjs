import http from 'node:http';
import express from 'express';
import {fileURLToPath} from 'node:url';
import {createApp} from '../server/app.js';

const local = createApp({AI_API_KEY: '', CAMERA_URL: ''});
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
local.use(express.static(dist, {etag: false, lastModified: false}));
local.get('/{*path}', (req, res) => res.sendFile(dist + 'index.html'));

process.env.VERCEL = '1';
process.env.VERCEL_URL = 'dswd-sanchez-git-main.vercel.app';
process.env.VERCEL_PROJECT_PRODUCTION_URL = 'dswd-sanchez.vercel.app';
process.env.AI_API_KEY = '';
delete process.env.CAMERA_URL;
const {default: vercelApp} = await import('../api/[...path].js');

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const localServer = await listen(local);
const vercelServer = await listen(vercelApp);
const localBase = `http://127.0.0.1:${localServer.address().port}`;
const vercelBase = `http://127.0.0.1:${vercelServer.address().port}`;
const checks = [];

async function check(name, ok) {
  checks.push([name, ok]);
  if (!ok) console.error('FAIL', name);
}

const home = await fetch(localBase + '/');
const homeText = await home.text();
await check('home', home.status === 200 && homeText.includes('id="root"'));

const spa = await fetch(localBase + '/documents');
const spaText = await spa.text();
await check('spa route', spa.status === 200 && spaText.includes('id="root"'));

const asset = homeText.match(/src="([^"]+\.js)"/);
const assetRes = asset ? await fetch(localBase + asset[1]) : {status: 0};
await check('frontend asset', assetRes.status === 200);

const config = await fetch(localBase + '/api/config');
const configBody = await config.json();
await check('local config', config.status === 200 && configBody.configured === false && configBody.cameraUrl === '');

const review = await fetch(localBase + '/api/review', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: JSON.stringify({documentType: 'Memorandum', text: 'Please review this memorandum.', consent: true, verified: true})
});
await check('local review without key', review.status === 503);

const bad = await fetch(localBase + '/api/review', {
  method: 'POST',
  headers: {'content-type': 'application/json', origin: 'https://evil.example'},
  body: '{}'
});
await check('cross origin', bad.status === 403);

const invalid = await fetch(localBase + '/api/review', {
  method: 'POST',
  headers: {'content-type': 'application/json'},
  body: '{"text":'
});
await check('invalid json', invalid.status === 400);

function request(port, {method = 'GET', host, path, body} = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({hostname: '127.0.0.1', port, method, path, headers: {host, ...(body ? {'content-type': 'application/json', 'content-length': Buffer.byteLength(body)} : {})}}, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({status: res.statusCode, body: Buffer.concat(chunks).toString()}));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const vercelPort = vercelServer.address().port;
const vercelConfig = await request(vercelPort, {host: 'dswd-sanchez.vercel.app', path: '/api/config'});
const vercelBody = JSON.parse(vercelConfig.body);
await check('vercel config', vercelConfig.status === 200 && vercelBody.cameraUrl === '' && vercelBody.configured === false);

const blocked = await request(vercelPort, {host: '192.168.254.107', path: '/api/config'});
await check('vercel rejects lan host', blocked.status === 403);

let limited = 0;
for (let i = 0; i < 6; i++) {
  const response = await request(vercelPort, {
    method: 'POST',
    host: 'dswd-sanchez.vercel.app',
    path: '/api/review',
    body: JSON.stringify({documentType: 'Memorandum', text: 'Please review this memorandum.', consent: true, verified: true})
  });
  limited = response.status;
}
await check('review rate limit', limited === 429);

localServer.close();
vercelServer.close();
const failed = checks.filter(([, ok]) => !ok);
console.log(checks.map(([name, ok]) => `${ok ? 'ok' : 'FAIL'} ${name}`).join('\n'));
process.exit(failed.length ? 1 : 0);
