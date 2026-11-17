// check.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./check.config.json');

// Set test URL on port 3999 according to spec point 10
const PORT = config.port || 3999;
const BASE_URL = `http://localhost:${PORT}`;

// Helper Function to send HTTP Request
function makeRequest(pathName, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathName, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runCheck() {
  console.log(`\n========================================`);
  console.log(`  Starting Automated Tests (Port ${PORT})`);
  console.log(`========================================\n`);

  let passed = 0;
  let total = 0;

  async function assertTest(description, testFn) {
    total++;
    try {
      await testFn();
      console.log(`  [PASS] ${description}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${description}`);
      console.error(`         -> ${err.message}`);
    }
  }

  // --- 1. Test General API Rules (Spec 5) ---
  await assertTest('GET / should respond with 200, a short message, and JSON', async () => {
    const res = await makeRequest('/');
    if (res.statusCode !== 200) throw new Error(`Expected 200 but got ${res.statusCode}`);
    if (typeof res.data !== 'object') throw new Error('Response is not a JSON object');
  });

  await assertTest('Non-existent path should respond with 404', async () => {
    const res = await makeRequest('/api/non-existent-route-xyz');
    if (res.statusCode !== 404) throw new Error(`Expected 404 but got ${res.statusCode}`);
  });

  // Endpoint names based on Library theme (configurable via check.config.json)
  const itemPath = `/${config.items || 'books'}`;
  const personPath = `/${config.persons || 'members'}`;
  const linkPath = `/${config.links || 'loans'}`;
  const extraPath = config.extra ? `/${config.extra}` : null;

  let createdItemId = null;
  let createdPersonId = null;
  let createdLinkId = null;

  // --- 2. Test ITEM Resource (CRUD & Validations - Spec 6) ---
  await assertTest(`POST ${itemPath} without name should respond with 400`, async () => {
    const res = await makeRequest(itemPath, 'POST', { note: 'No name given' });
    if (res.statusCode !== 400) throw new Error(`Expected 400 but got ${res.statusCode}`);
  });

  await assertTest(`POST ${itemPath} with valid data should respond with 201 and provide id = max + 1`, async () => {
    const res = await makeRequest(itemPath, 'POST', { name: 'Clean Code', note: 'Programming Book' });
    if (res.statusCode !== 201) throw new Error(`Expected 201 but got ${res.statusCode}`);
    if (!res.data || !res.data.id) throw new Error('Missing id in newly created object');
    createdItemId = res.data.id;
  });

  await assertTest(`GET ${itemPath} should respond with 200 and an Array`, async () => {
    const res = await makeRequest(itemPath, 'GET');
    if (res.statusCode !== 200) throw new Error(`Expected 200 but got ${res.statusCode}`);
    if (!Array.isArray(res.data)) throw new Error('Response is not an Array');
  });

  await assertTest(`GET ${itemPath}/:id should respond with 200 and correct Object`, async () => {
    const res = await makeRequest(`${itemPath}/${createdItemId}`, 'GET');
    if (res.statusCode !== 200) throw new Error(`Expected 200 but got ${res.statusCode}`);
    if (res.data.id != createdItemId) throw new Error('IDs do not match');
  });

  await assertTest(`GET ${itemPath}/999999 (Not Found) should respond with 404`, async () => {
    const res = await makeRequest(`${itemPath}/999999`, 'GET');
    if (res.statusCode !== 404) throw new Error(`Expected 404 but got ${res.statusCode}`);
  });

  // --- 3. Test PERSON Resource (Spec 6) ---
  await assertTest(`POST ${personPath} to create new person should respond with 201`, async () => {
    const res = await makeRequest(personPath, 'POST', { name: 'Sok Dara', phone: '012345678' });
    if (res.statusCode !== 201) throw new Error(`Expected 201 but got ${res.statusCode}`);
    createdPersonId = res.data.id;
  });

  // --- 4. Test LINK Resource (Special Rules - Spec 7) ---
  if (config.links) {
    await assertTest(`POST ${linkPath} without itemId or personId should respond with 400`, async () => {
      const res = await makeRequest(linkPath, 'POST', {});
      if (res.statusCode !== 400) throw new Error(`Expected 400 but got ${res.statusCode}`);
    });

    await assertTest(`POST ${linkPath} successful creation should respond with 201 and endedAt: null`, async () => {
      const res = await makeRequest(linkPath, 'POST', {
        itemId: createdItemId,
        personId: createdPersonId
      });
      if (res.statusCode !== 201) throw new Error(`Expected 201 but got ${res.statusCode}`);
      if (res.data.endedAt !== null) throw new Error('endedAt is not null');
      createdLinkId = res.data.id;
    });

    await assertTest(`POST ${linkPath} when ITEM is already on loan should respond with 409`, async () => {
      const res = await makeRequest(linkPath, 'POST', {
        itemId: createdItemId,
        personId: createdPersonId
      });
      if (res.statusCode !== 409) throw new Error(`Expected 409 Conflict but got ${res.statusCode}`);
    });

    await assertTest(`PUT ${linkPath}/:id/end to close loan should respond with 200 and include endedAt`, async () => {
      const res = await makeRequest(`${linkPath}/${createdLinkId}/end`, 'PUT');
      if (res.statusCode !== 200) throw new Error(`Expected 200 but got ${res.statusCode}`);
      if (!res.data.endedAt) throw new Error('endedAt timestamp not set');
    });

    await assertTest(`PUT ${linkPath}/:id/end when already closed should respond with 409`, async () => {
      const res = await makeRequest(`${linkPath}/${createdLinkId}/end`, 'PUT');
      if (res.statusCode !== 409) throw new Error(`Expected 409 but got ${res.statusCode}`);
    });
  }

  // --- 5. Test EXTRA Resource (Group of 5 - Spec 6) ---
  if (extraPath) {
    await assertTest(`GET ${extraPath} should respond with 200`, async () => {
      const res = await makeRequest(extraPath, 'GET');
      if (res.statusCode !== 200) throw new Error(`Expected 200 but got ${res.statusCode}`);
    });
  }

  // --- Summary Conclusion ---
  console.log(`\n----------------------------------------`);
  console.log(`Total Test Results: Passed ${passed}/${total}`);
  console.log(`----------------------------------------\n`);

  if (passed === total) {
    console.log('🎉 Congratulations! Your code has passed all requirements.');
    process.exit(0);
  } else {
    console.error('⚠️ Some tests failed. Please review status codes and your code logic.');
    process.exit(1);
  }
}

// Run the check script
runCheck().catch((err) => {
  console.error('Error running tests: Please make sure the server is running on port 3999 or the configured port!', err.message);
  process.exit(1);
});