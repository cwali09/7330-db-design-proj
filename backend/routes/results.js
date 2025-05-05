const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/results - Add a new analysis result
router.post('/', async (req, res, next) => {
    // Destructure directly from req.body - this should now work
    const { projectName, postId, fieldName, value } = req.body;

    // --- Validation ---
    if (!projectName || postId === undefined || !fieldName || value === undefined) {
        return res.status(400).json({ message: 'Missing required fields: projectName, postId, fieldName, value' });
    }
    const parsedPostId = parseInt(postId, 10);
    if (isNaN(parsedPostId)) {
        return res.status(400).json({ message: 'Invalid Post ID provided.' });
    }
    // Add other validation as needed (lengths, types, etc.)

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Find project_id from projectName
        const [projects] = await connection.query('SELECT project_id FROM PROJECT WHERE name = ?', [projectName]);
        if (projects.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `Project '${projectName}' not found.` });
        }
        const projectId = projects[0].project_id;

        // 2. Find project_field_id from project_id and fieldName
        const [fields] = await connection.query(
            'SELECT project_field_id FROM PROJECT_FIELD WHERE project_id = ? AND field_name = ?',
            [projectId, fieldName]
        );
        if (fields.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: `Field '${fieldName}' is not defined for project '${projectName}'.` });
        }
        const projectFieldId = fields[0].project_field_id;

        // 3. Find project_post_id from project_id and post_id
        const [projectPosts] = await connection.query(
            'SELECT project_post_id FROM PROJECT_POST WHERE project_id = ? AND post_id = ?',
            [projectId, parsedPostId]
        );
        if (projectPosts.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: `Post ID ${parsedPostId} is not associated with project '${projectName}'.` });
        }
        const projectPostId = projectPosts[0].project_post_id;


        // 4. Insert or update into ANALYSIS_RESULT table
        // ON DUPLICATE KEY UPDATE handles cases where a result for this post/project/field already exists
        const sql = `
            INSERT INTO ANALYSIS_RESULT (project_post_id, project_field_id, value)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE value = VALUES(value)
        `;
        const params = [projectPostId, projectFieldId, value];

        const [result] = await connection.query(sql, params);

        await connection.commit();

        console.log(`Analysis result added/updated for project ${projectName}, post ${parsedPostId}, field ${fieldName}`);
        res.status(201).json({ message: 'Analysis result added/updated successfully', data: req.body });

    } catch (err) {
        console.error("Error adding analysis result:", err);
        if (connection) await connection.rollback();
        next(err); // Pass to global error handler
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router; 