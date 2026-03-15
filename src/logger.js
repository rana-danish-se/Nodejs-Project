const fs = require("fs");
const eventBus = require("./eventBus.js");
const { LOG_PATH } = require("./utils.js");

function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level}] [${message}]\n`;

  fs.appendFile(LOG_PATH, entry, "utf-8", function (err, data) {
    if (err) console.error("Logger failed to write:", err.message);
  });
  console.log(entry.trim());
}

eventBus.on("serverStarted", function (port) {
  writeLog("INFO", `Server started on port ${port}`);
});

eventBus.on("taskCreated", function (task) {
  writeLog("INFO", `Task created — id: ${task._id} title: "${task.title}"`);
});

eventBus.on("taskUpdated", function (task) {
  writeLog("INFO", `Task updated — id: ${task._id} status: "${task.status}"`);
});

eventBus.on("taskDeleted", function (taskId) {
  writeLog("INFO", `Task deleted — id: ${taskId}`);
});

eventBus.on("taskNotFound", function (taskId) {
  writeLog("WARN", `Task not found — id: ${taskId}`);
});

eventBus.on("error", function (err) {
  writeLog("ERROR", err.message);
});

module.exports = { writeLog };
