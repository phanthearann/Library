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
  if (typeof handler === "function") {
    return await handler(req, res, pathname, method);
  }

  const parts = pathname.split("/").filter(Boolean);
  const id = parts[1];

  if (parts.length === 1) {
    if (method === "GET") return sendJSON(res, 200, await handler.getAll());
    if (method === "POST") {
      const body = await readBody(req);
      return sendJSON(res, 201, await handler.create(body));
    }
    return sendJSON(res, 405, { error: "Method Not Allowed" });
  }

  if (parts.length === 2 && id) {
    if (method === "GET") {
      const item = await handler.findById(id);
      if (!item) return sendJSON(res, 404, { error: "Not found" });
      return sendJSON(res, 200, item);
    }
    if (method === "PUT" || method === "PATCH") {
      const body = await readBody(req);
      return sendJSON(res, 200, await handler.update(id, body));
    }
    if (method === "DELETE") {
      return sendJSON(res, 200, await handler.remove(id));
    }
    return sendJSON(res, 405, { error: "Method Not Allowed" });
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
