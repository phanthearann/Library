const { sendJSON } = require('./lib/send');

// ហៅ handlers ពី resources មកប្រើ
const booksHandler = require('./resources/books');
const membersHandler = require('./resources/members');
const loansHandler = require('./resources/loans');
const categoriesHandler = require('./resources/categories');

async function handleRoutes(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    if (pathname.startsWith('/api/books')) {
      if (typeof booksHandler === 'function') {
        await booksHandler(req, res, pathname, method);
      } else {
        sendJSON(res, 501, { message: 'Books handler not implemented yet' });
      }
    } else if (pathname.startsWith('/api/members')) {
      if (typeof membersHandler === 'function') {
        await membersHandler(req, res, pathname, method);
      } else {
        sendJSON(res, 501, { message: 'Members handler not implemented yet' });
      }
    } else if (pathname.startsWith('/api/loans')) {
      if (typeof loansHandler === 'function') {
        await loansHandler(req, res, pathname, method);
      } else {
        sendJSON(res, 501, { message: 'Loans handler not implemented yet' });
      }
    } else if (pathname.startsWith('/api/categories')) {
      if (typeof categoriesHandler === 'function') {
        await categoriesHandler(req, res, pathname, method);
      } else {
        sendJSON(res, 501, { message: 'Categories handler not implemented yet' });
      }
    } else {
      // 404 Not Found តាមតម្រូវការ Core owner
      sendJSON(res, 404, { error: 'Route not found' });
    }
  } catch (error) {
    // 500 Internal Server Error តាមតម្រូវការ Core owner
    console.error('Server Error:', error);
    sendJSON(res, 500, { error: 'Internal Server Error' });
  }
}

module.exports = handleRoutes;