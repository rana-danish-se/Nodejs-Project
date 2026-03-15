const fs = require("fs");
const eventBus = require("./eventBus.js");
const { generateID, DATA_PATH } = require("./utils.js");

const VALID_STATUSES = ["PENDING", "COMPLETED", "IN-PROGRESS"];

async function readTasks() {
  try {
    const data = await fs.promises.readFile(DATA_PATH, "utf8");
    if (!data?.trim()) return [];
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw new Error(`Failed to read tasks file: ${err.message}`);
  }
}

async function writeTasks(tasks) {
  try {
    await fs.promises.writeFile(
      DATA_PATH,
      JSON.stringify(tasks, null, 2),
      "utf8",
    );
  } catch (err) {
    throw new Error(`Failed to write tasks file: ${err.message}`);
  }
}

async function getAllTasks(statusFilter = null) {
  const tasks = await readTasks();
  if (statusFilter) {
    if (!VALID_STATUSES.includes(statusFilter)) {
      throw new Error(
        `Invalid status filter. Must be one of: ${VALID_STATUSES.join(", ")}`,
      );
    } else {
      return tasks.filter((task) => task.status === statusFilter);
    }
  }
  return tasks;
}

async function getTaskByID(id) {
  let tasks = await readTasks();
  let task = tasks.find((task) => task._id === id);
  if (!task) {
    eventBus.emit("taskNotFound", id);
    return null;
  }

  return task;
}

async function createTask(data) {
  const { title, description } = data;

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new Error("title is required and must be a non-empty string");
  }
  const tasks = await readTasks();
  const newTask = {
    _id: generateID(),
    title: title.trim(),
    description: description ? description.trim() : "",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  await writeTasks(tasks);

  eventBus.emit("taskCreated", newTask);
  return newTask;
}

async function updateTask(id, data) {
  const tasks = await readTasks();
  const index = tasks.findIndex((task) => task._id === id);

  if (index === -1) {
    eventBus.emit("taskNotFound", id);
    return null;
  }

  const { title, description, status } = data;

  if (status && !VALID_STATUSES.includes(status)) {
    throw new Error(
      `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    );
  }
  const updatedTask = {
    ...tasks[index],
    title: title ? title.trim() : tasks[index].title,
    description: description ? description.trim() : tasks[index].description,
    status: status ? status : tasks[index].status,
    updatedAt: new Date().toISOString(),
  };
  tasks[index] = updatedTask;
  await writeTasks(tasks);
  eventBus.emit("taskUpdated", updatedTask);
  return updatedTask;
}

async function deleteTask(id) {
  const tasks = await readTasks();
  const index = tasks.findIndex((t) => t._id === id);

  if (index === -1) {
    eventBus.emit("taskNotFound", id);
    return false;
  }

  tasks.splice(index, 1);
  await writeTasks(tasks);

  eventBus.emit("taskDeleted", id);
  return true;
}

module.exports = {
  getAllTasks,
  getTaskByID,
  createTask,
  updateTask,
  deleteTask,
};
