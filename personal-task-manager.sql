DESCRIBE tasks;

ALTER TABLE tasks ADD COLUMN user_id INT NOT NULL;

SELECT * FROM tasks;

SELECT 
  MONTH(due_date) AS month,
  COUNT(*) AS task_count
FROM tasks
WHERE completed = 1 AND user_id = 1
GROUP BY MONTH(due_date);

INSERT INTO tasks (title, description, due_date, completed, priority, user_id)
VALUES 
('Task Jan', 'Task for January', '2024-01-15', 1, 'High', 1),
('Task Feb', 'Task for February', '2024-02-20', 1, 'Medium', 1),
('Task Mar', 'Task for March', '2024-03-10', 1, 'Low', 1),
('Task Apr', 'Task for April', '2024-04-05', 1, 'High', 1),
('Task May', 'Task for May', '2024-05-12', 1, 'Medium', 1),
('Task Jun', 'Task for June', '2024-06-18', 1, 'Low', 1),
('Task Jul', 'Task for July', '2024-07-25', 1, 'High', 1),
('Task Aug', 'Task for August', '2024-08-30', 1, 'Medium', 1),
('Task Sep', 'Task for September', '2024-09-12', 1, 'Low', 1),
('Task Oct', 'Task for October', '2024-10-10', 1, 'High', 1),
('Task Nov', 'Task for November', '2024-11-05', 1, 'Medium', 1),
('Task Dec', 'Task for December', '2024-12-20', 1, 'Low', 1);

SELECT 
    MONTH(due_date) AS month, 
    COUNT(*) AS task_count 
FROM tasks
WHERE completed = 1
GROUP BY MONTH(due_date);

INSERT INTO tasks (title, description, due_date, completed, priority)
VALUES 
('Completed Task', 'Task 1', '2024-01-01', 1, 'High'),
('Pending Task', 'Task 2', '2024-12-31', 0, 'Medium'),
('Overdue Task', 'Task 3', '2023-11-15', 0, 'Low');

INSERT INTO tasks (title, description, due_date, completed, priority, user_id)
VALUES 
('Completed Task', 'Task 1', '2024-01-01', 1, 'High', 1),
('Pending Task', 'Task 2', '2024-12-31', 0, 'Medium', 1),
('Overdue Task', 'Task 3', '2023-11-15', 0, 'Low', 1);

SELECT 
    m.month AS month, 
    COALESCE(t.task_count, 0) AS task_count
FROM (
    SELECT 1 AS month UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
    UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
    UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
) AS m
LEFT JOIN (
    SELECT 
        MONTH(due_date) AS month,
        COUNT(*) AS task_count
    FROM tasks
    WHERE completed = 1
    GROUP BY MONTH(due_date)
) AS t
ON m.month = t.month
ORDER BY m.month;

