
<<<<<<< HEAD
=======
// Finds the right resource for a request and hands it over.
// Every file in resources/ is loaded automatically.

const fs = require("node:fs");
const path = require("node:path");

>>>>>>> a76e3f9b8980f7ed54703d0a13a8b5ab8446bf9f
const { sendJSON } = require("./lib/send");

// Load all resources automatically
const resources = fs
  .readdirSync(path.join(__dirname, "resources"))
  .filter((file) => file.endsWith(".js"))
  .map((file) => {
    const handler = require(
      path.join(__dirname, "resources", file)
    );

    return {
      path: "/" + path.basename(file, ".js"),
      handler,
    };
  });

async function handleRoutes(req, res) {
<<<<<<< HEAD
    try {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

        const pathname = parsedUrl.pathname;
        const method = req.method;

        // =====================================
        // GET /
        // =====================================
        if (pathname === "/" && method === "GET") {
            return sendJSON(res, 200, {
                message: "Library REST API",
                resources: [
                    "/books",
                    "/members",
                    "/loans",
                    "/categories"
                ]
            });
        }

        // =====================================
        // BOOKS
        // =====================================
        if (pathname === "/books" || pathname.startsWith("/books/")) {
            return await booksHandler(req, res, pathname, method);
        }

        // =====================================
        // MEMBERS
        // =====================================
        if (pathname === "/members" || pathname.startsWith("/members/")) {
            return await membersHandler(req, res, pathname, method);
        }

        // =====================================
        // LOANS
        // =====================================
        if (pathname === "/loans" || pathname.startsWith("/loans/")) {
            return await loansHandler(req, res, pathname, method);
        }

        // =====================================
        // CATEGORIES
        // =====================================
        if (pathname === "/categories" || pathname.startsWith("/categories/")) {
            return await categoriesHandler(req, res, pathname, method);
        }

        // =====================================
        // ROUTE NOT FOUND
        // =====================================
        return sendJSON(res, 404, {
            error: "Route not found"
        });

    } catch (error) {
        console.error("Route Error:", error);

        if (res.headersSent) return;

        return sendJSON(res, error.status || 500, {
            error: error.status
                ? error.message
                : "Internal Server Error"
        });
    }
=======
  try {
    // Parse URL
    const parsedUrl = new URL(
      req.url,
      "http://localhost"
    );

    const pathname = parsedUrl.pathname;
    const method = req.method;

    const segments = pathname
      .split("/")
      .filter(Boolean);

    // =====================================
    // GET /
    // =====================================
    if (segments.length === 0) {
      if (method !== "GET") {
        return sendJSON(res, 405, {
          error: "Method Not Allowed",
        });
      }

      return sendJSON(res, 200, {
        message: "Library REST API",
        resources: resources.map((r) => r.path),
      });
    }

    // =====================================
    // FIND RESOURCE
    // =====================================
    const resource = resources.find(
      (r) =>
        pathname === r.path ||
        pathname.startsWith(r.path + "/")
    );

    // =====================================
    // ROUTE NOT FOUND
    // =====================================
    if (!resource) {
      return sendJSON(res, 404, {
        error: "Route not found",
      });
    }

    // =====================================
    // CALL RESOURCE HANDLER
    // =====================================
    return await resource.handler(
      req,
      res,
      pathname,
      method
    );

  } catch (error) {
    console.error(error);

    // Known errors
    if (error.status) {
      return sendJSON(res, error.status, {
        error: error.message,
      });
    }

    // Unexpected errors
    return sendJSON(res, 500, {
      error: "Internal Server Error",
    });
  }
>>>>>>> a76e3f9b8980f7ed54703d0a13a8b5ab8446bf9f
}
module.exports = handleRoutes;
