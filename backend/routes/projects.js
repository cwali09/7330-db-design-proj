const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database pool
const { v4: uuidv4 } = require('uuid'); // Using UUID for manager IDs for simplicity
const { getExperimentDetails } = require('../utils/experimentQueries'); // Import the refactored function

// --- Data Entry Routes ---

// GET /api/projects - Fetch all projects with details
router.get('/', async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        console.log('Fetching all projects with details');

        // Use the PROJECT_DETAILS view for convenience
        const [projects] = await connection.query('SELECT * FROM PROJECT_DETAILS ORDER BY project_name');

        console.log(`Found ${projects.length} projects.`);
        res.status(200).json(projects);

    } catch (err) {
        console.error("Error fetching projects:", err);
        next(err); // Pass errors to the global error handler
    } finally {
        if (connection) {
            connection.release(); // Always release the connection
        }
    }
});

// POST /api/projects - Create a new project
router.post('/', async (req, res, next) => {
    // Destructure expected fields from request body
    const {
        // Project details
        name, // project name
        start_date,
        end_date,
        description,
        // New Institute details
        institute_name,
        // New Manager details
        manager_id, // manager's unique ID (provided by user)
        manager_first_name,
        manager_last_name
    } = req.body;

    // --- Validation ---
    // Project validation
    if (!name || !start_date || !end_date) {
        return res.status(400).json({ message: 'Missing required project fields: name, start_date, end_date' });
    }
    if (new Date(end_date) < new Date(start_date)) {
        return res.status(400).json({ message: 'Project end date cannot be before start date.' });
    }
    // Institute validation
    if (!institute_name || typeof institute_name !== 'string' || institute_name.trim() === '') {
        return res.status(400).json({ message: 'Missing or invalid required field: institute_name' });
    }
    // Manager validation
    if (!manager_id || !manager_first_name || !manager_last_name) {
        return res.status(400).json({ message: 'Missing required manager fields: manager_id, manager_first_name, manager_last_name' });
    }
    // Add length checks if necessary based on schema
    if (name.length > 100 || institute_name.trim().length > 100 || manager_id.length > 50 || manager_first_name.length > 50 || manager_last_name.length > 50) {
         return res.status(400).json({ message: 'One or more fields exceed maximum length constraints.' });
    }
    // --- End Validation ---


    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction(); // Start transaction

        // 1. Create Institute (handle potential duplicates)
        let instituteId;
        const instituteSql = 'INSERT INTO INSTITUTE (name) VALUES (?)';
        try {
            const [instituteResult] = await connection.query(instituteSql, [institute_name.trim()]);
            instituteId = instituteResult.insertId;
            console.log(`Institute '${institute_name.trim()}' created with ID: ${instituteId}`);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                // If institute already exists, maybe we should use the existing one?
                // For now, we'll treat it as an error as the user intended to create a new one.
                await connection.rollback(); // Rollback before sending response
                console.error(`Error creating institute: Duplicate name '${institute_name.trim()}'`);
                return res.status(409).json({ message: `Institute with name '${institute_name.trim()}' already exists. Cannot create duplicate.` });
            } else {
                throw err; // Re-throw other errors to be caught below
            }
        }

        // 2. Create Manager (handle potential duplicates)
        const managerSql = 'INSERT INTO PROJECT_MANAGER (manager_id, first_name, last_name) VALUES (?, ?, ?)';
        try {
            await connection.query(managerSql, [manager_id, manager_first_name, manager_last_name]);
            console.log(`Manager '${manager_first_name} ${manager_last_name}' created with ID: ${manager_id}`);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                await connection.rollback(); // Rollback before sending response
                console.error(`Error creating manager: Duplicate ID '${manager_id}'`);
                return res.status(409).json({ message: `Manager with ID '${manager_id}' already exists. Cannot create duplicate.` });
            } else {
                throw err; // Re-throw other errors
            }
        }

        // 3. Create Project, linking to the new Institute and Manager
        const projectSql = `
            INSERT INTO PROJECT (name, start_date, end_date, description, institute_id, manager_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const projectParams = [
            name,
            start_date,
            end_date,
            description || null, // Use null if description is empty/undefined
            instituteId,        // Use the ID from the institute insert
            manager_id          // Use the ID provided by the user
        ];
        const [projectResult] = await connection.query(projectSql, projectParams);
        const newProjectId = projectResult.insertId;
        console.log(`Project '${name}' created with ID: ${newProjectId}, linked to Institute ID: ${instituteId} and Manager ID: ${manager_id}`);

        // If all inserts were successful, commit the transaction
        await connection.commit();

        // Respond with success message and potentially the created project details
        res.status(201).json({
            message: 'Project, Institute, and Manager created successfully',
            data: {
                project_id: newProjectId,
                project_name: name,
                institute_id: instituteId,
                institute_name: institute_name.trim(),
                manager_id: manager_id
            }
        });

    } catch (err) {
        // If any error occurred during the transaction, roll back
        if (connection) await connection.rollback();
        console.error("Error during project/institute/manager creation transaction:", err);

        // Handle specific errors if needed (though duplicates are handled above)
        // if (err.code === 'ER_NO_REFERENCED_ROW_2') { ... } // Less likely now

        // Pass other errors to the global error handler or send a generic error
        res.status(500).json({
            message: "Failed to create project due to a database error.",
            error: err.message, // Provide more detail in development if desired
            code: err.code
        });
        // Using next(err) might be preferable if you have a robust global error handler
        // next(err);

    } finally {
        if (connection) {
            connection.release(); // Always release the connection
        }
    }
});

// GET /api/projects/:name/fields - Get fields for a specific project
router.get('/:name/fields', async (req, res, next) => {
    const projectName = req.params.name;
    let connection;
    try {
        connection = await db.getConnection();
        const [fields] = await connection.query(
            'SELECT field_name, description FROM FIELD WHERE project_name = ?',
            [projectName]
        );
        res.status(200).json(fields);
    } catch (err) {
        console.error(`Error fetching fields for project ${projectName}:`, err);
        next(err);
    } finally {
        if (connection) connection.release();
    }
});

// POST /api/projects/:name/fields - Add multiple fields to a project
router.post('/:name/fields', async (req, res, next) => {
    const projectName = req.params.name;
    const { fields } = req.body; // Expecting { fields: [{ field_name: '...', description: '...' }, ...] }

    if (!Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ message: 'Request body must contain a non-empty array of fields.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction(); // Use transaction for multiple inserts

        const insertSql = 'INSERT INTO FIELD (field_name, project_name, description) VALUES (?, ?, ?)';
        let insertedCount = 0;

        for (const field of fields) {
            if (!field.field_name || field.field_name.trim() === '') {
                // Skip invalid fields or throw an error
                console.warn(`Skipping field with empty name for project ${projectName}`);
                continue; // Or throw error: await connection.rollback(); return res.status(400).json(...)
            }
            await connection.query(insertSql, [
                field.field_name.trim(),
                projectName,
                field.description || null // Allow null description
            ]);
            insertedCount++;
        }

        await connection.commit(); // Commit transaction if all inserts were successful

        console.log(`Successfully added ${insertedCount} fields to project ${projectName}`);
        res.status(201).json({ message: `Successfully added ${insertedCount} fields.` });

    } catch (err) {
        if (connection) await connection.rollback(); // Rollback transaction on error
        console.error(`Error adding fields to project ${projectName}:`, err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'One or more field names already exist for this project.' });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(404).json({ message: `Project with name '${projectName}' not found.` });
        }
        next(err);
    } finally {
        if (connection) connection.release();
    }
});

// POST /api/projects/:name/posts - Associate posts with a project
router.post('/:name/posts', async (req, res, next) => {
    const projectName = req.params.name;
    const { postIds } = req.body; // Expecting { postIds: [1, 2, 3] }

    if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({ message: 'Request body must contain a non-empty array of postIds.' });
    }
    // Validate that postIds contains numbers
    if (!postIds.every(id => typeof id === 'number' && Number.isInteger(id))) {
        return res.status(400).json({ message: 'postIds must be an array of integers.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const insertSql = 'INSERT INTO PROJECT_POST (project_name, post_id) VALUES (?, ?)';
        let associatedCount = 0;

        for (const postId of postIds) {
            try {
                await connection.query(insertSql, [projectName, postId]);
                associatedCount++;
            } catch (insertErr) {
                if (insertErr.code === 'ER_DUP_ENTRY') {
                    // Ignore duplicate associations, maybe log it
                    console.log(`Post ID ${postId} already associated with project ${projectName}. Skipping.`);
                } else {
                    // Re-throw other errors to be caught by the outer catch block
                    throw insertErr;
                }
            }
        }

        await connection.commit();

        console.log(`Successfully associated ${associatedCount} new posts with project ${projectName}`);
        res.status(201).json({ message: `Successfully associated ${associatedCount} new posts.` });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error(`Error associating posts with project ${projectName}:`, err);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            // Could be project name or post ID FK violation
             return res.status(404).json({ message: `Project '${projectName}' or one of the post IDs not found.` });
        }
        next(err);
    } finally {
        if (connection) connection.release();
    }
});

// GET /api/projects/:name/experiment - Get experiment results for a project
router.get('/:name/experiment', async (req, res, next) => {
    const projectName = req.params.name;
    let connection;
    try {
        connection = await db.getConnection();
        console.log(`Calling QueryExperiment procedure for project: ${projectName}`);

        // Execute the stored procedure
        const [results] = await connection.query('CALL QueryExperiment(?)', [projectName]);

        // The actual data is usually the first element in the results array
        const experimentData = results && Array.isArray(results[0]) ? results[0] : [];

        console.log(`QueryExperiment procedure returned ${experimentData.length} results for project ${projectName}.`);
        res.status(200).json(experimentData);

    } catch (err) {
        console.error(`Error calling QueryExperiment procedure for project ${projectName}:`, err);
         if (err.code === 'ER_SP_DOES_NOT_EXIST') {
             res.status(500).json({ message: 'Internal Server Error: QueryExperiment stored procedure not found.' });
         } else {
             res.status(500).json({ message: `Error executing experiment query: ${err.message}` });
         }
        // next(err); // Or pass to global error handler
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router; 