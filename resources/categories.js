const fs = require("fs").promises;
const path = require("path");
const { sendJSON } = require("../lib/send");

const filePath = path.join(__dirname, "..", "Data", "categories.json");

async function ensureDirectory() {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function readData() {
  try {
    const data = await fs.readFile(filePath, "utf8");
    if (!data || data.trim() === "") {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT" || error instanceof SyntaxError) {
      await ensureDirectory();
      await fs.writeFile(filePath, "[]");
      return [];
    }
    throw error;
  }
}

async function writeData(data) {
  await ensureDirectory();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function getAll() {
  return await readData();
}

async function findById(id) {
  const categories = await readData();
  return categories.find((category) => category.id === Number(id)) || null;
}

// Main request handler for the categories resource
async function handleRequest(req, res, pathname, method, bus) {
  const segments = pathname.split("/").filter(Boolean);
  const id = segments[1];

  switch (method) {
    case "GET":
      if (id) {
        const category = await findById(id);
        if (!category) {
          const error = new Error("Category not found");
          error.status = 404;
          throw error;
        }
        return sendJSON(res, 200, category);
      } else {
        const allCategories = await getAll();
        return sendJSON(res, 200, allCategories);
      }

    default: {
      const error = new Error("Method Not Allowed");
      error.status = 405;
      throw error;
    }
  }
}

module.exports = handleRequest;
