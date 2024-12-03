-- Create the database if it doesn’t exist
CREATE DATABASE IF NOT EXISTS personal_task_manager;

-- Use the database
USE personal_task_manager;

-- Create the 'users' table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the 'tasks' table with a foreign key constraint on user_id
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,  -- Enforce NOT NULL for foreign key consistency
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert a test user with a hashed password
-- The hashed password corresponds to 'testpassword' for testing purposes
REPLACE INTO users (username, password, email) 
VALUES ('testuser', '$2a$10$3jYvTo1DtvOY2ljmr2ft7O7BJ4v1w1xUR4RfFgDZemNz/hRtEzz56', 'testuser@example.com');


-- Insert sample tasks for the test user (user_id = 1)
INSERT INTO tasks (user_id, title, description, due_date) VALUES
(1, 'Complete Project', 'Finish the portfolio project assignment', '2024-12-15'),
(1, 'Study for Exam', 'Review modules and prepare notes', '2024-11-10');
