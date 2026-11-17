const fs = require("fs").promises;
const path = require("path");
const { sendJSON } = require("../lib/send");

const filePath = path.join(__dirname, "..", "Data", "books.json");

async function readData() {
  try {
    const data = await fs.readFile(filePath, "utf8");
    if (!data.trim()) return [];
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, "[]", "utf8");
      return [];
    }
    throw error;
  }
}

async function writeData(data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function getAll() {
  return await readData();
}

async function findById(id) {
  const books = await readData();
  return books.find((b) => b.id === Number(id)) || null;
}

async function create(bookData) {
  const books = await readData();
  const title = bookData.title;

  if (typeof title !== "string" || title.trim() === "") {
    const error = new Error("title is required");
    error.status = 400;
    throw error;
  }

  const maxId = books.reduce((max, b) => Math.max(max, Number(b.id) || 0), 0);

  const newBook = {
    id: maxId + 1,
    title: title.trim(),
    author: bookData.author ?? "",
    categoryId: bookData.categoryId ?? null,
    available: bookData.available ?? true,
  };

  books.push(newBook);
  await writeData(books);
  return newBook;
}

async function update(id, bookData) {
  const books = await readData();
  const index = books.findIndex((b) => b.id === Number(id));

  if (index === -1) {
    const error = new Error("Book not found");
    error.status = 404;
    throw error;
  }

  if (typeof bookData.title !== "string" || bookData.title.trim() === "") {
    const error = new Error("title is required");
    error.status = 400;
    throw error;
  }

  books[index] = {
    ...books[index],
    title: bookData.title.trim(),
    author: bookData.author ?? books[index].author,
    categoryId: bookData.categoryId ?? books[index].categoryId,
    available: bookData.available ?? books[index].available,
  };

  await writeData(books);
  return books[index];
}

async function remove(id) {
  const books = await readData();
  const index = books.findIndex((b) => b.id === Number(id));

  if (index === -1) {
    const error = new Error("Book not found");
    error.status = 404;
    throw error;
  }

  books.splice(index, 1);
  await writeData(books);
  return { deleted: Number(id) };
}

module.exports = {
  getAll,
  findById,
  create,
  update,
  remove,
};
