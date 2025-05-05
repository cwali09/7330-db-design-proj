const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/results - Add a new analysis result
// Adheres to schema where ANALYSIS_RESULT references compound keys from FIELD and PROJECT_POST
router.post('/', async (req, res, next) => {
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
    if (projectName.length > 100 || fieldName.length > 100) {
        return res.status(400).json({ message: 'Project name or Field name exceeds maximum length of 100 characters.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Verify that the specific Field exists for the project
        // Schema: FIELD(field_name, project_name) is PK/Unique
        const [fields] = await connection.query(
            'SELECT 1 FROM FIELD WHERE project_name = ? AND field_name = ? LIMIT 1',
            [projectName, fieldName]
        );
        if (fields.length === 0) {
            await connection.rollback();
            // Check if project exists at all to give a better error message
            const [projectExists] = await connection.query('SELECT 1 FROM PROJECT WHERE name = ? LIMIT 1', [projectName]);
            if (projectExists.length === 0) {
                 return res.status(404).json({ message: `Project '${projectName}' not found.` });
            } else {
                 return res.status(400).json({ message: `Field '${fieldName}' is not defined for project '${projectName}'.` });
            }
        }

        // 2. Verify that the specific Project Post association exists
        // Schema: PROJECT_POST(project_name, post_id) is PK/Unique
        const [projectPosts] = await connection.query(
            'SELECT 1 FROM PROJECT_POST WHERE project_name = ? AND post_id = ? LIMIT 1',
            [projectName, parsedPostId]
        );
        if (projectPosts.length === 0) {
            await connection.rollback();
             // Check if project exists and if post exists to give better error message
            const [[projectExists], [postExists]] = await Promise.all([
                connection.query('SELECT 1 FROM PROJECT WHERE name = ? LIMIT 1', [projectName]),
                connection.query('SELECT 1 FROM POST WHERE post_id = ? LIMIT 1', [parsedPostId])
            ]);
            if (projectExists.length === 0) {
                 return res.status(404).json({ message: `Project '${projectName}' not found.` });
            } else if (postExists.length === 0) {
                 return res.status(404).json({ message: `Post ID ${parsedPostId} not found.` });
            } else {
                 return res.status(400).json({ message: `Post ID ${parsedPostId} is not associated with project '${projectName}'.` });
            }
        }

        // 3. Insert or update into ANALYSIS_RESULT table
        // Schema: ANALYSIS_RESULT(project_name, post_id, field_name, value)
        // PK: (project_name, post_id, field_name)
        // FKs reference PROJECT_POST(project_name, post_id) and FIELD(field_name, project_name)
        const sql = `
            INSERT INTO ANALYSIS_RESULT (project_name, field_name, post_id, value)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE value = VALUES(value)
        `;
        // Use the actual compound key values directly
        const params = [projectName, fieldName, parsedPostId, value];

        const [result] = await connection.query(sql, params);

        await connection.commit();

        console.log(`Analysis result added/updated for project ${projectName}, post ${parsedPostId}, field ${fieldName}`);
        res.status(201).json({ message: 'Analysis result added/updated successfully', data: req.body });

    } catch (err) {
        console.error("Error adding analysis result:", err);
        if (connection) await connection.rollback();

        // Check for specific schema-related errors based on the assumed structure
        if (err.code === 'ER_BAD_FIELD_ERROR') {
             // This error shouldn't happen now if the INSERT uses correct columns from schema
             return res.status(500).json({ message: `Database schema error: ${err.sqlMessage}` });
        }
         if (err.code === 'ER_NO_REFERENCED_ROW_2') { // FK constraint failed on INSERT
             // This indicates either the FIELD or PROJECT_POST entry doesn't exist,
             // even though we checked. Could be a race condition or schema mismatch.
             // Check the error message to see which FK failed (based on schema.txt FK definitions)
             if (err.message.includes('FOREIGN KEY (`field_name`, `project_name`) REFERENCES `FIELD`')) {
                 return res.status(400).json({ message: `Failed to add result: The field '${fieldName}' does not exist for project '${projectName}'.` });
             } else if (err.message.includes('FOREIGN KEY (`project_name`, `post_id`) REFERENCES `PROJECT_POST`')) {
                 return res.status(400).json({ message: `Failed to add result: The post ID ${parsedPostId} is not associated with project '${projectName}'.` });
             } else {
                 // Generic FK error if message parsing fails
                 return res.status(400).json({ message: `Failed to add result due to missing related data (field or project-post association). Please ensure they exist.` });
             }
         }
         // Handle data too long errors if value is TEXT but has limits elsewhere, or if keys are too long
         if (err.code === 'ER_DATA_TOO_LONG') {
              if (err.message.includes('project_name') || err.message.includes('field_name')) {
                  return res.status(400).json({ message: 'Project name or Field name exceeds maximum length of 100 characters.' });
              } else {
                  return res.status(400).json({ message: `Data too long: ${err.sqlMessage}` });
              }
         }

        next(err); // Pass to global error handler
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router; 