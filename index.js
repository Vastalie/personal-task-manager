require('dotenv').config({ path: './.env' });

console.log('Client ID:', process.env.SPOTIFY_CLIENT_ID);
console.log('Client Secret:', process.env.SPOTIFY_CLIENT_SECRET);

const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const session = require('express-session');
const path = require('path');
const { encrypt, decrypt } = require('./utils/crypto');
const { body, validationResult } = require('express-validator');
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();


// Main initialisation function
async function initialiseApp() {
  try {
    // Create the database connection
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'admin',
    
      password: 'Shaina071199',
      database: 'personal_task_manager',
    });


    console.log('Connected to Database');

console.log('SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID);
console.log('SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET);


    // Initialise Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

    // Log Spotify credentials status
    console.log('Checking Spotify credentials:', {
      hasClientId: !!process.env.SPOTIFY_CLIENT_ID, 
      hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET
    });

    // Initialise Spotify
    try {
      const data = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(data.body['access_token']);
      console.log('Spotify API connected');
      console.error('Spotify API connected successfully');
    
       // Set up token refresh
       setInterval(async () => {
        try {
          const newData = await spotifyApi.clientCredentialsGrant();
          spotifyApi.setAccessToken(newData.body['access_token']);
          console.log('Spotify token refreshed');
        } catch (refreshError) {
          console.error('Error refreshing Spotify token:', refreshError);
        }
      }, 3600000); // Refresh every hour
    } catch (spotifyError) {
      console.error('Detailed Spotify Error:', {
        message: spotifyError.message,
        statusCode: spotifyError?.statusCode,
        body: spotifyError?.body
      });
    }

    // Set up Express configuration
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    app.use(session({
      secret: 'your_secret_key',
      resave: false,
      saveUninitialized: true,
    }));

    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.urlencoded({ extended: true }));

    app.use((req, res, next) => {
      res.locals.taskManagerData = { appName: "Personal Task Manager" };
      next();
    });

    // Middleware to check if user is logged in
    function requireLogin(req, res, next) {
      if (!req.session.user) {
        return res.redirect('/login');
      }
      next();
    }

    // Root route with Spotify integration
    app.get('/', async (req, res) => {
      try {
        const playlistData = await spotifyApi.getPlaylist('4mIRypXv49j37pEJNuaZ46');
        res.render('index', { playlist: playlistData.body });
      } catch (err) {
        console.error('Error fetching Spotify playlist:', err);
        res.render('index', { playlist: null });
      }
    });

    // Spotify route
    app.get('/spotify', async (req, res) => {
      try {
        const playlistData = await spotifyApi.getPlaylist('4mIRypXv49j37pEJNuaZ46');
        res.render('spotify', { playlist: playlistData.body });
      } catch (err) {
        console.error('Error fetching Spotify data:', err);
        res.render('spotify', { playlist: null });
      }
    });

    // About route
    app.get('/about', (req, res) => {
      res.render('about');
    });

    // Dashboard route
    app.get('/dashboard', requireLogin, async (req, res) => {
      try {
        // Updated metrics query to correctly handle overdue tasks
        const [metricsRow] = await db.query(`
          SELECT 
            COUNT(*) AS total_tasks,
            SUM(completed = 1) AS completed_tasks,
            SUM(completed = 0 AND due_date > CURDATE()) AS pending_tasks,
            SUM(completed = 0 AND due_date <= CURDATE()) AS overdue_tasks
          FROM tasks
        `);
    
        const metrics = metricsRow[0];
    
        // Monthly data query remains the same
        const [monthlyRows] = await db.query(`
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
        `);
    
        const monthlyData = Array(12).fill(0);
        monthlyRows.forEach(row => {
          monthlyData[row.month - 1] = row.task_count;
        });
    
        res.render('dashboard', { metrics, monthlyData });
      } catch (err) {
        console.error('Error loading dashboard:', err.message);
        res.status(500).send('Internal Server Error');
      }
    });

    // Tasks routes
    app.get('/tasks', async (req, res) => {
      try {
        const [tasks] = await db.query(
          'SELECT id, title, encrypted_description, iv, due_date, completed, priority FROM tasks'
        );

        const formattedTasks = tasks.map((task) => {
          if (req.session && req.session.user) {
            return {
              ...task,
              decrypted_description: decrypt(task.encrypted_description, task.iv),
              status: task.completed ? 'Completed' : 'Pending',
            };
          }
          return {
            ...task,
            status: task.completed ? 'Completed' : 'Pending',
          };
        });

        res.render('tasks', { user: req.session.user, tasks: formattedTasks });
      } catch (err) {
        console.error('Error loading tasks:', err);
        res.status(500).send('Internal Server Error');
      }
    });

    // New task routes
    app.get('/tasks/new', (req, res) => {
      if (!req.session || !req.session.user) {
        return res.redirect('/login');
      }
      res.render('new-task');
    });

    app.get('/tasks', async (req, res) => {
      try {
        const [tasks] = await db.query(
          'SELECT id, title, encrypted_description, iv, due_date, completed, priority FROM tasks'
        );

        const formattedTasks = tasks.map((task) => {
          if (req.session && req.session.user) {
            return {
              ...task,
              decrypted_description: decrypt(task.encrypted_description, task.iv),
              status: task.completed ? 'Completed' : 'Pending',
            };
          }
          return {
            ...task,
            decrypted_description: null,
            encrypted_description: task.encrypted_description,
            status: task.completed ? 'Completed' : 'Pending',
          };
        });

        res.render('tasks', { user: req.session.user, tasks: formattedTasks });
      } catch (err) {
        console.error('Error loading tasks:', err);
        res.status(500).send('Internal Server Error');
      }
    });

    // Add new task
    app.post('/tasks/new', requireLogin, [
      body('title').notEmpty().withMessage('Task title is required'),
      body('description').notEmpty().withMessage('Task description is required'),
      body('due_date').optional().isDate().withMessage('Invalid date format'),
      body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High'])
        .withMessage('Priority must be Low, Medium, or High'),
    ], async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, due_date, priority } = req.body;
      const user_id = req.session.user.id;

      try {
        const { encryptedData, iv } = encrypt(description);

        await db.query(
          'INSERT INTO tasks (title, encrypted_description, iv, due_date, completed, priority, user_id) VALUES (?, ?, ?, ?, 0, ?, ?)',
          [title, encryptedData, iv, due_date || null, priority || 'Low', user_id]
        );

        res.redirect('/tasks');
      } catch (err) {
        console.error('Error adding task:', err);
        res.status(500).send('Error adding task');
      }
    });

    // Task status routes
    app.post('/tasks/:id/complete', requireLogin, async (req, res) => {
      try {
        const { id } = req.params;
        await db.query('UPDATE tasks SET completed = 1 WHERE id = ?', [id]);
        res.redirect('/tasks');
      } catch (err) {
        console.error('Error marking task as completed:', err);
        res.status(500).send('Internal Server Error');
      }
    });

    app.post('/tasks/:id/pending', requireLogin, async (req, res) => {
      try {
        const { id } = req.params;
        await db.query('UPDATE tasks SET completed = 0 WHERE id = ?', [id]);
        res.redirect('/tasks');
      } catch (err) {
        console.error('Error marking task as pending:', err);
        res.status(500).send('Error marking task as pending');
      }
    });

    app.post('/tasks/:id/delete', requireLogin, async (req, res) => {
      try {
        const { id } = req.params;
        await db.query('DELETE FROM tasks WHERE id = ?', [id]);
        res.redirect('/tasks');
      } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).send('Error deleting task');
      }
    });

    // Search route
    app.get('/search', requireLogin, async (req, res) => {
      const searchQuery = req.query.q || '';

      try {
        const [tasks] = await db.query('SELECT id, title, encrypted_description, iv, due_date, completed, priority FROM tasks');

        const results = tasks
          .map(task => ({
            ...task,
            decrypted_description: decrypt(task.encrypted_description, task.iv),
          }))
          .filter(task =>
            task.decrypted_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.title.toLowerCase().includes(searchQuery.toLowerCase())
          );

        res.render('search-results', { results, searchQuery });
      } catch (err) {
        console.error('Error performing search:', err);
        res.status(500).send('Error performing search');
      }
    });

    // User management routes
    app.get('/registered-users', async (req, res) => {
      try {
        const [results] = await db.query('SELECT username, email, created_at FROM users');
        res.render('registered-users', { users: results });
      } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Server error');
      }
    });

    // Register routes
    app.get('/register', (req, res) => {
      res.render('register', { errorMessage: null, registrationSuccess: false });
    });

    app.post('/register', [
      body('username').notEmpty().withMessage('Username is required'),
      body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
      body('email').isEmail().withMessage('Invalid email address'),
    ], async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render('register', {
          errorMessage: errors.array().map(err => err.msg).join(', '),
          registrationSuccess: false,
        });
      }

      const { username, password, email } = req.body;

      try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        await db.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [
          username,
          hashedPassword,
          email,
        ]);

        res.render('register', { errorMessage: null, registrationSuccess: true });
      } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).send('Error registering user');
      }
    });

    // Login routes
    app.get('/login', (req, res) => {
      res.render('login');
    });

    app.post('/login', [
      body('username').notEmpty().withMessage('Username is required'),
      body('password').notEmpty().withMessage('Password is required'),
    ], async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send(errors.array().map(err => err.msg).join(', '));
      }

      const { username, password } = req.body;

      try {
        const [results] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (results.length > 0 && bcrypt.compareSync(password, results[0].password)) {
          req.session.user = { id: results[0].id, username: results[0].username };
          res.redirect('/');
        } else {
          res.send('Invalid username or password');
        }
      } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Server error during login');
      }
    });

    // Logout route
    app.get('/logout', (req, res) => {
      req.session.destroy(err => {
        if (err) {
          console.error('Error during logout:', err);
          return res.status(500).send('Error during logout');
        }
        res.redirect('/');
      });
    });

    // Start the server
    const PORT = 8000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Error initialising app:', error);
  }
}

// Start the application
initialiseApp().catch(console.error);
