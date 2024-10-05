// EMPLOYEE TRACKER : A cli application for managing an employee database

// *** Functional Index ***

// UI Design Functions :
//    1. 'cliIntroText' - Creates the intro design 
//    2. 'createDisplayTable' - Converts the list of objects to a cli table format. See : https://www.npmjs.com/package/table

// Retrieve Databases Ids (All functions get the element id based on a text input) :
//    1. 'getDepartmentId'
//    2. 'getTableId'

// Inquirer Prompt Clusters :
//    1. 'addDepartment' - Inserts a new department (string) based on user input. *No visible return output
//    2. 'addRole' - Adds role based on user responses. *No visible return output
//    3. 'addEmployee' - Creates a new employee from dynamic prompt lists generated from the database. *No visible return output
//    4. 'updateEmployeeRole' - Updates the employee role based on the current roles in the database. *No visible return output

// Dynamic Prompt Generators (All function creates and return a list of [ [roles] , [roles, id] ]) :
//    1. 'listDepartments' 
//    2. 'listRoles'
//    3. 'listManagers' 
//    4. 'listEmployees'

// Main Prompt Engine :
//    - Function to perform database operations
//    - Async functions use setTimeOut to effectively perform a loop until the user chooses 'Quit'

// Import statements using npm modules, external files main node modules
import { pool, connectToDb } from "./connection.js";
import { table, getBorderCharacters } from "table";
import { exit } from "node:process";

import fs from "node:fs";
import chalk from "chalk";
import boxen from "boxen";
import figlet from "figlet";
import inquirer from "inquirer";
import EventEmitter from "node:events";

// Allows multiple event listeners for the prompt loop
EventEmitter.setMaxListeners(20);

// Opens the database connection
await connectToDb();

// Creates the ASCII intro design
function cliIntroText(): void {
  console.log(
    boxen(
      chalk.whiteBright(
        figlet.textSync("Employee\nManager", {
          font: "Standard",
          horizontalLayout: "fitted",
          verticalLayout: "fitted",
        })
      ),
      { padding: 1, borderStyle: "classic" }
    )
  );
}

// Formats the display tables for the cli
function createDisplayTable(object: string[][]): [string[][], object] {
  const keys = [Object.keys(object[0])];
  for (const value of object) {
    keys.push(Object.values(value));
  }
  const config = {
    border: getBorderCharacters(`ramac`),
  };
  return [keys, config];
}

function getDepartmentId(
  department: string,
  department_list: string[][]
): string | string[] {
  for (const ele of department_list) {
    if (ele[1] === department) {
      return ele[0];
    }
  }
  return [];
}

function getTableId(
  manager: string,
  manager_list: string[][]
): null | string | string[] {
  for (const ele of manager_list) {
    if (ele[0] === manager) {
      return ele[1];
    }
  }
  return [];
}

async function addDepartment(): Promise<void> {
  await inquirer
    .prompt([
      {
        name: "add_department",
        type: "input",
        message: "What is the name of your department?",
      },
    ])
    .then((answers) => {
      if (!answers.add_department) {
        return;
      }
      fs.readFile("./db_queries/add_department.sql", "utf8", (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        pool.query(data, [answers.add_department], (err, _res) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log("\n");
        });
      });
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.error(error.isTtyError);
      } else {
        console.error(error);
      }
    });
}

async function addRole(): Promise<void> {
  const departmentList = await listDepartments();
  await inquirer
    .prompt([
      {
        name: "name",
        type: "input",
        message: "What is the name of your role?",
      },
      {
        name: "salary",
        type: "input",
        message: "What is the salary of the role?",
      },
      {
        name: "department",
        type: "list",
        message: "Which department does the role belong to?",
        choices: [...departmentList[0]],
      },
    ])
    .then((answers) => {
      if (!answers.name || !answers.salary || !answers.department) {
        return;
      }
      fs.readFile("./db_queries/add_role.sql", "utf8", (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        // Function to create the dynamic choices list
        const departmentId = getDepartmentId(
          answers.department,
          departmentList[1]
        );
        pool.query(
          data,
          [answers.name, answers.salary, departmentId],
          (err, _res) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log("\n");
            console.log("Role added successfully!");
          }
        );
      });
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.error(error.isTtyError);
      } else {
        console.error(error);
      }
    });
}

async function addEmployee(): Promise<void> {
  const roleList = await listRoles();
  const managerList = await listManagers();
  await inquirer
    .prompt([
      {
        name: "first_name",
        type: "input",
        message: "What is the employee's first name?",
      },
      {
        name: "last_name",
        type: "input",
        message: "What is the employee's last name?",
      },
      {
        name: "role",
        type: "list",
        message: "What is the employee's role?",
        choices: [...roleList[0]],
      },
      {
        name: "manager",
        type: "list",
        message: "Who is the employee's manager?",
        choices: [...managerList[0]],
      },
    ])
    .then((answers) => {
      if (
        !answers.first_name ||
        !answers.last_name ||
        !answers.role ||
        !answers.manager
      ) {
        return;
      }
      fs.readFile("./db_queries/add_employee.sql", "utf8", (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        // The 'getTableId' function creates a dynamic list
        const roleId = getTableId(answers.role, roleList[1]);
        const managerId = getTableId(answers.manager, managerList[1]);

        pool.query(
          data,
          [answers.first_name, answers.last_name, roleId, managerId],
          (err, _res) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log("\n");
            console.log("Employee added successfully!");
          }
        );
      });
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.error(error.isTtyError);
      } else {
        console.error(error);
      }
    });
}

async function updateEmployeeRole(): Promise<void> {
  const employeeList = await listEmployees();
  const roleList = await listRoles();
  await inquirer
    .prompt([
      {
        name: "employee",
        type: "list",
        message: "Which employee's role do you want to update?",
        choices: [...employeeList[0]],
      },
      {
        name: "role",
        type: "list",
        message: "Which role do you want to assign the selected employee?",
        choices: [...roleList[0]],
      },
    ])
    .then((answers) => {
      if (!answers.employee || !answers.role) {
        return;
      }
      fs.readFile(
        "./db_queries/update_employee_role.sql",
        "utf8",
        (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
           // The 'getTableId' function creates a dynamic list
          const employeeId = getTableId(answers.employee, employeeList[1]);
          const roleId = getTableId(answers.role, roleList[1]);

          pool.query(data, [roleId, employeeId], (err, _res) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log("\n");
            console.log("Employee role updated successfully!");
          });
        }
      );
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.error(error.isTtyError);
      } else {
        console.error(error);
      }
    });
}

async function listDepartments(): Promise<[string[], string[][]]> {
  let departmentList: string[][] = [];
  let updateDepartmentList: string[] = [];
  let updateDepartmentIdList: string[][] = [];
  try {
    let list = await pool.query("select * from department");
    let departmentNames = list.rows.map((department) => [
      department.id,
      department.name,
    ]);
    departmentList = departmentNames;
    departmentList.forEach((department: string[]) => {
      updateDepartmentList.push(department[1]);
      updateDepartmentIdList.push([department[0], department[1]]);
    });
  } catch (error) {
    console.error(error);
  }
  return [updateDepartmentList, updateDepartmentIdList];
}

async function listRoles(): Promise<[string[], string[][]]> {
  let roleList: string[][] = [];
  let updateRoleList: string[] = [];
  let updateRoleIdList: string[][] = [];
  try {
    let list = await pool.query("select * from role");
    let roleNames = list.rows.map((role) => [role.title, role.id]);
    roleList = roleNames;
    roleList.forEach((employee: string[]) => {
      updateRoleList.push(employee[0]);
      updateRoleIdList.push([employee[0], employee[1]]);
    });
  } catch (error) {
    console.error(error);
  }
  return [updateRoleList, updateRoleIdList];
}

async function listManagers(
  listManagers: Promise<[string[], string[][]]> = listEmployees()
): Promise<[string[], string[][]]> {
  const mlist = await listManagers;
  let managerList: string[] = mlist[0];
  let updateManagerList: any[][] = mlist[1];
  let noneResponse = "None";
  listManagers;
  managerList.push(noneResponse);
  updateManagerList.push([noneResponse, null]);
  return [managerList, updateManagerList];
}

async function listEmployees(): Promise<[string[], string[][]]> {
  let employeeList: string[][] = [];
  let updateEmployeeList: string[] = [];
  let updateEmployeeIdList: string[][] = [];
  try {
    let list = await pool.query("select * from employee");
    let employeeNames = list.rows.map((employee) => [
      employee.first_name,
      employee.last_name,
      employee.id,
    ]);
    employeeList = employeeNames;
    employeeList.forEach((employee: string[]) => {
      updateEmployeeList.push(employee[0] + " " + employee[1]);
      updateEmployeeIdList.push([employee[0] + " " + employee[1], employee[2]]);
    });
  } catch (error) {
    console.error(error);
  }
  return [updateEmployeeList, updateEmployeeIdList];
}

async function employeePromptQuestions(): Promise<void> {
  await inquirer
    .prompt([
      {
        name: "action",
        type: "list",
        message: "What would you like to do?",
        choices: [
          "View All Employees",
          "Add Employee",
          "Update Employee Role",
          "View All Roles",
          "Add Role",
          "View All Departments",
          "Add Department",
          "Quit",
        ],
      },
    ])
    .then(async (answers) => {
      if (answers.action === "Quit") {
        console.log("\n");
        exit();
      }
      if (answers.action === "View All Employees") {
        fs.readFile("./db_queries/all_employees.sql", "utf8", (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          pool.query(data, async (err, res) => {
            if (err) {
              console.error(err);
              return;
            }
            // Console logs the table
            console.log("\n");
            const data = createDisplayTable(res.rows);
            console.log(table(data[0], data[1]));
          });
        });
      }
      if (answers.action === "View All Departments") {
        fs.readFile("./db_queries/all_departments.sql", "utf8", (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          pool.query(data, async (err, res) => {
            if (err) {
              console.error(err);
              return;
            }
            // Console logs the table
            console.log("\n");
            const data = createDisplayTable(res.rows);
            console.log(table(data[0], data[1]));
          });
        });
      }
      if (answers.action === "View All Roles") {
        fs.readFile("./db_queries/all_roles.sql", "utf8", (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          pool.query(data, async (err, res) => {
            if (err) {
              console.error(err);
              return;
            }
             // Console logs the table
            console.log("\n");
            const data = createDisplayTable(res.rows);
            console.log(table(data[0], data[1]));
          });
        });
      }
      if (answers.action === "Add Department") {
        await addDepartment();
      }
      if (answers.action === "Add Employee") {
        await addEmployee();
      }
      if (answers.action === "Add Role") {
        await addRole();
      }
      if (answers.action === "Update Employee Role") {
        await updateEmployeeRole();
      }
      setTimeout(async () => {
        await employeePromptQuestions();
      }, 1000);
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.error(error.isTtyError);
      } else {
        console.error(error);
      }
    });
}
// Main init function
function init() {
  cliIntroText();
  employeePromptQuestions();
}

init();
