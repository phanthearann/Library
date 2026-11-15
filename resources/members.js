const fs = require("fs").promises;
const path = require("path");

const filePath = path.join(__dirname, "..", "Data", "members.json");

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

// GET all members
async function getAll() {
  return await readData();
}

// GET member by ID
async function findById(id) {
  const members = await readData();

  return members.find((member) => member.id === Number(id)) || null;
}

// POST create member
async function create(memberData, bus) {
  const members = await readData();

  const name = memberData.name;

  if (typeof name !== "string" || name.trim() === "") {
    const error = new Error("name is required");
    error.status = 400;
    throw error;
  }

  const maxId = members.reduce((max, member) => Math.max(max, member.id), 0);

  const newMember = {
    id: maxId + 1,
    name: name.trim(),
    phone: memberData.phone ?? "",
  };

  members.push(newMember);

  await writeData(members);

  if (bus) {
    bus.emit("created", {
      resource: "members",
      id: newMember.id,
    });
  }

  return newMember;
}

// PUT update member
async function update(id, memberData, bus) {
  const members = await readData();

  const index = members.findIndex((member) => member.id === Number(id));

  if (index === -1) {
    const error = new Error("Member not found");
    error.status = 404;
    throw error;
  }

  if (typeof memberData.name !== "string" || memberData.name.trim() === "") {
    const error = new Error("name is required");
    error.status = 400;
    throw error;
  }

  members[index] = {
    ...members[index],
    name: memberData.name.trim(),
    phone: memberData.phone ?? "",
  };

  await writeData(members);

  if (bus) {
    bus.emit("updated", {
      resource: "members",
      id: Number(id),
    });
  }

  return members[index];
}

// DELETE member
async function remove(id, bus) {
  const members = await readData();

  const index = members.findIndex((member) => member.id === Number(id));

  if (index === -1) {
    const error = new Error("Member not found");
    error.status = 404;
    throw error;
  }

  members.splice(index, 1);

  await writeData(members);

  if (bus) {
    bus.emit("deleted", {
      resource: "members",
      id: Number(id),
    });
  }

  return {
    deleted: Number(id),
  };
}

module.exports = {
  getAll,
  findById,
  create,
  update,
  remove,
};
