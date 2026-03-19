# Personal Task Manager

A task management application built with Node.js, Express, and MySQL.   
This project provides a backend-driven system for creating, updating, retrieving, and deleting tasks, using structured API routes and a relational database.

## Overview

The Personal Task Manager was built to practise backend development, REST API design, and database integration. It allows users to manage tasks through a structured system that handles task creation, updates, retrieval, and deletion.

This project helped strengthen my understanding of:

- RESTful API design  
- Backend application structure  
- Database schema design  
- CRUD operations  
- Request handling and routing  
- Data persistence using MySQL  

## Features

- Create new tasks  
- View all tasks  
- Update existing tasks  
- Delete tasks  
- Store task data in a MySQL database  
- Structured API routes for task operations  
- Server-side handling of task logic and database interaction  

## Tech Stack

**Backend**
- Node.js  
- Express.js  

**Database**
- MySQL  

**Other Tools**
- SQL  
- Git  
- GitHub  

## Project Structure

```bash
personal-task-manager/
│── routes/
│── views/
│── public/
│── personal-task-manager.sql
│── app.js
│── package.json
│── README.md

How It Works

The application uses Express.js to define API routes and handle incoming requests.
When a user creates, updates, or deletes a task, the backend processes the request and interacts with the MySQL database to store or modify the relevant data.

The database schema is designed to support efficient storage and retrieval of task records.

API Functionality

GET /tasks — retrieve all tasks

POST /tasks — create a new task

PUT /tasks/:id — update a task

DELETE /tasks/:id — delete a task

Database

The project uses MySQL to store task data in a relational format.

Example task fields include:

task ID

title

description

status

due date

created date

Installation and Setup

1. Clone the repository
git clone https://github.com/YOUR-USERNAME/personal-task-manager.git
cd personal-task-manager

2. Install dependencies
npm install

3. Set up the MySQL database
Create a database and import the SQL file:
mysql -u root -p your_database_name < personal-task-manager.sql

4. Configure database connection
Update your database credentials in your project:
host: 'localhost',
user: 'root',
password: 'yourpassword',
database: 'your_database_name'

5. Start the application
npm start
or
node app.js


6. Open the application
http://localhost:3000

Example Use Cases

Managing daily personal tasks
Tracking completion status of tasks
Practising backend CRUD functionality
Learning how Express and MySQL work together in a full project

Key Learning Outcomes

Through this project, I improved my skills in:
building backend applications with Node.js and Express
designing RESTful routes
connecting applications to relational databases
structuring SQL-backed applications
debugging backend logic and database issues

Future Improvements

Planned improvements for this project include:
user authentication and authorisation
task filtering by status or date
improved input validation
deployment to a cloud platform
frontend improvements for better usability
unit and integration testing
