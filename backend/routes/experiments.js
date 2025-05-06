const express = require('express');
const router = express.Router();
const db = require('../db');
const { getExperimentDetails } = require('../utils/experimentQueries'); // Import the reusable function

// --- Querying Routes ---

// GET /api/experiments/:projectName - Get details for a specific experiment (project)
router.get('/:projectName', async (req, res, next) => {
  const { projectName } = req.params;

  try {
    // TODO: Implement logic to:
    // 1. Verify project exists.
    // 2. Get all posts associated with the project (from PROJECT_POST join POST).
    // 3. For each associated post, get its analysis results (from ANALYSIS_RESULT).
    // 4. Get all fields defined for the project (from FIELD).
    // 5. Calculate the percentage of posts that have a value for each field.
    //    - Count distinct post_ids in ANALYSIS_RESULT for each field_name/project_name pair.
    //    - Divide by the total number of posts associated with the project.
    // 6. Format the response: list of posts (with results), field completion percentages.

    console.log(`Querying experiment details for: ${projectName}`);

    // Placeholder response - Replace with actual DB query results
    const mockResults = {
      projectName: projectName,
      posts: [
        {
          postId: 1,
          content: 'Post content 1',
          username: 'userA',
          socialMedia: 'Twitter',
          postTime: new Date().toISOString(),
          results: [
            { fieldName: 'sentiment', value: 'positive' },
            { fieldName: 'topic', value: 'tech' }
          ]
        },
         {
          postId: 2,
          content: 'Post content 2',
          username: 'userB',
          socialMedia: 'Facebook',
          postTime: new Date().toISOString(),
          results: [
             { fieldName: 'sentiment', value: 'negative' }
          ]
        }
      ],
      fieldCompletion: [
        { fieldName: 'sentiment', percentage: 100.0 }, // 2 out of 2 posts have a value
        { fieldName: 'topic', percentage: 50.0 }     // 1 out of 2 posts has a value
      ]
    };
    res.status(200).json(mockResults);

  } catch (err) {
    console.error(`Error querying experiment ${projectName}:`, err);
    next(err);
  }
});

// POST /api/experiments/by-posts - Find experiments associated with given post IDs
router.post('/by-posts', async (req, res, next) => {
    const { postIds } = req.body;

    // --- Validation ---
    if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({ message: 'postIds must be a non-empty array.' });
    }
    const validPostIds = postIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
    if (validPostIds.length !== postIds.length || validPostIds.length === 0) {
        return res.status(400).json({ message: 'Invalid or empty post ID(s) provided. Must be positive integers.' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        // 1. Find distinct project names associated with any of the post IDs
        const placeholders = validPostIds.map(() => '?').join(',');
        const [projectLinks] = await connection.query(
            `SELECT DISTINCT project_name FROM PROJECT_POST WHERE post_id IN (${placeholders})`,
            validPostIds
        );

        const projectNames = projectLinks.map(link => link.project_name);

        if (projectNames.length === 0) {
            return res.status(200).json({ // Not an error, just no associated experiments found
                message: 'No experiments found associated with the provided post IDs.',
                experiments: []
            });
        }

        // 2. For each project name, fetch its full experiment details using the refactored function
        const experimentsData = [];
        // Use Promise.all to fetch details concurrently
        await Promise.all(projectNames.map(async (projectName) => {
            try {
                // Need a separate connection for each concurrent request OR manage transactions carefully
                // Simpler approach for now: fetch sequentially or handle connection pool limits
                // Let's fetch sequentially within the single connection for simplicity here.
                // For high concurrency, consider fetching connections from the pool for each call.
                const details = await getExperimentDetails(projectName, connection);
                if (details) {
                    experimentsData.push(details);
                } else {
                    // Log if a project linked in PROJECT_POST wasn't found (data inconsistency?)
                    console.warn(`Project '${projectName}' linked to posts ${validPostIds.join(',')} but not found during detail fetch.`);
                }
            } catch (err) {
                console.error(`Error fetching details for project ${projectName} in /by-posts route:`, err);
                // Decide whether to fail the whole request or just skip this project
                // Let's skip and continue for now
            }
        }));

        res.status(200).json({
            message: `Found ${experimentsData.length} experiment(s) associated with the provided post IDs.`,
            experiments: experimentsData // Array of experiment detail objects
        });

    } catch (err) {
        console.error('Error in /experiments/by-posts route:', err);
        next(err);
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router; 