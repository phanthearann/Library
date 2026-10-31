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
}

module.exports = {
  getAll,
  findById,
  create,
//   endLoan,
//   remove,
}