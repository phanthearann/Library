
const fs = require("fs").promises;
const path = require("path");
const { sendJSON } = require("../lib/send");

// JSON file location
const filePath = path.join(__dirname, "..", "Data", "members.json");

// =====================================
// READ JSON DATA
// =====================================
async function readData() {
    try {
        const data = await fs.readFile(filePath, "utf8");

        if (!data.trim()) {
            return [];
        }

        return JSON.parse(data);

    } catch (error) {
        if (error.code === "ENOENT") {
            await fs.mkdir(path.dirname(filePath), {
                recursive: true
            });

            await fs.writeFile(filePath, "[]");
            return [];
        }

        throw error;
    }
}

// =====================================
// WRITE JSON DATA
// =====================================
async function writeData(data) {
    await fs.writeFile(
        filePath,
        JSON.stringify(data, null, 2)
    );
}

// =====================================
// READ REQUEST BODY
// =====================================
async function getBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk;

            if (body.length > 1024 * 1024) {
                reject(new Error("Request body too large"));
                req.destroy();
            }
        });

        req.on("end", () => {
            try {
                resolve(body.trim() ? JSON.parse(body) : {});
            } catch (error) {
                const err = new Error("Invalid JSON format");
                err.status = 400;
                reject(err);
            }
        });

        req.on("error", reject);
    });
}

// =====================================
// GET ALL MEMBERS
// =====================================
async function getAll() {
    return await readData();
}

// =====================================
// GET MEMBER BY ID
// =====================================
async function findById(id) {
    const members = await readData();

    return members.find(
        member => member.id === Number(id)
    ) || null;
}

// =====================================
// CREATE MEMBER
// =====================================
async function create(memberData) {
    const members = await readData();

    const name = memberData.name;

    if (typeof name !== "string" || !name.trim()) {
        const error = new Error("name is required");
        error.status = 400;
        throw error;
    }

    const maxId = members.reduce(
        (max, member) => Math.max(max, member.id),
        0
    );

    const newMember = {
        id: maxId + 1,
        name: name.trim(),
        phone: memberData.phone ?? ""
    };

    members.push(newMember);

    await writeData(members);

    return newMember;
}

// =====================================
// UPDATE MEMBER
// =====================================
async function update(id, memberData) {
    const members = await readData();

    const index = members.findIndex(
        member => member.id === Number(id)
    );

    if (index === -1) {
        const error = new Error("Member not found");
        error.status = 404;
        throw error;
    }

    if (
        typeof memberData.name !== "string" ||
        !memberData.name.trim()
    ) {
        const error = new Error("name is required");
        error.status = 400;
        throw error;
    }

    members[index] = {
        ...members[index],
        name: memberData.name.trim(),
        phone: memberData.phone ?? members[index].phone
    };

    await writeData(members);

    return members[index];
}

// =====================================
// DELETE MEMBER
// =====================================
async function remove(id) {
    const members = await readData();

    const index = members.findIndex(
        member => member.id === Number(id)
    );

    if (index === -1) {
        const error = new Error("Member not found");
        error.status = 404;
        throw error;
    }

    members.splice(index, 1);

    await writeData(members);

    return {
        deleted: Number(id)
    };
}

// =====================================
// MEMBERS ROUTE HANDLER
// =====================================
async function membersHandler(req, res, pathname, method) {

    try {
        const parts = pathname.split("/").filter(Boolean);
        const id = parts[1];

        // GET /members
        if (method === "GET" && !id) {
            const members = await getAll();

            return sendJSON(res, 200, members);
        }

        // GET /members/:id
        if (method === "GET" && id) {
            const member = await findById(id);

            if (!member) {
                return sendJSON(res, 404, {
                    error: "Member not found"
                });
            }

            return sendJSON(res, 200, member);
        }

        // POST /members
        if (method === "POST" && !id) {
            const body = await getBody(req);

            const newMember = await create(body);

            return sendJSON(res, 201, {
                message: "Member created successfully",
                data: newMember
            });
        }

        // PUT /members/:id
        if (method === "PUT" && id) {
            const body = await getBody(req);

            const updatedMember = await update(id, body);

            return sendJSON(res, 200, {
                message: "Member updated successfully",
                data: updatedMember
            });
        }

        // DELETE /members/:id
        if (method === "DELETE" && id) {
            const result = await remove(id);

            return sendJSON(res, 200, {
                message: "Member deleted successfully",
                data: result
            });
        }

        return sendJSON(res, 405, {
            error: "Method not allowed"
        });

    } catch (error) {
        console.error("Members Error:", error);

        return sendJSON(res, error.status || 500, {
            error: error.message || "Internal Server Error"
        });
    }
}

module.exports = membersHandler;
