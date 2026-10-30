const { sendJSON } = require("./lib/send");

const booksHandler = require("./resources/books");
const membersHandler = require("./resources/members");
const loansHandler = require("./resources/loans");
const categoriesHandler = require("./resources/categories");

async function handleRoutes(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    // =====================================
    // GET /
    // =====================================
    if (pathname === "/" && method === "GET") {
      return sendJSON(res, 200, {
        message: "Library REST API",
        resources: ["/books", "/members", "/loans", "/categories"],
      });
    }

    // =====================================
    // BOOKS
    // =====================================
    if (pathname.startsWith("/books")) {
      return await booksHandler(req, res, pathname, method);
    }

    // =====================================
    // MEMBERS
    // =====================================
    if (pathname.startsWith("/members")) {
      return await membersHandler(req, res, pathname, method);
    }

    // =====================================
    // LOANS
    // =====================================
    if (pathname.startsWith("/loans")) {
      return await loansHandler(req, res, pathname, method);
    }

    // =====================================
    // CATEGORIES
    // =====================================
    if (pathname.startsWith("/categories")) {
      return await categoriesHandler(req, res, pathname, method);
    }

    // =====================================
    // ROUTE NOT FOUND
    // =====================================
    return sendJSON(res, 404, {
      error: "Route not found",
    });
  } catch (error) {
    console.error(error);

    // Error with status code
    if (error.status) {
      return sendJSON(res, error.status, {
        error: error.message,
      });
    }

    // Unexpected error
    return sendJSON(res, 500, {
      error: "Internal Server Error",
    });
  }
}

module.exports = handleRoutes;
