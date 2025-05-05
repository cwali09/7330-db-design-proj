const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load .env variables

const projectRoutes = require('./routes/projects');
const postRoutes = require('./routes/posts');
const experimentRoutes = require('./routes/experiments'); // Using 'experiments' for project queries

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production if needed)
app.use(express.json()); // Parse JSON request bodies

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/experiments', experimentRoutes); // Route for experiment-related queries

// Basic root route
app.get('/', (req, res) => {
  res.send('Social Media Analyzer API is running!');
});

// Global error handler (basic example)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
}); 