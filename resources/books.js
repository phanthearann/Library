const fs=require("fs").promises;
const path=require("path");
const filePath=path.join(__dirname,"..","data","books.json");
const { sendJSON } = require("../lib/send");

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
// Read request body
async function readBody(req) {
    let body = "";

    for await (const chunk of req) {
        body += chunk;
    }

    return body ? JSON.parse(body) : {};
}

// ROUTE HANDLER
async function handleBooks(req, res, pathname, method) {
    const segments = pathname.split("/").filter(Boolean);

    // GET /books
    if (segments.length === 1 && method === "GET") {
        return sendJSON(res, 200, await getAll());
    }

    // GET /books/:id
    if (segments.length === 2 && method === "GET") {
        const book = await findById(segments[1]);

        if (!book) {
            return sendJSON(res, 404, {
                error: "Book not found"
            });
        }

        return sendJSON(res, 200, book);
    }

    // POST /books
    if (segments.length === 1 && method === "POST") {
        const body = await readBody(req);
        const newBook = await create(body);

        return sendJSON(res, 201, newBook);
    }

    // PUT /books/:id
    if (segments.length === 2 && method === "PUT") {
        const body = await readBody(req);
        const updatedBook = await update(segments[1], body);

        return sendJSON(res, 200, updatedBook);
    }

    // DELETE /books/:id
    if (segments.length === 2 && method === "DELETE") {
        const result = await remove(segments[1]);

        return sendJSON(res, 200, result);
    }

    return sendJSON(res, 405, {
        error: "Method Not Allowed"
    });
}

module.exports = handleBooks;

module.exports.getAll = getAll;
module.exports.findById = findById;
module.exports.create = create;
module.exports.remove = remove;
module.exports.update = update;