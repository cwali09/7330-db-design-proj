const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/reposts - Create a repost of an existing post
router.post('/', async (req, res, next) => {
    const { originalPostId } = req.body;

    // --- Validation ---
    if (!originalPostId || isNaN(parseInt(originalPostId, 10))) {
        return res.status(400).json({ message: 'Missing or invalid required field: originalPostId (must be a number)' });
    }

    const parsedOriginalPostId = parseInt(originalPostId, 10);
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Fetch the original post data
        const [originalPosts] = await connection.query(
            'SELECT * FROM POST WHERE post_id = ?',
            [parsedOriginalPostId]
        );

        if (originalPosts.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `Original post with ID ${parsedOriginalPostId} not found.` });
        }
        const originalPost = originalPosts[0];

        // 2. Create the new post (the repost) - copy relevant fields
        //    Using NOW() for the new post_time.
        //    Resetting likes/dislikes for the new post.
        const insertRepostSql = `
            INSERT INTO POST (
                social_media_name, username, content, post_time,
                city, state, country, likes, dislikes, has_multimedia
            )
            VALUES (?, ?, ?, NOW(), ?, ?, ?, 0, 0, ?)
        `;
        const insertParams = [
            originalPost.social_media_name,
            originalPost.username,
            originalPost.content, // Copy original content
            originalPost.city,
            originalPost.state,
            originalPost.country,
            originalPost.has_multimedia
        ];

        const [insertResult] = await connection.query(insertRepostSql, insertParams);
        const newRepostPostId = insertResult.insertId;

        if (!newRepostPostId) {
             await connection.rollback();
             throw new Error('Failed to get insertId for the new repost post.');
        }

        // 3. Create the link in the REPOST table
        const insertLinkSql = `
            INSERT INTO REPOST (original_post_id, repost_post_id)
            VALUES (?, ?)
        `;
        await connection.query(insertLinkSql, [parsedOriginalPostId, newRepostPostId]);

        // 4. Fetch the newly created repost post to return
         const [newPostRows] = await connection.query(
            `SELECT * FROM POST WHERE post_id = ?`,
            [newRepostPostId]
        );

        await connection.commit(); // Commit transaction

        const createdRepostPost = newPostRows[0];
         // Convert has_multimedia back to boolean for consistent JSON response
        createdRepostPost.has_multimedia = !!createdRepostPost.has_multimedia;


        console.log(`Repost created successfully. Original ID: ${parsedOriginalPostId}, Repost ID: ${newRepostPostId}`);
        res.status(201).json({
            message: 'Repost created successfully',
            data: createdRepostPost // Return the newly created repost post data
        });

    } catch (err) {
        console.error("Error creating repost:", err);
        if (connection) await connection.rollback();

        // Handle specific errors
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(404).json({ message: `Original post with ID ${parsedOriginalPostId} not found.` });
        }
         if (err.code === 'ER_DUP_ENTRY' && err.message.includes('PRIMARY')) {
             // This specific repost link already exists (should be rare with auto-increment IDs)
             return res.status(409).json({ message: 'This exact repost relationship already exists.' });
         }
        // Handle other potential errors (like connection issues, other constraints)
        next(err); // Pass other errors to the global error handler
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
        }
    }
});

module.exports = router; 