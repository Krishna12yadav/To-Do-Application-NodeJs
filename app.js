/*
 *  Created a Table with name todo in the todoApplication.db file using the CLI.
 */

const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log(
        "Connected to Database and Server Running at http://localhost:3000/"
      )
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//post todo ApI

app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status } = req.body;
  const postTodoQuery = `INSERT INTO
    todo (id,todo,priority,status)
    VALUES (${id},'${todo}','${priority}','${status}');`;
  await database.run(postTodoQuery);
  res.send("Todo Successfully Added");
});

//get todo API

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (req, res) => {
  let getTodosQuery = "";
  let data = "No data available!";
  const { status, priority, search_q = "" } = req.query;
  switch (true) {
    case hasPriorityAndStatusProperties(req.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(req.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(req.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }
  data = await database.all(getTodosQuery);
  res.send(data);
});

//get specific todo API

app.get("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const todoQuery = `
    SELECT 
    *
    FROM
    todo
    WHERE id=${todoId}; 
    `;
  const data = await database.get(todoQuery);
  res.send(data);
});

//Updating specific todo API

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//delete API

app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const delQuery = `
  DELETE 
   FROM 
   todo 
   WHERE 
   id=${todoId};`;
  await database.run(delQuery);
  res.send("Todo Deleted");
});

module.exports=app;
