const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/posts/query - Find posts based on criteria by calling QueryPosts stored procedure
router.get('/query', async (req, res, next) => {
  // Extract query parameters, providing null if they are missing or empty strings
  const socialMedia = req.query.socialMedia || null;
  const startDate = req.query.startDate || null;
  const endDate = req.query.endDate || null;
  const username = req.query.username || null;
  const firstName = req.query.firstName || null;
  const lastName = req.query.lastName || null;

  let connection;
  try {
    connection = await db.getConnection();
    console.log('Calling QueryPosts procedure with criteria:', { socialMedia, startDate, endDate, username, firstName, lastName });

    // Construct the CALL statement with 7 placeholders
    const procedureCall = 'CALL QueryPosts(?, ?, ?, ?, ?, ?, ?)';
    const params = [socialMedia, startDate, endDate, username, socialMedia, firstName, lastName];

    // Execute the stored procedure
    // Stored procedures can return multiple result sets; the actual data is usually the first one.
    const [results] = await connection.query(procedureCall, params);

    // Assuming the procedure's main result set is the first element
    const posts = results && Array.isArray(results[0]) ? results[0] : [];

    console.log(`QueryPosts procedure returned ${posts.length} posts.`);
    res.status(200).json(posts); // Return the results directly from the procedure

  } catch (err) {
    console.error("Error calling QueryPosts procedure:", err);
    // Provide more specific error feedback if possible
    if (err.code === 'ER_SP_WRONG_NO_ARGS') {
         res.status(500).json({ message: `Internal Server Error: Stored procedure argument mismatch. Please contact support.` }); // More generic message to user
    } else {
        res.status(500).json({ message: `Error executing post query: ${err.message}` });
    }
    // next(err); // Or pass to global error handler
  } finally {
    if (connection) {
      connection.release(); // Always release the connection
    }
  }
});

// POST /api/posts - Create a new post (Auto-sets post_time)
router.post('/', async (req, res, next) => {
    // Destructure all expected fields from the request body
    const {
        social_media_name,
        username,
        content,
        city,          // New field
        state,         // New field
        country,       // New field
        likes,         // New field
        dislikes,      // New field
        has_multimedia // New field
    } = req.body;

    // --- Basic Validation ---
    if (!social_media_name || !username || content === undefined || content === null) {
        return res.status(400).json({ message: 'Missing required post fields (social_media_name, username, content)' });
    }
    if (username.length > 40) {
        return res.status(400).json({ message: 'Username exceeds maximum length of 40 characters.' });
    }
    // Optional: Add validation for new fields if needed (e.g., type checks, length checks beyond schema)
    const parsedLikes = likes !== undefined && likes !== null ? parseInt(likes, 10) : null;
    const parsedDislikes = dislikes !== undefined && dislikes !== null ? parseInt(dislikes, 10) : null;
    const parsedHasMultimedia = has_multimedia === true || has_multimedia === 'true' || has_multimedia === 1; // Handle boolean/string/number

    if (parsedLikes !== null && isNaN(parsedLikes)) {
        return res.status(400).json({ message: 'Invalid format for likes count.' });
    }
     if (parsedDislikes !== null && isNaN(parsedDislikes)) {
        return res.status(400).json({ message: 'Invalid format for dislikes count.' });
    }
    // Schema handles length constraints for city, state, country

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check if the USER_ACCOUNT exists
        const [users] = await connection.query(
            'SELECT 1 FROM USER_ACCOUNT WHERE social_media_name = ? AND username = ?',
            [social_media_name, username]
        );
        if (users.length === 0) {
            await connection.rollback();
            // Use 400 Bad Request as the user doesn't exist, which is a client error
            return res.status(400).json({ message: `User account '${username}' on platform '${social_media_name}' does not exist.` });
        }

        // Insert the new post, using NOW() for post_time and including new fields
        // Assuming database handles generated columns (content_hash, user_media_hash) correctly
        const insertSql = `
            INSERT INTO POST (
                social_media_name, username, content, post_time,
                city, state, country, likes, dislikes, has_multimedia
            )
            VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)
        `;

        // Values array now includes the new fields
        const [result] = await connection.query(insertSql, [
            social_media_name,
            username,
            content,
            city || null,       // Use null if empty/undefined
            state || null,      // Use null if empty/undefined
            country || null,    // Use null if empty/undefined
            parsedLikes,        // Use parsed integer or null
            parsedDislikes,     // Use parsed integer or null
            parsedHasMultimedia // Use parsed boolean
        ]);

        const newPostId = result.insertId;

        // Fetch the newly created post to return complete data
        // Include the new fields in the SELECT statement
        const [newPostRows] = await connection.query(
            `SELECT
                post_id, social_media_name, username, content, post_time,
                city, state, country, likes, dislikes, has_multimedia,
                content_hash, user_media_hash
             FROM POST WHERE post_id = ?`,
            [newPostId]
        );

        if (newPostRows.length === 0) {
            await connection.rollback();
            return res.status(500).json({ message: 'Failed to retrieve created post.' });
        }

        await connection.commit(); // Commit transaction

        const createdPost = newPostRows[0];

        // Convert has_multimedia back to boolean for consistent JSON response
        createdPost.has_multimedia = !!createdPost.has_multimedia;

        console.log(`Post created successfully with ID: ${createdPost.post_id} by ${createdPost.username} on ${createdPost.social_media_name} at ${createdPost.post_time}`);
        res.status(201).json({
            message: 'Post created successfully',
            data: createdPost // Return the full post data including new fields
        });

    } catch (err) {
        console.error("Error creating post:", err);
        if (connection) await connection.rollback();

        // Handle specific database errors (like FK constraints, data too long, etc.)
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            // Check which foreign key failed based on schema
             if (err.message.includes('FOREIGN KEY (`social_media_name`, `username`) REFERENCES `USER_ACCOUNT`')) {
                 return res.status(400).json({ message: `User account '${username}' on platform '${social_media_name}' does not exist.` });
             } else {
                 return res.status(400).json({ message: `Failed to create post due to missing related data: ${err.sqlMessage}` });
             }
        }
        if (err.code === 'ER_DATA_TOO_LONG') {
             return res.status(400).json({ message: `Data too long for a field: ${err.sqlMessage}` });
        }
         if (err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
             return res.status(400).json({ message: `Incorrect data type provided for a field: ${err.sqlMessage}` });
         }
         // Handle potential unique constraint violation on user_media_hash if it's active
         if (err.code === 'ER_DUP_ENTRY' && err.message.includes('user_media_hash')) {
             return res.status(409).json({ message: 'A post with the same user and social media platform already exists (based on hash).'});
         }


        next(err); // Pass other errors to the global error handler
    } finally {
        if (connection) connection.release();
    }
});

// GET /api/posts/by-user - Fetch posts for a specific user account
router.get('/by-user', async (req, res, next) => {
    const { socialMediaName, username } = req.query;

    // --- Validation ---
    if (!socialMediaName || !username) {
        return res.status(400).json({ message: 'Missing required query parameters: socialMediaName and username' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        // Query posts for the given user account, ordered by time descending
        // Select only necessary fields for the dropdown
        const sql = `
            SELECT post_id, content, post_time
            FROM POST
            WHERE social_media_name = ? AND username = ?
            ORDER BY post_time DESC
            LIMIT 100; -- Add a limit to prevent excessively large responses
        `;
        const params = [socialMediaName, username];

        const [posts] = await connection.query(sql, params);

        if (posts.length === 0) {
            console.log(`No posts found for user ${username} on ${socialMediaName}`);
            // It's not an error if no posts are found, just return an empty array
        } else {
            console.log(`Found ${posts.length} posts for user ${username} on ${socialMediaName}`);
        }

        res.status(200).json(posts); // Return the array of posts (can be empty)

    } catch (err) {
        console.error(`Error fetching posts for user ${username} on ${socialMediaName}:`, err);
        next(err); // Pass errors to the global error handler
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
        }
    }
});

// GET /api/posts/list - Get a simple list of all posts for dropdowns
router.get('/list', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        // Select ID and create a display text (e.g., "ID: 123 | User: abc | Content snippet")
        // Limit content length for brevity
        const [posts] = await connection.query(`
            SELECT
                post_id,
                CONCAT('ID: ', post_id, ' | User: ', username, ' | ', LEFT(content, 50), IF(LENGTH(content) > 50, '...', '')) AS displayText
            FROM POST
            ORDER BY post_id DESC
        `);
        res.status(200).json(posts);
    } catch (err) {
        // --- CHECK BACKEND LOGS FOR THIS ERROR ---
        console.error("Error fetching post list:", err);
        next(err); // This might result in a 500 Internal Server Error response
    } finally {
        if (connection) connection.release();
    }
});

// TODO: Add routes for entering new posts/users if needed, although
// the instructions focus on analyzing existing posts within projects.

module.exports = router; 