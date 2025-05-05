const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database pool

// POST /api/social-media - Create a new social media platform
router.post('/', async (req, res, next) => {
    const { name } = req.body;

    // --- Basic Validation ---
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Missing or invalid required field: name (must be a non-empty string)' });
    }
    if (name.length > 50) {
         return res.status(400).json({ message: 'Social media name exceeds maximum length of 50 characters.' });
    }

    const platformName = name.trim(); // Use trimmed name

    let connection;
    try {
        connection = await db.getConnection();

        // Insert the new platform name
        // The PRIMARY KEY constraint on `name` will automatically prevent duplicates
        const [result] = await connection.query(
            'INSERT INTO SOCIAL_MEDIA (name) VALUES (?)',
            [platformName]
        );

        console.log(`Social media platform created: ${platformName}`);
        res.status(201).json({
            message: 'Social media platform created successfully',
            data: {
                name: platformName
            }
        });

    } catch (err) {
        console.error("Error creating social media platform:", err);
        // Handle specific errors, like duplicate entry
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: `Social media platform '${platformName}' already exists.` }); // 409 Conflict
        }
        // Handle other potential errors (like connection issues)
        next(err); // Pass other errors to the global error handler
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
        }
    }
});

// Optional: GET route to list existing platforms
router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const [platforms] = await connection.query('SELECT name FROM SOCIAL_MEDIA ORDER BY name');
        res.status(200).json(platforms);
    } catch (err) {
        console.error("Error fetching social media platforms:", err);
        next(err);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


module.exports = router; 