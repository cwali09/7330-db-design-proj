const express = require('express');
const router = express.Router();
const db = require('../db'); // Assuming db.js is in the parent directory

// Example GET route: Fetch all platforms
router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        console.log('Fetching all social media platforms');
        const [platforms] = await connection.query('SELECT name FROM SOCIAL_MEDIA_PLATFORM ORDER BY name');
        res.status(200).json(platforms);
    } catch (err) {
        console.error("Error fetching platforms:", err);
        res.status(500).json({ message: "Error fetching platforms", error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Example POST route: Create a new platform
router.post('/', async (req, res, next) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Platform name is required and must be a non-empty string.' });
    }
     if (name.length > 50) { // Assuming a max length
         return res.status(400).json({ message: 'Platform name exceeds maximum length of 50 characters.' });
     }

    let connection;
    try {
        connection = await db.getConnection();
        const sql = 'INSERT INTO SOCIAL_MEDIA_PLATFORM (name) VALUES (?)';
        await connection.query(sql, [name.trim()]);
        res.status(201).json({ message: 'Social media platform created successfully', data: { name: name.trim() } });
    } catch (err) {
        console.error("Error creating platform:", err);
         if (err.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: `Platform with name '${name.trim()}' already exists.` });
         }
        res.status(500).json({ message: "Error creating platform", error: err.message });
    } finally {
        if (connection) connection.release();
    }
});


module.exports = router; 