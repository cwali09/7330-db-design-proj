const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database pool
const { v4: uuidv4 } = require('uuid'); // Using UUID for manager IDs for simplicity

// --- Data Entry Routes ---

// POST /api/projects - Enter basic project information
router.post('/', async (req, res, next) => {
  const {
    name,
    start_date,
    end_date,
    institute_name,
    manager_first_name,
    manager_last_name
  } = req.body;

  // Basic validation
  if (!name || !start_date || !end_date || !institute_name || !manager_first_name || !manager_last_name) {
    return res.status(400).json({ message: 'Missing required project fields' });
  }
  if (new Date(end_date) < new Date(start_date)) {
     return res.status(400).json({ message: 'End date cannot be before start date' });
  }

  let connection; // Declare connection outside try block for rollback/commit
  try {
    connection = await db.getConnection(); // Get connection from pool
    await connection.beginTransaction(); // Start transaction

    // 1. Check/Insert Institute
    // Use INSERT IGNORE - if institute_name already exists, it does nothing.
    // ON DUPLICATE KEY UPDATE name=name could also work but IGNORE is simpler here.
    await connection.query(
      'INSERT IGNORE INTO INSTITUTE (name) VALUES (?)',
      [institute_name]
    );

    // 2. Check/Insert Project Manager
    let manager_id;
    // Try to find manager by first and last name
    const [managers] = await connection.query(
      'SELECT manager_id FROM PROJECT_MANAGER WHERE first_name = ? AND last_name = ?',
      [manager_first_name, manager_last_name]
    );

    if (managers.length > 0) {
      manager_id = managers[0].manager_id;
    } else {
      // Manager not found, create a new one with a generated ID
      manager_id = uuidv4(); // Generate a unique ID (requires `npm install uuid`)
      await connection.query(
        'INSERT INTO PROJECT_MANAGER (manager_id, first_name, last_name) VALUES (?, ?, ?)',
        [manager_id, manager_first_name, manager_last_name]
      );
    }

    // 3. Insert into PROJECT table
    // Use INSERT IGNORE or check first if project name exists to prevent duplicates
    const [projectInsertResult] = await connection.query(
      'INSERT INTO PROJECT (name, start_date, end_date, institute_name, manager_id) VALUES (?, ?, ?, ?, ?)',
      [name, start_date, end_date, institute_name, manager_id]
    );

    if (projectInsertResult.affectedRows === 0) {
        // This could happen if the project name already exists (due to PRIMARY KEY constraint)
        // Or if something else went wrong without throwing an error (less likely)
        await connection.rollback(); // Rollback transaction
        return res.status(409).json({ message: `Project with name '${name}' already exists.` });
    }


    await connection.commit(); // Commit transaction if all steps succeed

    console.log(`Project '${name}' created successfully.`);
    res.status(201).json({
        message: 'Project created successfully',
        data: { name, start_date, end_date, institute_name, manager_id } // Return created data including manager_id
    });

  } catch (err) {
    console.error("Error creating project:", err);
    if (connection) {
        await connection.rollback(); // Rollback transaction on error
    }
    // Check for specific duplicate entry errors if needed (e.g., err.code === 'ER_DUP_ENTRY')
    if (err.code === 'ER_DUP_ENTRY') {
         return res.status(409).json({ message: `Project creation failed: A project with name '${name}' might already exist.` });
    }
    next(err); // Pass other errors to global error handler
  } finally {
      if (connection) {
          connection.release(); // Always release connection back to pool
      }
  }
});

// POST /api/projects/:projectName/posts - Associate posts with a project
router.post('/:projectName/posts', async (req, res, next) => {
  const { projectName } = req.params;
  const { postIds } = req.body; // Expecting an array of post_id

  if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
    return res.status(400).json({ message: 'Requires an array of postIds' });
  }

  // Ensure postIds are integers
  const validPostIds = postIds.map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0);
  if (validPostIds.length !== postIds.length) {
      return res.status(400).json({ message: 'Invalid post IDs provided. Ensure all IDs are positive integers.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Verify project exists
    const [projects] = await connection.query('SELECT 1 FROM PROJECT WHERE name = ?', [projectName]);
    if (projects.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: `Project '${projectName}' not found.` });
    }

    // 2. Verify all post_ids exist in the POST table (Optional but good practice)
    // This query checks how many of the provided IDs actually exist.
    const placeholders = validPostIds.map(() => '?').join(','); // Creates ?,?,?
    const [existingPosts] = await connection.query(
        `SELECT COUNT(DISTINCT post_id) as count FROM POST WHERE post_id IN (${placeholders})`,
        validPostIds
    );

    if (existingPosts[0].count !== validPostIds.length) {
        await connection.rollback();
        // Find which IDs are missing for a better error message (more complex query needed)
        return res.status(400).json({ message: 'One or more provided post IDs do not exist in the database.' });
    }

    // 3. Insert into PROJECT_POST table, handling potential duplicates
    // Use INSERT IGNORE to skip rows where the combination already exists
    if (validPostIds.length > 0) {
        const values = validPostIds.map(postId => [projectName, postId]); // Array of [projectName, postId] pairs
        await connection.query(
            'INSERT IGNORE INTO PROJECT_POST (project_name, post_id) VALUES ?',
            [values] // Needs to be wrapped in an array for bulk insert syntax
        );
    } else {
        console.log(`No valid post IDs provided for project ${projectName}.`);
    }

    await connection.commit();

    res.status(200).json({ message: `Posts successfully associated with project '${projectName}'.` });

  } catch (err) {
    console.error("Error associating posts:", err);
    if (connection) await connection.rollback();
    next(err);
  } finally {
      if (connection) connection.release();
  }
});

// POST /api/projects/:projectName/fields - Add a new analysis field to a project
router.post('/:projectName/fields', async (req, res, next) => {
    const { projectName } = req.params;
    const { field_name, description } = req.body;

    if (!field_name) {
        return res.status(400).json({ message: 'Field name is required.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Verify project exists
        const [projects] = await connection.query('SELECT 1 FROM PROJECT WHERE name = ?', [projectName]);
        if (projects.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `Project '${projectName}' not found.` });
        }

        // 2. Insert the field, ignore if it already exists for this project
        const [result] = await connection.query(
            'INSERT IGNORE INTO FIELD (project_name, field_name, description) VALUES (?, ?, ?)',
            [projectName, field_name, description || null] // Use null if description is empty/undefined
        );

        await connection.commit();

        if (result.affectedRows > 0) {
            res.status(201).json({ message: `Field '${field_name}' added to project '${projectName}'.`, data: { projectName, field_name, description } });
        } else {
            // If affectedRows is 0, it means the field likely already existed for this project
            res.status(200).json({ message: `Field '${field_name}' already exists for project '${projectName}'.` });
        }

    } catch (err) {
        console.error("Error adding field:", err);
        if (connection) await connection.rollback();
        if (err.code === 'ER_DUP_ENTRY') { // Should be handled by INSERT IGNORE, but just in case
             return res.status(409).json({ message: `Field '${field_name}' already exists for project '${projectName}'.` });
        }
        next(err);
    } finally {
        if (connection) connection.release();
    }
});


// POST /api/projects/:projectName/results - Enter analysis results
router.post('/:projectName/results', async (req, res, next) => {
  const { projectName } = req.params;
  // Expecting body like: { postId: 123, fieldName: 'sentiment', value: 'positive' }
  const { postId, fieldName, value } = req.body; // Assuming single result object for now

   if (postId === undefined || !fieldName || value === undefined) {
     return res.status(400).json({ message: 'Requires postId, fieldName, and value for analysis result' });
   }
   const parsedPostId = parseInt(postId);
   if (isNaN(parsedPostId) || parsedPostId <= 0) {
       return res.status(400).json({ message: 'Invalid postId provided.' });
   }


  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Verify project exists (redundant if checks below are done, but good practice)
    // const [projects] = await connection.query('SELECT 1 FROM PROJECT WHERE name = ?', [projectName]);
    // if (projects.length === 0) { /* ... handle error ... */ }

    // 2. Verify post exists AND is associated with the project
    const [projectPosts] = await connection.query(
        'SELECT 1 FROM PROJECT_POST WHERE project_name = ? AND post_id = ?',
        [projectName, parsedPostId]
    );
    if (projectPosts.length === 0) {
        await connection.rollback();
        return res.status(400).json({ message: `Post ID ${parsedPostId} is not associated with project '${projectName}'.` });
    }

    // 3. Verify field exists for the project
    const [fields] = await connection.query(
        'SELECT 1 FROM FIELD WHERE project_name = ? AND field_name = ?',
        [projectName, fieldName]
    );
    if (fields.length === 0) {
        await connection.rollback();
        return res.status(400).json({ message: `Field '${fieldName}' is not defined for project '${projectName}'. Please add the field first.` });
    }

    // 4. Insert or update into ANALYSIS_RESULT table
    // ON DUPLICATE KEY UPDATE handles cases where a result for this post/project/field already exists
    const [result] = await connection.query(
        `INSERT INTO ANALYSIS_RESULT (project_name, post_id, field_name, value)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value)`,
        [projectName, parsedPostId, fieldName, value]
    );

    await connection.commit();

    console.log(`Analysis result added/updated for project ${projectName}, post ${parsedPostId}, field ${fieldName}`);
    res.status(201).json({ message: 'Analysis result added/updated successfully', data: req.body });

  } catch (err) {
    console.error("Error adding analysis result:", err);
    if (connection) await connection.rollback();
    next(err);
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

        // The 'results' field in postsData should already be JSON parsed by mysql2 if using JSON functions
        // If not using JSON functions, you'd need to group rows here based on post_id

        console.log(`QueryExperimentData returned ${postsData.length} posts and ${statisticsData.length} field statistics.`);

        res.status(200).json({
            posts: postsData,
            statistics: statisticsData
        });

    } catch (err) {
        console.error(`Error calling QueryExperimentData procedure for project ${projectName}:`, err);
        // Distinguish between DB errors and project not found (handled above)
        res.status(500).json({ message: `Error querying experiment data: ${err.message}` });
        // next(err); // Or pass to global error handler
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
        }
    }
});

// TODO: Add routes for creating/managing Fields within a project if needed separately
// --> Added POST /:projectName/fields above

module.exports = router; 