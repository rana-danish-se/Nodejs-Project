const path = require("path");

function generateID() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function sendJSON(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    let body = "";

    req.on("data", function (chunk) {
      body += chunk.toString();
    });

    req.on("end", function () {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Request body contains invalid JSON"));
      }
    });

    req.on("error", function (err) {
      reject(err);
    });
  });
}

function extractId(url) {
  const parts = url.split("/");
  return parts[2] || null;
}

const DATA_PATH = path.join(__dirname, "..", "data", "tasks.json");

const LOG_PATH = path.join(__dirname, "..", "logs", "app.log");

module.exports = {
  generateID,
  sendJSON,
  readBody,
  extractId,
  DATA_PATH,
  LOG_PATH,
};
