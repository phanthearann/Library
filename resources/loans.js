const fs = require("fs").promises;
const path = require("path");

const books = require("./books");
const members = require("./members");

const { sendJSON } = require("../lib/send");

const filePath = path.join(__dirname, "..", "data", "loans.json");

// Read loans.json
async function readData() {
  try {
    const data = await fs.readFile(filePath, "utf8");
    if (!data.trim()) {
      await fs.writeFile(filePath, "[]");
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(filePath, "[]");
      return [];
    }

    throw error;
  }
}

// Write loans.json
async function writeData(data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// GET all loans
async function getAll() {
  return await readData();
}

// GET loan by ID
async function findById(id) {
  const loans = await readData();

  return loans.find((loan) => loan.id === Number(id)) || null;
}

// POST create loan
async function create(loanData, bus) {
  const loans = await readData();

  const { itemId, personId } = loanData;

   // Check itemId and personId are numbers
    if (typeof itemId !== "number" || typeof personId !== "number") {
      const error = new Error("itemId and personId must be numbers");
  
      error.status = 400;
      throw error;
    }
  
    // Check book exists
    const book = await books.findById(itemId);
  
    if (!book) {
      const error = new Error("ITEM not found");
      error.status = 400;
      throw error;
    }
  
    // Check member exists
    const member = await members.findById(personId);
  
    if (!member) {
      const error = new Error("PERSON not found");
      error.status = 400;
      throw error;
    }

    // Check active loan
  const activeLoan = loans.find(
    (loan) => loan.itemId === itemId && loan.endedAt === null,
  );

  if (activeLoan) {
    const error = new Error("This item already has an active loan");

    error.status = 409;
    throw error;
  }

  // Generate new ID
  const maxId = loans.reduce((max, loan) => Math.max(max, loan.id), 0);

  const newLoan = {
    id: maxId + 1,
    itemId: itemId,
    personId: personId,
    startedAt: loanData.startedAt || new Date().toISOString(),
    endedAt: null,
  };

  loans.push(newLoan);

  await writeData(loans);

  // Emit event
  if (bus) {
    bus.emit("created", {
      resource: "loans",
      id: newLoan.id,
    });
  }

  return newLoan;
}

// PUT / End loan
async function endLoan(id, bus) {
  const loans = await readData();

  const index = loans.findIndex((loan) => loan.id === Number(id));

  // Loan not found
  if (index === -1) {
    const error = new Error("Loan not found");
    error.status = 404;
    throw error;
  }

  // Already ended
  if (loans[index].endedAt !== null) {
    const error = new Error("Loan has already ended");

    error.status = 409;
    throw error;
  }

  // End current loan
  loans[index].endedAt = new Date().toISOString();

  await writeData(loans);

  // Emit updated event
  if (bus) {
    bus.emit("updated", {
      resource: "loans",
      id: Number(id),
    });
  }

  return loans[index];
}

// DELETE loan
async function remove(id, bus) {
  const loans = await readData();

  const index = loans.findIndex((loan) => loan.id === Number(id));

  if (index === -1) {
    const error = new Error("Loan not found");
    error.status = 404;
    throw error;
  }

  loans.splice(index, 1);

  await writeData(loans);

  // Emit deleted event
  if (bus) {
    bus.emit("deleted", {
      resource: "loans",
      id: Number(id),
    });
  }

  return {
    deleted: Number(id),
  };
}

// Read request body
async function readBody(req) {
    let body = "";

    for await (const chunk of req) {
        body += chunk;
    }

    return body ? JSON.parse(body) : {};
}

// Route Handler
async function handleLoans(req, res, pathname, method) {
  const segments = pathname.split("/").filter(Boolean);

  // GET /loans
  if (segments.length === 1 && method === "GET") {
      return sendJSON(res, 200, await getAll());
  }

  // GET /loans/:id
  if (segments.length === 2 && method === "GET") {
      const loan = await findById(segments[1]);

      if (!loan) {
          return sendJSON(res, 404, {
              error: "Loan not found"
          });
      }

      return sendJSON(res, 200, loan);
  }

  // POST /loans
  if (segments.length === 1 && method === "POST") {
      const body = await readBody(req);

      const newLoan = await create(body);

      return sendJSON(res, 201, newLoan);
  }

  // PUT /loans/:id/end
  if (
      segments.length === 3 &&
      segments[2] === "end" &&
      method === "PUT"
  ) {
      const updatedLoan = await endLoan(segments[1]);

      return sendJSON(res, 200, updatedLoan);
  }

  // DELETE /loans/:id
  if (segments.length === 2 && method === "DELETE") {
      const result = await remove(segments[1]);

      return sendJSON(res, 200, result);
  }

  // Unsupported route or method
  return sendJSON(res, 405, {
      error: "Method Not Allowed"
  });
}

// Export route handler
module.exports = handleLoans;

module.exports.getAll = getAll;
module.exports.findById = findById;
module.exports.create = create;
module.exports.endLoan = endLoan;
module.exports.remove = remove;