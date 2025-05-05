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
    try {
        // Execute the insert query
        await connection.query(
          'INSERT INTO PROJECT (name, start_date, end_date, institute_name, manager_id) VALUES (?, ?, ?, ?, ?)',
          [name, start_date, end_date, institute_name, manager_id]
        );
    } catch (projectInsertError) {
         if (projectInsertError.code === 'ER_DUP_ENTRY') {
             await connection.rollback();
             return res.status(409).json({ message: `Project with name '${name}' already exists.` });
         }
         throw projectInsertError; // Re-throw other errors
    }

    await connection.commit(); // Commit transaction

    console.log(`Project '${name}' created successfully.`);
    res.status(201).json({
        message: 'Project created successfully',
        data: { name, start_date, end_date, institute_name, manager_id }
    });

  } catch (err) {
    console.error("Error during project creation transaction:", err);
    if (connection) await connection.rollback();
    res.status(500).json({ message: `Internal server error during project creation: ${err.message || 'Unknown error'}` });
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
    const validFields = fields.filter(f => f && typeof f.field_name === 'string' && f.field_name.trim() !== '' && f.field_name.length <= 100); // Added length check from schema
    if (validFields.length === 0) {
        return res.status(400).json({ message: 'No valid fields provided (missing, empty, or too long field_name).' });
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

        // 1. Check if the project exists (using PROJECT.name as FK target)
        const [projects] = await connection.query('SELECT name FROM PROJECT WHERE name = ? LIMIT 1', [projectName]);
        if (projects.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `Project '${projectName}' not found.` });
        }

        // 2. Prepare bulk insert for FIELD table
        // Schema: FIELD(field_name VARCHAR(100), project_name VARCHAR(100), description TEXT, PRIMARY KEY (field_name, project_name))
        const fieldInsertSql = 'INSERT INTO FIELD (project_name, field_name, description) VALUES ?'; // Corrected table name
        const fieldValues = validFields.map(field => [
            projectName,
            field.field_name.trim(),
            field.description || null // Description is TEXT, allows null
        ]);

        // Execute bulk insert
        const [result] = await connection.query(fieldInsertSql, [fieldValues]);

        await connection.commit();

        const createdCount = result.affectedRows;
        const ignoredCount = validFields.length - createdCount;

        console.log(`Added ${createdCount} new fields to project '${projectName}'. ${ignoredCount} fields might have already existed.`);
        res.status(201).json({
            message: `Successfully processed fields for project '${projectName}'. ${createdCount} new fields added. ${ignoredCount > 0 ? `${ignoredCount} duplicates ignored.` : ''}`,
            createdCount: createdCount,
            ignoredCount: ignoredCount,
            requestedCount: validFields.length
        });

    } catch (err) {
        console.error(`Error adding fields to project ${projectName}:`, err);
        if (connection) await connection.rollback();
        // Check if the error is because FIELD.project_name doesn't exist or isn't a FK target
        if (err.code === 'ER_BAD_FIELD_ERROR' && err.message.includes('project_name')) {
             // This might indicate a schema mismatch if the column name is wrong in the query
             return res.status(500).json({ message: `Database schema error: FIELD table might be missing the 'project_name' column or it's not correctly defined. Error: ${err.sqlMessage}` });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') { // Foreign key constraint fail (likely PROJECT.name)
             return res.status(404).json({ message: `Project '${projectName}' not found (foreign key constraint failed when inserting into FIELD).` });
        }
        // Handle other potential errors like data too long for field_name
         if (err.code === 'ER_DATA_TOO_LONG' && err.message.includes('field_name')) {
             return res.status(400).json({ message: `One or more field names exceed the maximum length of 100 characters.` });
         }
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

    // 1. Check if the project exists
    const [projects] = await connection.query('SELECT name FROM PROJECT WHERE name = ? LIMIT 1', [projectName]);
    if (projects.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: `Project '${projectName}' not found.` });
    }

    // 2. Prepare bulk insert for PROJECT_POST association
    // Schema: PROJECT_POST(project_name VARCHAR(100), post_id INT, PRIMARY KEY (project_name, post_id))
    const associationSql = 'INSERT IGNORE INTO PROJECT_POST (project_name, post_id) VALUES ?';
    const associationValues = validPostIds.map(postId => [projectName, postId]);

    // Execute bulk insert
    const [result] = await connection.query(associationSql, [associationValues]);

    await connection.commit();

    console.log(`Associated ${result.affectedRows} new posts with project '${projectName}'. ${validPostIds.length - result.affectedRows} associations might have already existed.`);
    res.status(200).json({
        message: `Successfully processed associations for project '${projectName}'. ${result.affectedRows} new associations created.`,
        newAssociations: result.affectedRows,
        requestedAssociations: validPostIds.length
    });

  } catch (err) {
    console.error(`Error associating posts with project ${projectName}:`, err);
    if (connection) await connection.rollback();

    // Check specific errors related to this operation
    if (err.code === 'ER_BAD_FIELD_ERROR' && err.message.includes('project_name')) {
         return res.status(500).json({ message: "Database schema error: PROJECT_POST table might be missing the 'project_name' column or it's not correctly defined." });
    }
    // Handle potential FK errors if a post_id doesn't exist in the POST table OR if project_name FK fails
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        // Check your actual FK names from schema.txt if needed for more specific errors
        // Example: CONSTRAINT `project_post_ibfk_1` FOREIGN KEY (`project_name`) REFERENCES `PROJECT` (`name`)
        // Example: CONSTRAINT `project_post_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `POST` (`post_id`)
        if (err.message.includes('FOREIGN KEY (`post_id`)')) { // Check if error relates to post_id FK
             return res.status(400).json({ message: `One or more provided Post IDs do not exist in the database.` });
        } else { // Assume it's the project_name FK failing
             return res.status(404).json({ message: `Project '${projectName}' not found (foreign key constraint failed).` });
        }
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
        // Check if the error indicates the procedure doesn't exist or has wrong parameters
        if (err.code === 'ER_SP_DOES_NOT_EXIST') {
             return res.status(500).json({ message: "Stored procedure 'QueryExperimentData' not found." });
        }
        if (err.code === 'ER_SP_WRONG_NO_OF_ARGS') {
             return res.status(500).json({ message: "Stored procedure 'QueryExperimentData' called with incorrect number of arguments." });
        }
        // Handle errors potentially thrown *by* the procedure if it encounters issues
        // (These might be generic SQL errors or custom signaled errors)
        res.status(500).json({ message: `Error querying experiment data: ${err.message}` });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


module.exports = router; 