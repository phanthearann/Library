const fs = require("fs").promises;
const path = require("path");

const books = require("./books");
const members = require("./members");

const filePath = path.join(__dirname, "..", "Data", "loans.json");

// Read loans.json
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

module.exports = {
  getAll,
  findById,
  create,
//   endLoan,
//   remove,
}