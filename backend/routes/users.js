const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database pool

// GET /api/users - Fetch a list of users, optionally filtered by platform
// Returns essential info like username and social_media_name
router.get('/', async (req, res, next) => {
    const { platform } = req.query; // Get optional platform query parameter
    let connection;

    // If no platform is specified in the query, return an empty list immediately.
    // The frontend should only call this with a platform selected.
    if (!platform) {
        console.log('[User Route] Fetching users: No platform specified, returning empty list.');
        return res.status(200).json([]);
    }

    try {
        connection = await db.getConnection();
        console.log(`[User Route] Attempting to fetch users for platform: '${platform}'`);

        const sql = `
            SELECT username, social_media_name
            FROM USER_ACCOUNT
            WHERE social_media_name = ?
            ORDER BY username
        `;
        console.log(`[User Route] Executing SQL: ${sql.trim()} with params: ['${platform}']`);
        const [users] = await connection.query(sql, [platform]);

        console.log(`[User Route] Found ${users.length} users for platform '${platform}'.`);
        res.status(200).json(users);

    } catch (err) {
        // Log more detailed error information
        console.error(`[User Route] Error fetching users list for platform '${platform}': Message: ${err.message}, Code: ${err.code}, Stack: ${err.stack}`);
        res.status(500).json({
            message: `Error fetching users list from database for platform ${platform}.`,
            error: err.message, // Send back the actual error message
            code: err.code,     // And error code if available
            details: "An internal server error occurred while trying to fetch users. Check server logs for more details."
        });
    } finally {
        if (connection) {
            console.log(`[User Route] Releasing database connection for platform: '${platform}'`);
            connection.release(); // Always release the connection
        }
    }
});

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
    if (typeof social_media_name !== 'string' || social_media_name.trim() === '' ||
        typeof username !== 'string' || username.trim() === '') {
        return res.status(400).json({ message: 'social_media_name and username must be non-empty strings' });
    }
    if (social_media_name.length > 50 || username.length > 50) {
        return res.status(400).json({ message: 'social_media_name or username exceeds maximum length of 50 characters.' });
    }
    if (age && (isNaN(parseInt(age)) || parseInt(age) < 0 || parseInt(age) > 150)) {
        return res.status(400).json({ message: 'Invalid age provided. Must be a number between 0 and 150.' });
    }
    if (typeof verified !== 'boolean' && verified !== undefined) { // Allow undefined if not provided
        return res.status(400).json({ message: 'verified field must be a boolean (true or false).' });
    }
    // Add more specific validations for other fields if necessary (e.g., length, format)
    // --- End Validation ---

    let connection;
    try {
        connection = await db.getConnection();
        console.log(`[User Route] Attempting to create user: ${username} on ${social_media_name}`);

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
            age ? parseInt(age) : null, // Ensure age is integer or null
            gender || null,
            verified === undefined ? false : verified // Default verified to false if not provided
        ];

        const [result] = await connection.query(sql, values);

        await connection.commit(); // Commit transaction

        console.log(`[User Route] User account created successfully: ${username} on ${social_media_name}`);
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
        console.error("[User Route] Error creating user account:", err.message, err.code, err.stack);
        if (connection) {
            await connection.rollback(); // Rollback on any other error
        }
        if (err.code === 'ER_DUP_ENTRY') {
            // Primary key violation (username, social_media_name)
            return res.status(409).json({ message: `User account '${username}' on platform '${social_media_name}' already exists.` });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            // Foreign key violation (social_media_name doesn't exist in SOCIAL_MEDIA_PLATFORM)
            return res.status(400).json({ message: `Social media platform '${social_media_name}' does not exist. Please create it first.` });
        }
        // Send a structured JSON error response for other errors
        res.status(500).json({
            message: "Error creating user account in database.",
            error: err.message,
            code: err.code
        });
        // Optionally pass to a global error handler if configured: next(err);
    } finally {
        if (connection) {
            console.log(`[User Route] Releasing database connection for user creation: ${username} on ${social_media_name}`);
            connection.release(); // Always release the connection
        }
    }
});

// TODO: Add routes for GET, PUT, DELETE users if needed later

module.exports = router; 