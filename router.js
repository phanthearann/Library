
// Finds the right resource for a request and hands it over.
// Every file in resources/ is loaded automatically.

const fs = require("node:fs");
const path = require("node:path");

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
}

module.exports = handleRoutes;
