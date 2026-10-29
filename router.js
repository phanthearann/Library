// router.js
const { sendJSON } = require('./lib/send');

const booksHandler = require('./resources/books');
const membersHandler = require('./resources/members');
const loansHandler = require('./resources/loans');
const categoriesHandler = require('./resources/categories'); // ប្រធានបទ Library

async function handleRoutes(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    // 1. GET / ឆ្លើយ 200 ជាមួយសារខ្លី (Spec ៥)
    if (pathname === '/' && method === 'GET') {
      return sendJSON(res, 200, {
        message: 'Library REST API',
        resources: ['/books', '/members', '/loans', '/categories']
      });
    }

    // 2. បែងចែកទៅតាមប្រធានបទ Library (Spec ៣)
    if (pathname.startsWith('/books')) {
      await booksHandler(req, res, pathname, method);
    } else if (pathname.startsWith('/members')) {
      await membersHandler(req, res, pathname, method);
    } else if (pathname.startsWith('/loans')) {
      await loansHandler(req, res, pathname, method);
    } else if (pathname.startsWith('/categories')) {
      await categoriesHandler(req, res, pathname, method);
    } else {
      // 3. Path មិនមាន -> 404 (Spec ៥)
      sendJSON(res, 404, { error: 'Route not found' });
    }
  } catch (error) {
    // 4. Server error -> 500 (Spec ៥)
    console.error(error);
    sendJSON(res, 500, { error: 'Internal Server Error' });
  }
}

module.exports = handleRoutes;