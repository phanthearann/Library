const fs = require("fs").promises;
const path = require("path");
const { sendJSON } = require("../lib/send");

const filePath = path.join(__dirname, "..", "Data", "members.json");

async function readData() {
  try {
    const data = await fs.readFile(filePath, "utf8");
    if (!data.trim()) {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, "[]");
      return [];
    }
    throw error;
  }
}

async function writeData(data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
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

  const maxId = members.reduce(
    (max, member) => Math.max(max, Number(member.id) || 0),
    0
  );

  const newMember = {
    id: memberData.id ? Number(memberData.id) : maxId + 1,
    name: name.trim(),
    phone: memberData.phone ?? "",
    date: memberData.date ?? new Date().toISOString().split("T")[0],
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
    phone: memberData.phone ?? members[index].phone ?? "",
    date: memberData.date ?? members[index].date ?? "",
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

// Read request body
async function readBody(req) {
  let body = "";

  for await (const chunk of req) {
    body += chunk;
  }

  if (!body.trim()) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Invalid JSON body");
    error.status = 400;
    throw error;
  }
}

// =====================================
// ROUTE HANDLER (GET, POST, PUT, DELETE)
// =====================================
async function handleMembers(req, res, pathname, method) {
  const segments = pathname.split("/").filter(Boolean);

  // 1. GET /members (Get all)
  if (segments.length === 1 && method === "GET") {
    return sendJSON(res, 200, await getAll());
  }

  // 2. GET /members/:id (Get one by ID)
  if (segments.length === 2 && method === "GET") {
    const member = await findById(segments[1]);

    if (!member) {
      return sendJSON(res, 404, {
        error: "Member not found",
      });
    }

    return sendJSON(res, 200, member);
  }

  // 3. POST /members (Create member)
  if (segments.length === 1 && method === "POST") {
    const body = await readBody(req);
    const newMember = await create(body);

    return sendJSON(res, 201, newMember);
  }

  // 4. PUT /members/:id OR PUT /members (Update member)
  if (method === "PUT" || method === "PATCH") {
    const body = await readBody(req);
    const id = segments[1] ?? body.id;

    if (!id) {
      return sendJSON(res, 400, {
        error: "id is required in URL (/members/1) or JSON body",
      });
    }

    const updatedMember = await update(id, body);
    return sendJSON(res, 200, updatedMember);
  }

  // 5. DELETE /members/:id OR DELETE /members (Delete member)
  if (method === "DELETE") {
    const body = await readBody(req);
    const id = segments[1] ?? body.id;

    if (!id) {
      return sendJSON(res, 400, {
        error: "id is required in URL (/members/1) or JSON body",
      });
    }

    const result = await remove(id);
    return sendJSON(res, 200, result);
  }

  return sendJSON(res, 405, {
    error: "Method Not Allowed",
  });
}

module.exports = handleMembers;

module.exports.getAll = getAll;
module.exports.findById = findById;
module.exports.create = create;
module.exports.update = update;
module.exports.remove = remove;