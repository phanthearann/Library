const { sendJSON } = require("./lib/send");

const booksHandler = require("./resources/books");
const membersHandler = require("./resources/members");
const loansHandler = require("./resources/loans");
const categoriesHandler = require("./resources/categories");

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        const error = new Error("Invalid JSON body");
        error.status = 400;
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function runHandler(handler, req, res, pathname, method) {
  // 1. Handle resources with CRUD methods (getAll, findById, create, update, remove)
  if (handler && typeof handler.getAll === "function") {
    const parts = pathname.split("/").filter(Boolean);
    let id = parts[1];

    // GET all: GET /members
    if (parts.length === 1 && method === "GET") {
      return sendJSON(res, 200, await handler.getAll());
    }

    // CREATE: POST /members
    if (parts.length === 1 && method === "POST") {
      const body = await readBody(req);
      return sendJSON(res, 201, await handler.create(body));
    }

    // Read JSON body for PUT, PATCH, or DELETE
    const body =
      method === "PUT" || method === "PATCH" || method === "DELETE"
        ? await readBody(req)
        : {};

    // Allow ID from the URL (/members/5) OR from the JSON body ({"id": "5"})
    id = id ?? body.id;

    if (id !== undefined && id !== "") {
      // GET one: GET /members/1
      if (method === "GET") {
        const item = await handler.findById(id);
        if (!item) return sendJSON(res, 404, { error: "Not found" });
        return sendJSON(res, 200, item);
      }

      // UPDATE: PUT /members/1 OR PUT /members with {"id": 1, ...}
      if (method === "PUT" || method === "PATCH") {
        return sendJSON(res, 200, await handler.update(id, body));
      }

      // DELETE: DELETE /members/1 OR DELETE /members with {"id": 1}
      if (method === "DELETE") {
        return sendJSON(res, 200, await handler.remove(id));
      }
    }

    return sendJSON(res, 405, { error: "Method Not Allowed" });
  }

  // 2. Fallback if the resource exports only a single function
  if (typeof handler === "function") {
    return await handler(req, res, pathname, method);
  }

  return sendJSON(res, 404, { error: "Route not found" });
}

async function handleRoutes(req, res) {
  try {
    const parsedUrl = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`
    );

    const pathname = parsedUrl.pathname;
    const method = req.method;

    if (pathname === "/" && method === "GET") {
      return sendJSON(res, 200, {
        message: "Library REST API",
        resources: ["/books", "/members", "/loans", "/categories"],
      });
    }

    const routes = [
      { path: "/books", handler: booksHandler },
      { path: "/members", handler: membersHandler },
      { path: "/loans", handler: loansHandler },
      { path: "/categories", handler: categoriesHandler },
    ];

    for (const route of routes) {
      if (pathname === route.path || pathname.startsWith(route.path + "/")) {
        return await runHandler(route.handler, req, res, pathname, method);
      }
    }

    return sendJSON(res, 404, { error: "Route not found" });
  } catch (error) {
    console.error("Route Error:", error);
    if (res.headersSent) return;
    return sendJSON(res, error.status || 500, {
      error: error.message || "Internal Server Error",
    });
  }
}

module.exports = handleRoutes;