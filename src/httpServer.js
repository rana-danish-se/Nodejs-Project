const http = require("http");
const taskManager = require("./taskManager.js");
const eventBus = require("./eventBus.js");
const { sendJSON, readBody, extractId } = require("./utils");

require("./logger");

const PORT = 3000;

const server = http.createServer(async function (req, res) {
  const method = req.method;
  const url = req.url;

  console.log(`\n→ ${method} ${url}`);

  try {
    if (method === "GET" && url.startsWith("/tasks/status/")) {
      const status = url.split("/")[3];
      const tasks = await taskManager.getAllTasks(status);
      return sendJSON(res, 200, {
        success: true,
        count: tasks.length,
        data: tasks,
      });
    }

    if (method === "GET" && url === "/tasks") {
      const tasks = await taskManager.getAllTasks();
      return sendJSON(res, 200, {
        success: true,
        count: tasks.length,
        data: tasks,
      });
    }

    if (method === "GET" && url.startsWith("/tasks/")) {
      const id = extractId(url);
      const task = await taskManager.getTaskByID(id);

      if (!task) {
        return sendJSON(res, 404, {
          success: false,
          message: `Task with id ${id} not found`,
        });
      }

      return sendJSON(res, 200, { success: true, data: task });
    }

    if (method === "POST" && url === "/tasks") {
      const body = await readBody(req);
      const task = await taskManager.createTask(body);
      return sendJSON(res, 201, {
        success: true,
        message: "Task created successfully",
        data: task,
      });
    }

    if (method === "PUT" && url.startsWith("/tasks/")) {
      const id = extractId(url);
      const body = await readBody(req);
      const task = await taskManager.updateTask(id, body);

      if (!task) {
        return sendJSON(res, 404, {
          success: false,
          message: `Task with id ${id} not found`,
        });
      }

      return sendJSON(res, 200, {
        success: true,
        message: "Task updated successfully",
        data: task,
      });
    }

    if (method === "DELETE" && url.startsWith("/tasks/")) {
      const id = extractId(url);
      const deleted = await taskManager.deleteTask(id);

      if (!deleted) {
        return sendJSON(res, 404, {
          success: false,
          message: `Task with id ${id} not found`,
        });
      }

      return sendJSON(res, 204, null);
    }

    sendJSON(res, 404, {
      success: false,
      message: `Cannot ${method} ${url}`,
    });
  } catch (error) {
    eventBus.emit("error", error);

    sendJSON(res, 400, {
      success: false,
      message: error.message,
    });
  }
});

server.on("error", function (err) {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other process first.`,
    );
    process.exit(1);
  }
  eventBus.emit("error", err);
});

server.listen(PORT, function () {
  eventBus.emit("serverStarted", PORT);
});
