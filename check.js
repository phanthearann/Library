// check.js
const http = require('http');
const config = require('./check.config.json');

const BASE_URL = config.baseUrl || `http://localhost:${config.port || 3000}`;

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runCheck() {
  console.log('--- ចាប់ផ្ដើមការត្រួតពិនិត្យ Server (npm run check) ---');
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name} ->`, err.message);
    }
  }

  // ១. តេស្តកំហុស 404 Not Found
  await test('Route មិនត្រឹមត្រូវ ត្រូវឆ្លើយតប Status 404', async () => {
    const res = await request(`${BASE_URL}/api/unknown-endpoint`);
    if (res.status !== 404) throw new Error(`Exptected 404, got ${res.status}`);
  });

  // ២. តេស្ត Endpoint Books (ITEM)
  if (config.resources.item) {
    await test(`GET /api/${config.resources.item} ត្រូវឆ្លើយតប Status 200`, async () => {
      const res = await request(`${BASE_URL}/api/${config.resources.item}`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });
  }

  // ៣. តេស្ត Endpoint Members (PERSON)
  if (config.resources.person) {
    await test(`GET /api/${config.resources.person} ត្រូវឆ្លើយតប Status 200`, async () => {
      const res = await request(`${BASE_URL}/api/${config.resources.person}`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });
  }

  // ៤. តេស្ត Endpoint Loans (LINK)
  if (config.resources.link) {
    await test(`GET /api/${config.resources.link} ត្រូវឆ្លើយតប Status 200`, async () => {
      const res = await request(`${BASE_URL}/api/${config.resources.link}`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });
  }

  // ៥. តេស្ត Endpoint Categories (EXTRA)
  if (config.resources.extra) {
    await test(`GET /api/${config.resources.extra} ត្រូវឆ្លើយតប Status 200`, async () => {
      const res = await request(`${BASE_URL}/api/${config.resources.extra}`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });
  }

  console.log(`\nលទ្ធផលសរុប៖ ជាប់ ${passed}/${total} ការតេស្ត`);
  if (passed === total) {
    console.log('ការត្រួតពិនិត្យបានជោគជ័យពេញលេញ!');
    process.exit(0);
  } else {
    console.error('មានការតេស្តមួយចំនួនមិនទាន់ជាប់!');
    process.exit(1);
  }
}

// ដំណើរការ run
runCheck().catch((err) => {
  console.error('មិនអាចភ្ជាប់ទៅកាន់ Server បានទេ! សូមប្រាកដថាបាន run `npm run dev` ជាមុនសិន។');
  process.exit(1);
});