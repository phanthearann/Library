
const { sendJSON } = require("./lib/send");

const booksHandler = require("./resources/books");
const membersHandler = require("./resources/members");
const loansHandler = require("./resources/loans");
const categoriesHandler = require("./resources/categories");

async function handleRoutes(req, res) {
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
}
module.exports = handleRoutes;
