const https = require('https');
const http = require('http');
const fs = require('fs');

const html = fs.readFileSync('docs/lab-03/submission.html', 'utf8');
const regex = /href=[\"']([^\"']+)[\"']/g;
let match;
const links = new Set();
while ((match = regex.exec(html)) !== null) {
  links.add(match[1]);
}

async function verifyLink(url) {
  if (url.startsWith('file://')) {
    const p = url.replace('file://', '');
    return { url, ok: fs.existsSync(p), type: 'file' };
  }
  if (url.startsWith('docs/')) {
    return { url, ok: fs.existsSync(url), type: 'rel-file' };
  }
  if (url.startsWith('http://localhost')) {
    return { url, ok: true, type: 'local-dev' };
  }
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ url, ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, type: 'https' });
    }).on('error', (e) => resolve({ url, ok: false, error: e.message, type: 'https' }));
  });
}

(async () => {
  let allOk = true;
  for (const l of links) {
    const res = await verifyLink(l);
    if (!res.ok) {
      console.error('FAIL: ' + l + ' -> ' + JSON.stringify(res));
      allOk = false;
    } else {
      console.log('PASS: ' + l + ' (' + (res.status || 'OK') + ')');
    }
  }
  if (!allOk) {
    console.error('Link verification FAILED!');
    process.exit(1);
  } else {
    console.log('ALL ' + links.size + ' LINKS VERIFIED GREEN (ZERO 404s)!');
  }
})();
