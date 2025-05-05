const mysql = require('mysql2/promise');
require('dotenv').config(); // Load environment variables

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: 3311,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0
});

// Test the connection (optional)
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to the database.');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

module.exports = pool; // Export the pool for use in other files 