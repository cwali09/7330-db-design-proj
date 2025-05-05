const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database pool
const { v4: uuidv4 } = require('uuid'); // Using UUID for manager IDs for simplicity

// --- Data Entry Routes ---

// POST /api/projects - Enter basic project information ONLY
router.post('/', async (req, res, next) => {
  const {
    name,
    start_date,
    end_date,
    institute_name,
    manager_first_name,
    manager_last_name
    // REMOVED: fields array is no longer expected here
  } = req.body;

  // Basic validation for project details
  if (!name || !start_date || !end_date || !institute_name || !manager_first_name || !manager_last_name) {
    return res.status(400).json({ message: 'Missing required project details' });
  }
  if (new Date(end_date) < new Date(start_date)) {
     return res.status(400).json({ message: 'End date cannot be before start date' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Check/Insert Institute
    await connection.query(
      'INSERT IGNORE INTO INSTITUTE (name) VALUES (?)',
      [institute_name]
    );

    // 2. Check/Insert Project Manager
    let manager_id;
    const [managers] = await connection.query(
      'SELECT manager_id FROM PROJECT_MANAGER WHERE first_name = ? AND last_name = ?',
      [manager_first_name, manager_last_name]
    );

    if (managers.length > 0) {
      manager_id = managers[0].manager_id;
    } else {
      manager_id = uuidv4();
      await connection.query(
        'INSERT INTO PROJECT_MANAGER (manager_id, first_name, last_name) VALUES (?, ?, ?)',
        [manager_id, manager_first_name, manager_last_name]
      );
    }

    // 3. Insert into PROJECT table
    let projectId;
    try {
        const [projectInsertResult] = await connection.query(
          'INSERT INTO PROJECT (name, start_date, end_date, institute_name, manager_id) VALUES (?, ?, ?, ?, ?)',
          [name, start_date, end_date, institute_name, manager_id]
        );
        var res = await connection.commit();
        projectId = projectInsertResult.insertId;
    } catch (projectInsertError) {
         if (projectInsertError.code === 'ER_DUP_ENTRY') {
             await connection.rollback();
             return res.status(409).json({ message: `Project with name '${name}' already exists.` });
         }
         throw projectInsertError; // Re-throw other errors
    }

    // REMOVED: Field insertion logic is moved to a separate route

    await connection.commit(); // Commit transaction

    console.log(`Project '${name}' (ID: ${projectId}) created successfully.`);
    res.status(201).json({
        message: 'Project created successfully',
        data: { projectId, name, start_date, end_date, institute_name, manager_id }
    });

  } catch (err) {
    console.error("Error during project creation transaction:", err);
    if (connection) await connection.rollback();
    res.status(500).json({ message: `Internal server error during project creation: ${err.message}` });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/projects/:projectName/fields - Add multiple fields to a project
router.post('/:projectName/fields', async (req, res, next) => {
    const { projectName } = req.params;
    const { fields } = req.body; // Expecting { fields: [{ field_name, description }, ...] }

    // --- Validation ---
    if (!projectName) {
        return res.status(400).json({ message: 'Project name parameter is required.' });
    }
    if (!Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ message: 'Fields data must be a non-empty array.' });
    }
    // Validate individual fields
    const validFields = fields.filter(f => f && typeof f.field_name === 'string' && f.field_name.trim() !== '');
    if (validFields.length === 0) {
        return res.status(400).json({ message: 'No valid fields provided (missing or empty field_name).' });
    }
    if (validFields.length !== fields.length) {
        console.warn(`Request for project '${projectName}' contained invalid field entries which were ignored.`);
    }
    // Check for duplicate field names within the request itself
    const fieldNames = validFields.map(f => f.field_name.trim());
    if (new Set(fieldNames).size !== fieldNames.length) {
        return res.status(400).json({ message: 'Duplicate field names provided in the request.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Find the project_id for the given projectName
        const [projects] = await connection.query('SELECT project_id FROM PROJECT WHERE name = ?', [projectName]);
        if (projects.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `Project '${projectName}' not found.` });
        }
        const projectId = projects[0].project_id;

        // 2. Prepare bulk insert for PROJECT_FIELD
        // Use INSERT IGNORE or handle duplicates explicitly if needed
        // Using INSERT IGNORE is simpler if overwriting is not desired
        const fieldInsertSql = 'INSERT IGNORE INTO PROJECT_FIELD (project_id, field_name, description) VALUES ?';
        const fieldValues = validFields.map(field => [
            projectId,
            field.field_name.trim(),
            field.description || null
        ]);

        // Execute bulk insert
        const [result] = await connection.query(fieldInsertSql, [fieldValues]);

        await connection.commit();

        const createdCount = result.affectedRows;
        const ignoredCount = validFields.length - createdCount;

        console.log(`Added ${createdCount} new fields to project '${projectName}' (ID: ${projectId}). ${ignoredCount} fields might have already existed.`);
        res.status(201).json({
            message: `Successfully processed fields for project '${projectName}'. ${createdCount} new fields added. ${ignoredCount > 0 ? `${ignoredCount} duplicates ignored.` : ''}`,
            createdCount: createdCount,
            ignoredCount: ignoredCount,
            requestedCount: validFields.length
        });

    } catch (err) {
        console.error(`Error adding fields to project ${projectName}:`, err);
        if (connection) await connection.rollback();
        // Specific error handling (like FK constraints) might not be needed here unless PROJECT_FIELD has FKs other than project_id
        next(err); // Pass other errors to the global error handler
    } finally {
        if (connection) connection.release();
    }
});


// POST /api/projects/:projectName/posts - Associate posts with a project
router.post('/:projectName/posts', async (req, res, next) => {
  const { projectName } = req.params;
  const { postIds } = req.body; // Expecting { postIds: [1, 2, 3] }

  // Validation
  if (!projectName) {
    return res.status(400).json({ message: 'Project name is required in URL path.' });
  }
  if (!Array.isArray(postIds) || postIds.length === 0) {
    return res.status(400).json({ message: 'postIds must be a non-empty array.' });
  }
  // Ensure all IDs are positive integers
  const validPostIds = postIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
  if (validPostIds.length !== postIds.length) {
      return res.status(400).json({ message: 'One or more invalid post IDs provided.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Find the project_id for the given projectName
    const [projects] = await connection.query('SELECT project_id FROM PROJECT WHERE name = ?', [projectName]);
    if (projects.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: `Project '${projectName}' not found.` });
    }
    const projectId = projects[0].project_id;

    // 2. Prepare bulk insert for PROJECT_POST association
    // Use INSERT IGNORE to avoid errors if an association already exists
    const associationSql = 'INSERT IGNORE INTO PROJECT_POST (project_id, post_id) VALUES ?';
    const associationValues = validPostIds.map(postId => [projectId, postId]);

    // Execute bulk insert
    const [result] = await connection.query(associationSql, [associationValues]);

    await connection.commit();

    console.log(`Associated ${result.affectedRows} new posts with project '${projectName}' (ID: ${projectId}). ${validPostIds.length - result.affectedRows} associations might have already existed.`);
    res.status(200).json({
        message: `Successfully processed associations for project '${projectName}'. ${result.affectedRows} new associations created.`,
        newAssociations: result.affectedRows,
        requestedAssociations: validPostIds.length
    });

  } catch (err) {
    console.error(`Error associating posts with project ${projectName}:`, err);
    if (connection) await connection.rollback();

    // Handle potential FK errors if a post_id doesn't exist in the POST table
    if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.message.includes('fk_projectpost_post')) { // Check your actual FK name
         return res.status(400).json({ message: `One or more provided Post IDs do not exist in the database.` });
    }

    next(err); // Pass other errors to the global error handler
  } finally {
    if (connection) connection.release();
  }
});


// GET /api/projects/:projectName/experiment - Query experiment data
router.get('/:projectName/experiment', async (req, res, next) => {
    const { projectName } = req.params;
    let connection;

    try {
        connection = await db.getConnection();
        console.log(`Calling QueryExperimentData procedure for project: ${projectName}`);

        const procedureCall = 'CALL QueryExperimentData(?)';
        const params = [projectName];

        // Execute the stored procedure which returns multiple result sets
        const [results] = await connection.query(procedureCall, params);

        // results[0] = Posts and their results
        // results[1] = Field statistics
        // results[2] = Metadata about the procedure call itself (ignore)

        // Check if the first result set is empty AND the second is empty.
        // This indicates our procedure signaled "Project not found".
        if (results[0].length === 0 && results[1].length === 0) {
             console.log(`Project not found: ${projectName}`);
             // Send a 404 Not Found status
             return res.status(404).json({ message: `Project '${projectName}' not found.` });
        }

        const postsData = results[0];
        const statisticsData = results[1];

        console.log(`QueryExperimentData returned ${postsData.length} posts and ${statisticsData.length} field statistics.`);

        res.status(200).json({
            posts: postsData,
            statistics: statisticsData
        });

    } catch (err) {
        console.error(`Error calling QueryExperimentData procedure for project ${projectName}:`, err);
        res.status(500).json({ message: `Error querying experiment data: ${err.message}` });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


module.exports = router; 