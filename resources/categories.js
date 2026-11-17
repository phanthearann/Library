const fs = require("fs").promises;
const path = require("path");
const { sendJSON } = require("../lib/send");
const bus = require("../lib/events");

const filePath = path.join(__dirname, "..", "data", "categories.json");

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

async function create(categoryData, bus) {
  const categories = await readData();
  const name = categoryData?.name;

  if (typeof name !== "string" || name.trim() === "") {
    const error = new Error("name is required");
    error.status = 400;
    throw error;
  }

  const maxId = categories.reduce(
    (max, category) => Math.max(max, category.id),
    0,
  );

  const newCategory = {
    id: maxId + 1,
    name: name.trim(),
    note: categoryData.note ?? "",
  };

  categories.push(newCategory);
  await writeData(categories);

  if (bus) {
    bus.emit("created", {
      resource: "categories",
      id: newCategory.id,
    });
  }

  return newCategory;
}

async function update(id, categoryData, bus) {
  const categories = await readData();
  const index = categories.findIndex((category) => category.id === Number(id));

  if (index === -1) {
    const error = new Error("Category not found");
    error.status = 404;
    throw error;
  }

  const name = categoryData?.name;
  if (typeof name !== "string" || name.trim() === "") {
    const error = new Error("name is required");
    error.status = 400;
    throw error;
  }

  categories[index] = {
    ...categories[index],
    name: name.trim(),
    note: categoryData.note ?? "",
  };

  await writeData(categories);

  if (bus) {
    bus.emit("updated", {
      resource: "categories",
      id: Number(id),
    });
  }

  return categories[index];
}

async function remove(id, bus) {
  const categories = await readData();
  const index = categories.findIndex((category) => category.id === Number(id));

  if (index === -1) {
    const error = new Error("Category not found");
    error.status = 404;
    throw error;
  }

  categories.splice(index, 1);
  await writeData(categories);

  if (bus) {
    bus.emit("deleted", {
      resource: "categories",
      id: Number(id),
    });
  }

  return {
    deleted: Number(id),
  };
}

async function getRequestBody(req) {
  if (req.body) return req.body;
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
  if (!body) return {};
  
  try {
    return JSON.parse(body);
  } catch (err) {
    const error = new Error("Invalid JSON in request body");
    error.status = 400;
    throw error;
  }
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

    case "POST": {
      if (id) {
        const error = new Error("Cannot POST to a specific resource ID");
        error.status = 400;
        throw error;
      }
      const categoryData = await getRequestBody(req);
      const newCategory = await create(categoryData, bus);
      return sendJSON(res, 201, newCategory);
    }

    case "PUT": {
      if (!id) {
        const error = new Error("Category ID required for update");
        error.status = 400;
        throw error;
      }
      const categoryData = await getRequestBody(req);
      const updatedCategory = await update(id, categoryData, bus);
      return sendJSON(res, 200, updatedCategory);
    }

    case "DELETE": {
      if (!id) {
        const error = new Error("Category ID required for deletion");
        error.status = 400;
        throw error;
      }
      const result = await remove(id, bus);
      return sendJSON(res, 200, result);
    }

    default: {
      const error = new Error("Method Not Allowed");
      error.status = 405;
      throw error;
    }
  }
}

module.exports = handleRequest;
