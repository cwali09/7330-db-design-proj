const express = require('express');
const router = express.Router();
const db = require('../db');

// --- Querying Routes ---

// GET /api/posts/query - Find posts based on criteria
router.get('/query', async (req, res, next) => {
  const { socialMedia, startDate, endDate, username, firstName, lastName } = req.query;

  try {
    // TODO: Implement logic to:
    // 1. Build a dynamic SQL query based on the provided query parameters.
    //    - Use parameterized queries to prevent SQL injection!
    // 2. Handle date range filtering.
    // 3. Handle username/socialMedia filtering (requires join with USER_ACCOUNT).
    // 4. Handle firstName/lastName filtering (requires join with USER_ACCOUNT).
    // 5. Join with PROJECT_POST and PROJECT to get associated project names.
    // 6. Format the results as specified: text, poster (SM/User), time, associated projects.

    console.log('Querying posts with criteria:', req.query);

    // Placeholder response - Replace with actual DB query results
    const mockResults = [
      {
        text: 'This is a sample post content.',
        poster: { socialMedia: socialMedia || 'Facebook', username: username || 'user123' },
        time: new Date().toISOString(),
        associatedProjects: ['Project Alpha', 'Project Beta']
      }
    ];
    res.status(200).json(mockResults);

  } catch (err) {
    console.error("Error querying posts:", err);
    next(err);
  }
});

// POST /api/posts - Create a new post (Corrected for USER_ACCOUNT)
router.post('/', async (req, res, next) => {
    // Expect social_media_name and username instead of author_id
    const { social_media_name, username, content, post_date } = req.body;

    // Basic validation
    if (!social_media_name || !username || !content || !post_date) {
        return res.status(400).json({ message: 'Missing required post fields (social_media_name, username, content, post_date)' });
    }
    if (username.length > 40) {
        return res.status(400).json({ message: 'Username exceeds maximum length of 40 characters.' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        // Check if the USER_ACCOUNT exists
        const [users] = await connection.query(
            'SELECT 1 FROM USER_ACCOUNT WHERE social_media_name = ? AND username = ?',
            [social_media_name, username]
        );
        if (users.length === 0) {
            connection.release();
            // Note: The schema doesn't explicitly forbid creating posts for non-existent users,
            // but it's generally good practice to require the user account first.
            // Depending on requirements, you might auto-create the USER_ACCOUNT here,
            // or return an error like below.
            return res.status(400).json({ message: `User account '${username}' on platform '${social_media_name}' does not exist. Please create the user account first.` });
            // If auto-creation is desired:
            // await connection.query('INSERT IGNORE INTO USER_ACCOUNT (social_media_name, username) VALUES (?, ?)', [social_media_name, username]);
        }

        // Insert the new post, linking to USER_ACCOUNT
        const [result] = await connection.query(
            'INSERT INTO POST (social_media_name, username, content, post_time) VALUES (?, ?, ?, ?)',
            [social_media_name, username, content, post_date]
        );

        const newPostId = result.insertId; // Get the ID of the newly inserted post

        console.log(`Post created successfully with ID: ${newPostId} by ${username} on ${social_media_name}`);
        res.status(201).json({
            message: 'Post created successfully',
            data: {
                post_id: newPostId, // Return the new post ID
                social_media_name,
                username,
                content,
                post_date
            }
        });

    } catch (err) {
        console.error("Error creating post:", err);
        // Handle potential foreign key constraint errors if the platform doesn't exist
        if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.message.includes('fk_post_user')) {
             // This error message assumes the FK constraint is named fk_post_user
             return res.status(400).json({ message: `User account '${username}' on platform '${social_media_name}' does not exist or platform '${social_media_name}' is invalid.` });
        }
         if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.message.includes('fk_post_platform')) {
             // This error message assumes the FK constraint is named fk_post_platform
             return res.status(400).json({ message: `Social media platform '${social_media_name}' does not exist.` });
        }
        next(err); // Pass other errors to the global error handler
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
        }
    }
});

// TODO: Add routes for entering new posts/users if needed, although
// the instructions focus on analyzing existing posts within projects.

module.exports = router; 