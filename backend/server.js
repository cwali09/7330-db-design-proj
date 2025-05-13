const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load .env variables
const db = require('./db'); // Assuming db setup is here or imported
const path = require('path'); // Often used for serving static files

const projectRoutes = require('./routes/projects');
const postRoutes = require('./routes/posts');
const experimentRoutes = require('./routes/experiments'); // Using 'experiments' for project queries
const userRoutes = require('./routes/users'); // <-- Import the new users router
const socialMediaRoutes = require('./routes/socialMedia'); // <-- Import the new social media router
const resultsRouter = require('./routes/results'); // Make sure this line exists and path is correct
const institutesRouter = require('./routes/institutes'); // <<<< CRITICAL: Ensure this line exists and is correct
const managersRouter = require('./routes/managers');
// const socialMediaPlatformsRouter = require('./routes/socialMediaPlatforms'); // Comment out import

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production if needed)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies (optional, but common)

// Logger middleware (simple example)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/experiments', experimentRoutes); // Route for experiment-related queries
app.use('/api/users', userRoutes); // <-- Mount the users router
app.use('/api/social-media', socialMediaRoutes); // <-- Mount the social media router
app.use('/api/results', resultsRouter); // <<< ENSURE THIS LINE IS PRESENT AND CORRECT
app.use('/api/institutes', institutesRouter); // <<<< CRITICAL: Ensure this line exists and is correct
app.use('/api/managers', managersRouter);
// app.use('/api/socialmediaplatforms', socialMediaPlatformsRouter); // Comment out mounting

// Optional: Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files from the React app
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    // The "catchall" handler: for any request that doesn't match one above,
    // send back React's index.html file.
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
}

// Basic root route
app.get('/', (req, res) => {
  res.send('Social Media Analyzer API is running!');
});

// Global error handler (basic example)
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    // Optionally include stack in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Backend server listening on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  try {
    // Test DB connection on startup
    const connection = await db.getConnection();
    console.log('Successfully connected to the database.');
    connection.release();
  } catch (err) {
    console.error('Failed to connect to the database:', err);
    // Optionally exit if DB connection fails
    // process.exit(1);
  }
});

module.exports = app; // Optional: for testing 