// check.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./check.config.json');

// កំណត់ URL តេស្តលើ Port 3999 តាម Spec ចំណុច ១០
const PORT = config.port || 3999;
const BASE_URL = `http://localhost:${PORT}`;

// Helper Function សម្រាប់ផ្ញើ HTTP Request
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
  console.log(`  ចាប់ផ្ដើមការតេស្តស្វ័យប្រវត្តិ (Port ${PORT})`);
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

  // --- ១. តេស្តក្បួនទូទៅរបស់ API (Spec ៥) ---
  await assertTest('GET / ត្រូវឆ្លើយតប 200 ជាមួយសារខ្លី និង JSON', async () => {
    const res = await makeRequest('/');
    if (res.statusCode !== 200) throw new Error(`រំពឹង 200 តែទទួលបាន ${res.statusCode}`);
    if (typeof res.data !== 'object') throw new Error('Response មិនមែនជា JSON');
  });

  await assertTest('Path ដែលមិនមាន ត្រូវឆ្លើយតប 404', async () => {
    const res = await makeRequest('/api/non-existent-route-xyz');
    if (res.statusCode !== 404) throw new Error(`រំពឹង 404 តែទទួលបាន ${res.statusCode}`);
  });

  // ឈ្មោះ Endpoint តាម Theme Library (ប្តូរតាម check.config.json)
  const itemPath = `/${config.items || 'books'}`;
  const personPath = `/${config.persons || 'members'}`;
  const linkPath = `/${config.links || 'loans'}`;
  const extraPath = config.extra ? `/${config.extra}` : null;

  let createdItemId = null;
  let createdPersonId = null;
  let createdLinkId = null;

  // --- ២. តេស្ត ITEM Resource (CRUD & Validations - Spec ៦) ---
  await assertTest(`POST ${itemPath} បើគ្មាន name ត្រូវឆ្លើយតប 400`, async () => {
    const res = await makeRequest(itemPath, 'POST', { note: 'No name given' });
    if (res.statusCode !== 400) throw new Error(`រំពឹង 400 តែទទួលបាន ${res.statusCode}`);
  });

  await assertTest(`POST ${itemPath} បង្កើតថ្មីត្រឹមត្រូវ ត្រូវឆ្លើយតប 201 និងផ្ដល់ id ធំជាងគេ + ១`, async () => {
    const res = await makeRequest(itemPath, 'POST', { name: 'Clean Code', note: 'Programming Book' });
    if (res.statusCode !== 201) throw new Error(`រំពឹង 201 តែទទួលបាន ${res.statusCode}`);
    if (!res.data || !res.data.id) throw new Error('មិនមាន id ក្នុង Object ថ្មី');
    createdItemId = res.data.id;
  });

  await assertTest(`GET ${itemPath} ត្រូវឆ្លើយតប 200 និងជា Array`, async () => {
    const res = await makeRequest(itemPath, 'GET');
    if (res.statusCode !== 200) throw new Error(`រំពឹង 200 តែទទួលបាន ${res.statusCode}`);
    if (!Array.isArray(res.data)) throw new Error('Response មិនមែនជា Array');
  });

  await assertTest(`GET ${itemPath}/:id ត្រូវឆ្លើយតប 200 + Object ត្រឹមត្រូវ`, async () => {
    const res = await makeRequest(`${itemPath}/${createdItemId}`, 'GET');
    if (res.statusCode !== 200) throw new Error(`រំពឹង 200 តែទទួលបាន ${res.statusCode}`);
    if (res.data.id != createdItemId) throw new Error('ID មិនត្រូវគ្នា');
  });

  await assertTest(`GET ${itemPath}/999999 (រកមិនឃើញ) ត្រូវឆ្លើយតប 404`, async () => {
    const res = await makeRequest(`${itemPath}/999999`, 'GET');
    if (res.statusCode !== 404) throw new Error(`រំពឹង 404 តែទទួលបាន ${res.statusCode}`);
  });

  // --- ៣. តេស្ត PERSON Resource (Spec ៦) ---
  await assertTest(`POST ${personPath} បង្កើតថ្មី ត្រូវឆ្លើយតប 201`, async () => {
    const res = await makeRequest(personPath, 'POST', { name: 'Sok Dara', phone: '012345678' });
    if (res.statusCode !== 201) throw new Error(`រំពឹង 201 តែទទួលបាន ${res.statusCode}`);
    createdPersonId = res.data.id;
  });

  // --- ៤. តេស្ត LINK Resource (ច្បាប់ពិសេស - Spec ៧) ---
  if (config.links) {
    await assertTest(`POST ${linkPath} បើគ្មាន itemId ឬ personId ត្រូវឆ្លើយតប 400`, async () => {
      const res = await makeRequest(linkPath, 'POST', {});
      if (res.statusCode !== 400) throw new Error(`រំពឹង 400 តែទទួលបាន ${res.statusCode}`);
    });

    await assertTest(`POST ${linkPath} បង្កើតជោគជ័យ ត្រូវឆ្លើយតប 201 និង endedAt: null`, async () => {
      const res = await makeRequest(linkPath, 'POST', {
        itemId: createdItemId,
        personId: createdPersonId
      });
      if (res.statusCode !== 201) throw new Error(`រំពឹង 201 តែទទួលបាន ${res.statusCode}`);
      if (res.data.endedAt !== null) throw new Error('endedAt មិនមែនជា null');
      createdLinkId = res.data.id;
    });

    await assertTest(`POST ${linkPath} បើ ITEM នោះកំពុងខ្ចីមិនទាន់សង ត្រូវឆ្លើយតប 409`, async () => {
      const res = await makeRequest(linkPath, 'POST', {
        itemId: createdItemId,
        personId: createdPersonId
      });
      if (res.statusCode !== 409) throw new Error(`រំពឹង 409 Conflict តែទទួលបាន ${res.statusCode}`);
    });

    await assertTest(`PUT ${linkPath}/:id/end បញ្ចប់ការខ្ចី ត្រូវឆ្លើយតប 200 និងមាន endedAt`, async () => {
      const res = await makeRequest(`${linkPath}/${createdLinkId}/end`, 'PUT');
      if (res.statusCode !== 200) throw new Error(`រំពឹង 200 តែទទួលបាន ${res.statusCode}`);
      if (!res.data.endedAt) throw new Error('endedAt មិនទាន់ទទួលបានកាលបរិច្ឆេទ');
    });

    await assertTest(`PUT ${linkPath}/:id/end បើបញ្ចប់ម្ដងទៀត ត្រូវឆ្លើយតប 409`, async () => {
      const res = await makeRequest(`${linkPath}/${createdLinkId}/end`, 'PUT');
      if (res.statusCode !== 409) throw new Error(`រំពឹង 409 តែទទួលបាន ${res.statusCode}`);
    });
  }

  // --- ៥. តេស្ត EXTRA Resource (ក្រុម ៥ នាក់ - Spec ៦) ---
  if (extraPath) {
    await assertTest(`GET ${extraPath} ត្រូវឆ្លើយតប 200`, async () => {
      const res = await makeRequest(extraPath, 'GET');
      if (res.statusCode !== 200) throw new Error(`រំពឹង 200 តែទទួលបាន ${res.statusCode}`);
    });
  }

  // --- សេចក្ដីសន្និដ្ឋានលទ្ធផល ---
  console.log(`\n----------------------------------------`);
  console.log(`លទ្ធផលតេស្តសរុប៖ ជាប់ ${passed}/${total}`);
  console.log(`----------------------------------------\n`);

  if (passed === total) {
    console.log('🎉 អបអរសាទរ! កូដរបស់អ្នកបានជាប់គ្រប់លក្ខខណ្ឌទាំងអស់។');
    process.exit(0);
  } else {
    console.error('⚠️ នៅមានកំហុសមួយចំនួនមិនទាន់ជាប់ សូមពិនិត្យ Status code និងកូដឡើងវិញ។');
    process.exit(1);
  }
}

// ចាប់ផ្ដើមរត់ Check
runCheck().catch((err) => {
  console.error('កំហុសពេលដំណើរការតេស្ត៖ សូមប្រាកដថាម៉ាស៊ីនបម្រើ (Server) កំពុងដំណើរការលើ Port 3999 ឬ Port ដែលបានកំណត់!', err.message);
  process.exit(1);
});