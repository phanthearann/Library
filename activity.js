const fs = require("fs");
const path = require("path");
const bus = require("./lib/events"); // Event Bus របស់គម្រោង

// ប្រើអក្សរតូច "data" ឱ្យត្រូវស្ដង់ដារជាមួយឯកសារផ្សេងទៀត
const dirPath = path.join(__dirname, "data");
const logFilePath = path.join(dirPath, "activity.log");

// ធានាថា Folder "data" មានស្រាប់ មុននឹងសរសេរ Log
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// មុខងារសម្រាប់សរសេរ Log ចូល file
function logActivity(action, details) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${action.toUpperCase()}: ${JSON.stringify(details)}\n`;

  // បន្ថែមទិន្នន័យต่อท้าย file ស្រាប់ (Append)
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) console.error("Failed to write activity log:", err);
  });
}

// ស្ដាប់ព្រឹត្តិការណ៍ (Events) ផ្សេងៗពី Bus
if (bus) {
  bus.on("created", (data) => logActivity("CREATED", data));
  bus.on("updated", (data) => logActivity("UPDATED", data));
  bus.on("deleted", (data) => logActivity("DELETED", data));
}

module.exports = { logActivity };