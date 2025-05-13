const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming db.js is in the parent directory

// GET /api/managers - Fetch all project managers
router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        console.log('Fetching all project managers');

        // Assuming PROJECT_MANAGER table has manager_id, first_name, last_name
        const [managers] = await connection.query('SELECT manager_id, first_name, last_name FROM PROJECT_MANAGER ORDER BY last_name, first_name');

        console.log(`Found ${managers.length} project managers.`);
        res.status(200).json(managers);

    } catch (err) {
        console.error("Error fetching project managers:", err);
        next(err); // Pass errors to the global error handler
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
        }
    }
});

// POST /api/managers - Create a new project manager
router.post('/', async (req, res, next) => {
    const { manager_id, first_name, last_name } = req.body;

    // Validation
    if (!manager_id || !first_name || !last_name) {
        return res.status(400).json({ message: 'Missing required fields: manager_id, first_name, last_name' });
    }
     if (manager_id.length > 50 || first_name.length > 50 || last_name.length > 50) {
         return res.status(400).json({ message: 'One or more fields exceed maximum length (50 characters).' });
     }

    let connection;
    try {
        connection = await db.getConnection();
        console.log(`Attempting to create project manager: ${manager_id} (${first_name} ${last_name})`);

        const sql = 'INSERT INTO PROJECT_MANAGER (manager_id, first_name, last_name) VALUES (?, ?, ?)';
        const [result] = await connection.query(sql, [manager_id, first_name, last_name]);

        console.log(`Project manager created successfully: ${manager_id}`);
        res.status(201).json({
            message: 'Project manager created successfully',
            data: { manager_id, first_name, last_name }
        });

    } catch (err) {
        console.error("Error creating project manager:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: `Project manager with ID '${manager_id}' already exists.` });
        }
        next(err);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Add other routes as needed (e.g., GET /:id, PUT /:id, DELETE /:id)

module.exports = router; 