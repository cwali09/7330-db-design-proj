const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database pool

// POST /api/users - Create a new user account
router.post('/', async (req, res, next) => {
    const {
        social_media_name,
        username,
        first_name, // Optional fields from schema
        last_name,
        country_birth,
        country_residence,
        age,
        gender,
        verified
    } = req.body;

    // --- Basic Validation ---
    if (!social_media_name || !username) {
        return res.status(400).json({ message: 'Missing required fields: social_media_name and username' });
    }
    if (username.length > 40) {
        return res.status(400).json({ message: 'Username exceeds maximum length of 40 characters.' });
    }
    // Optional: Validate age if provided
    const parsedAge = age ? parseInt(age) : null;
    if (age && (isNaN(parsedAge) || parsedAge <= 0)) {
        return res.status(400).json({ message: 'Invalid age provided. Must be a positive number.' });
    }
    // Optional: Validate gender if provided (e.g., against a list)
    // Optional: Validate boolean format for verified

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction(); // Use transaction for checks and insert

        // 1. Check if the social_media_name exists in SOCIAL_MEDIA table
        const [platforms] = await connection.query(
            'SELECT 1 FROM SOCIAL_MEDIA WHERE name = ?',
            [social_media_name]
        );
        if (platforms.length === 0) {
            await connection.rollback(); // Rollback before sending response
            connection.release();
            return res.status(400).json({ message: `Social media platform '${social_media_name}' does not exist in the database.` });
        }

        // 2. Check if the user account already exists
        const [existingUsers] = await connection.query(
            'SELECT 1 FROM USER_ACCOUNT WHERE social_media_name = ? AND username = ?',
            [social_media_name, username]
        );
        if (existingUsers.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(409).json({ message: `User account '${username}' already exists on platform '${social_media_name}'.` }); // 409 Conflict
        }

        // 3. Insert the new user account
        const sql = `
            INSERT INTO USER_ACCOUNT
                (social_media_name, username, first_name, last_name, country_birth, country_residence, age, gender, verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            social_media_name,
            username,
            first_name || null, // Use null if optional fields are not provided
            last_name || null,
            country_birth || null,
            country_residence || null,
            parsedAge, // Already handles null case
            gender || null,
            verified === true || verified === 'true' || verified === 1 ? true : false // Handle boolean conversion
        ];

        const [result] = await connection.query(sql, values);

        await connection.commit(); // Commit transaction

        console.log(`User account created: ${username} on ${social_media_name}`);
        res.status(201).json({
            message: 'User account created successfully',
            data: { // Return the created data (excluding potentially sensitive info if needed)
                social_media_name,
                username,
                first_name,
                last_name,
                // ... include other fields as necessary
            }
        });

    } catch (err) {
        console.error("Error creating user account:", err);
        if (connection) {
            await connection.rollback(); // Rollback on any other error
        }
        // Specific error handling (like ER_NO_REFERENCED_ROW_2 for social_media_name FK is handled above)
        next(err); // Pass other errors to the global error handler
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
        }
    }
});

// TODO: Add routes for GET, PUT, DELETE users if needed later

module.exports = router; 