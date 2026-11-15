const fs=require("fs").promises;
const path=require("path");
const filePath=path.join(__dirname,"..","Data","books.json");

async function readData() {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(filePath, "[]");
      return [];
    }
    throw error;
  }
}

async function writeData(data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

//get all books
async function getAll() {
  return await readData();
}

async function findById(id) {
  const books = await readData();
  return books.find((book) => book.id === Number(id)) || null;
}
async function create(bookData, bus) {
  const books = await readData();

  const name = bookData.name;

  if (typeof name !== "string" || name.trim() === "") {
    const error = new Error("name is required");
    error.status = 400;
    throw error;
  }
  const maxId = books.reduce((max, book) => Math.max(max, book.id), 0);

  const newBook = {
    id: maxId + 1,
    name: name.trim(),
    note: typeof bookData?.note === "string" ? bookData.note.trim() : "",
  };

  books.push(newBook);

  await writeData(books);

  if (bus) {
    bus.emit("created", {
      resource: "books",
      id: newBook.id,
    });
  }

  return newBook;
}
async function remove(id, bus) {
  const books = await readData();

  const index = books.findIndex((book) => book.id === Number(id));

  if (index === -1) {
    const error = new Error("Book not found");
    error.status = 404;
    throw error;
  }

  books.splice(index, 1);

  await writeData(books);

  if (bus) {
    bus.emit("deleted", {
      resource: "books",
      id: Number(id),
    });
  }

  return {
    deleted: Number(id),
  };
}
async function update(id, bookData, bus) {
  const books = await readData();

  const index = books.findIndex((book) => book.id === Number(id));

  if (index === -1) {
    const error = new Error("Book not found");
    error.status = 404;
    throw error;
  }

  if (typeof bookData.name !== "string" || bookData.name.trim() === "") {
    const error = new Error("name is required");
    error.status = 400;
    throw error;
  }

  books[index] = {
    ...books[index],
    name: bookData.name.trim(),
    note: typeof bookData?.note === "string" ? bookData.note.trim() : books[index].note,
  };

  await writeData(books);

  if (bus) {
    bus.emit("updated", {
      resource: "books",
      id: Number(id),
    });
  }

  return books[index];
}
module.exports = {
  getAll,
  findById,
  create,
  remove,
  update
};