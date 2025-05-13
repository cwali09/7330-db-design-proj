const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming db.js is in the parent directory

// GET /api/institutes - Fetch all institutes
router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        console.log('Fetching all institutes');

        // Explicitly select only needed columns: institute_id and name
        const [institutes] = await connection.query('SELECT institute_id, name FROM INSTITUTE ORDER BY name');

        console.log(`Found ${institutes.length} institutes.`);
        res.status(200).json(institutes);

    } catch (err) {
        console.error("Error fetching institutes from DB:", err);
        // Send a structured JSON error response
        res.status(500).json({ 
            message: "Error fetching institutes from database.", 
            error: err.message, 
            code: err.code 
        });
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
        }
    }
});

// POST /api/institutes - Create a new institute
router.post('/', async (req, res, next) => {
    const { name } = req.body; // Expecting { name: 'Institute Name' }

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Missing or invalid required field: name (must be a non-empty string)' });
    }
    if (name.length > 100) {
         return res.status(400).json({ message: 'Institute name exceeds maximum length of 100 characters.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction(); // Start transaction

        console.log(`Attempting to create institute: ${name}`);

        const sql = 'INSERT INTO INSTITUTE (name) VALUES (?)';
        const [result] = await connection.query(sql, [name.trim()]);
        const newInstituteId = result.insertId;

        await connection.commit(); // Commit transaction

        console.log(`Institute created successfully with ID: ${newInstituteId}, Name: ${name.trim()}`);
        // Respond with the created institute data including its ID
        res.status(201).json({ 
            message: 'Institute created successfully', 
            data: { 
                institute_id: newInstituteId, 
                name: name.trim() 
            } 
        });

    } catch (err) {
        if (connection) await connection.rollback(); // Rollback transaction on error
        console.error("Error creating institute:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            // Handle unique constraint violation (institute name already exists)
            return res.status(409).json({ message: `Institute with name '${name.trim()}' already exists.` });
        }
        // Send a structured JSON error response for other errors
        res.status(500).json({ 
            message: "Error creating institute in database.", 
            error: err.message,
            code: err.code
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Add other routes as needed (e.g., GET /:id, PUT /:id, DELETE /:id)
// Example: GET /api/institutes/:id
router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const [institute] = await connection.query('SELECT institute_id, name FROM INSTITUTE WHERE institute_id = ?', [id]);
        if (institute.length === 0) {
            return res.status(404).json({ message: `Institute with ID ${id} not found.` });
        }
        res.status(200).json(institute[0]);
    } catch (err) {
        console.error(`Error fetching institute with ID ${id}:`, err);
        res.status(500).json({
            message: `Error fetching institute with ID ${id}.`,
            error: err.message,
            code: err.code
        });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router; 