require('dotenv').config();
  //spotify console
console.log('Client ID:', process.env.SPOTIFY_CLIENT_ID);
console.log('Client Secret:', process.env.SPOTIFY_CLIENT_SECRET);

const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const session = require('express-session');
const path = require('path');
const { encrypt, decrypt } = require('./utils/crypto');

const app = express();
const PORT = 8000;

(async () => {
  // Create the database connection
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: 'Shaina071199', // Replace with your actual password
    database: 'personal_task_manager',
  });

  try {
    console.log('Connected to Database');
  } catch (error) {
    console.error('Error connecting to MySQL:', error);
    return;
  }

  // Set EJS as the templating engine and set the views directory
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Middleware for session management
  app.use(
    session({
      secret: 'your_secret_key',
      resave: false,
      saveUninitialized: true,
    })
  );

  // Serve static files from the "public" folder
  app.use(express.static(path.join(__dirname, 'public')));

  // Middleware to parse form data
  app.use(express.urlencoded({ extended: true }));

  // Middleware to make `taskManagerData` available globally in all views
  app.use((req, res, next) => {
    res.locals.taskManagerData = { appName: "Personal Task Manager" };
    next();
  });

  // Middleware to check if the user is logged in
  function requireLogin(req, res, next) {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    next();
  }

  // Root route (Task Manager page)
  app.get('/', async (req, res) => {
    try {
        // Fetch the playlist using Spotify API
        const playlistData = await spotifyApi.getPlaylist('4mIRypXv49j37pEJNuaZ46'); // Replace with your playlist ID
        res.render('index', { playlist: playlistData.body });
    } catch (err) {
        console.error('Error fetching Spotify playlist:', err);
        res.render('index', { playlist: null }); // Pass null if there is an error
    }
});
  
  app.get('/spotify', async (req, res) => {
    try {
      // Replace '4mIRypXv49j37pEJNuaZ46' with your actual playlist ID
      const playlistData = await spotifyApi.getPlaylist('4mIRypXv49j37pEJNuaZ46');
      res.render('spotify', { playlist: playlistData.body });
    } catch (err) {
      console.error('Error fetching Spotify data:', err);
      res.render('spotify', { playlist: null });
    }
  });  

  const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

 
  // Get an access token
  (async () => {
    try {
      const data = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(data.body['access_token']);
      console.log('Spotify API connected');
    } catch (err) {
      console.error('Error connecting to Spotify API:', err);
    }
  })();

(async () => {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);
        console.log('Spotify API connected');
    } catch (err) {
        console.error('Error connecting to Spotify API:', err);
    }
})();


app.get('/about', (req, res) => {
  res.render('about');
});

  // Dashboard Route
  app.get('/dashboard', requireLogin, async (req, res) => {
    try {
      const [metricsRow] = await db.query(`
        SELECT 
          COUNT(*) AS total_tasks,
          SUM(completed = 1) AS completed_tasks,
          SUM(completed = 0 AND due_date >= CURDATE()) AS pending_tasks,
          SUM(completed = 0 AND due_date < CURDATE()) AS overdue_tasks
        FROM tasks
      `);

      const metrics = metricsRow[0];

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
      console.error('Error loading dashboard:', err);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Route for viewing all tasks
  app.get('/tasks', async (req, res) => {
    try {
      // Fetch all tasks from the database
      const [tasks] = await db.query(
        'SELECT id, title, encrypted_description, iv, due_date, completed, priority FROM tasks'
      );
  
      // If user is logged in, decrypt task descriptions
      const formattedTasks = tasks.map((task) => {
        if (req.session && req.session.user) {
          return {
            ...task,
            decrypted_description: decrypt(task.encrypted_description, task.iv), // Decrypt for logged-in users
            status: task.completed ? 'Completed' : 'Pending',
          };
        }
        return {
          ...task,
          status: task.completed ? 'Completed' : 'Pending',
        };
      });
  
      // Render the tasks page with the tasks and user session
      res.render('tasks', { user: req.session.user, tasks: formattedTasks });
    } catch (err) {
      console.error('Error loading tasks:', err);
      res.status(500).send('Internal Server Error');
    }
  });
  
// Route to render the form for adding a new task
app.get('/tasks/new', requireLogin, (req, res) => {
  res.render('new-task', { errorMessage: null });
});

 // Route to handle form submission for adding a new task
 app.post('/tasks/new', requireLogin, async (req, res) => {
  const { title, description, due_date, priority } = req.body;
  const user_id = req.session.user.id; // Assuming you have user authentication set up

  if (!title || !description) {
    return res.status(400).send('Task title and description are required.');
  }

  try {
    // Encrypt the task description
    const { encryptedData, iv } = encrypt(description);

    // Ensure encryption was successful
    if (!encryptedData || !iv) {
      throw new Error('Encryption failed');
    }

    // Insert into the database
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

  // Mark task as completed
  app.post('/tasks/:id/complete', requireLogin, async (req, res) => {
    try {
      const { id } = req.params;
      await db.query('UPDATE tasks SET completed = 1 WHERE id = ?', [id]);
      res.redirect('/tasks');
    } catch (err) {
      console.error('Error marking task as completed:', err);
      res.status(500).send('Error marking task as completed');
    }
  });

  // Mark task as pending
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

  // Delete a task
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

  // Search Tasks
  app.get('/search', requireLogin, async (req, res) => {
    const searchQuery = req.query.q || '';

    try {
      let results = [];
      if (searchQuery) {
        const query = `
          SELECT id, title, encrypted_description, iv, due_date, completed, priority
          FROM tasks
          WHERE title LIKE ? OR encrypted_description LIKE ?
          ORDER BY FIELD(priority, "High", "Medium", "Low"), completed, title ASC
        `;
        const [tasks] = await db.query(query, [`%${searchQuery}%`, `%${searchQuery}%`]);

        results = tasks.map(task => ({
          ...task,
          description: decrypt(task.encrypted_description, task.iv),
        }));
      }

      res.render('search-results', { results, searchQuery });
    } catch (err) {
      console.error('Error performing search:', err);
      res.status(500).send('Error performing search');
    }
  });

  // Register Route
  app.get('/register', (req, res) => {
    res.render('register', { errorMessage: null, registrationSuccess: false });
  });

  app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.render('register', { errorMessage: 'All fields are required.', registrationSuccess: false });
    }

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

  // Login Route
  app.get('/login', (req, res) => {
    res.render('login');
  });

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
      const [results] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
      if (results.length > 0 && bcrypt.compareSync(password, results[0].password)) {
        req.session.user = { id: results[0].id, username: results[0].username };
        res.redirect('/tasks');
      } else {
        res.send('Invalid username or password');
      }
    } catch (err) {
      console.error('Error during login:', err);
      res.status(500).send('Server error during login');
    }
  });

  // Logout Route
  app.get('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Error during logout:', err);
        return res.status(500).send('Error during logout');
      }
      res.redirect('/tasks');
    });
  });

  // Start the server
  app.listen(8080, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:8080');
});
})();
