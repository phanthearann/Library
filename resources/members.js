const fs = require("fs").promises;
const path = require("path");
const { sendJSON } = require("../lib/send");

const filePath = path.join(__dirname, "..", "Data", "members.json");

async function readData() {
  try {
    const data = await fs.readFile(filePath, "utf8");
    if (!data.trim()) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT" || error instanceof SyntaxError) {
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

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        const error = new Error("Invalid JSON body");
        error.status = 400;
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function getAll() {
  return await readData();
}

async function findById(id) {
  const members = await readData();
  return members.find((m) => m.id === Number(id)) || null;
}

async function create(memberData, bus) {
  const members = await readData();
  const name = memberData.name;

  if (typeof name !== "string" || name.trim() === "") {
    const error = new Error("name is required");
    error.status = 400;
    throw error;
  }

  const maxId = members.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0);

  const newMember = {
    id: maxId + 1,
    name: name.trim(),
    phone: memberData.phone ?? "",
    date: memberData.date ?? new Date().toISOString().split("T")[0],
  };

  members.push(newMember);
  await writeData(members);

  if (bus && typeof bus.emit === "function") {
    bus.emit("created", { resource: "members", id: newMember.id });
  }

  return newMember;
}

async function update(id, memberData, bus) {
  const members = await readData();
  const index = members.findIndex((m) => m.id === Number(id));

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
    phone: memberData.phone ?? members[index].phone ?? "",
    date: memberData.date ?? members[index].date ?? "",
  };

  await writeData(members);

  if (bus && typeof bus.emit === "function") {
    bus.emit("updated", { resource: "members", id: Number(id) });
  }

  return members[index];
}

async function remove(id, bus) {
  const members = await readData();
  const index = members.findIndex((m) => m.id === Number(id));

  if (index === -1) {
    const error = new Error("Member not found");
    error.status = 404;
    throw error;
  }

  members.splice(index, 1);
  await writeData(members);

  if (bus && typeof bus.emit === "function") {
    bus.emit("deleted", { resource: "members", id: Number(id) });
  }

  return { deleted: Number(id) };
}

async function membersHandler(req, res, pathname, method) {
  const parts = pathname.split("/").filter(Boolean);
  const id = parts[1];

  if (parts.length === 1) {
    if (method === "GET") return sendJSON(res, 200, await getAll());
    if (method === "POST") {
      const body = await readBody(req);
      return sendJSON(res, 201, await create(body));
    }
    return sendJSON(res, 405, { error: "Method Not Allowed" });
  }

  if (parts.length === 2 && id) {
    if (method === "GET") {
      const member = await findById(id);
      if (!member) return sendJSON(res, 404, { error: "Member not found" });
      return sendJSON(res, 200, member);
    }
    if (method === "PUT" || method === "PATCH") {
      const body = await readBody(req);
      return sendJSON(res, 200, await update(id, body));
    }
    if (method === "DELETE") {
      return sendJSON(res, 200, await remove(id));
    }
    return sendJSON(res, 405, { error: "Method Not Allowed" });
  }

  return sendJSON(res, 404, { error: "Route not found" });
}

module.exports = Object.assign(membersHandler, {
  getAll,
  findById,
  create,
  update,
  remove,
});
