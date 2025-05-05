const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the database pool

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
    // Note: We might need to handle manager creation/lookup separately
    // For now, assume manager_id is derived or handled elsewhere
  } = req.body;

  // Basic validation
  if (!name || !start_date || !end_date || !institute_name || !manager_first_name || !manager_last_name) {
    return res.status(400).json({ message: 'Missing required project fields' });
  }
  if (new Date(end_date) < new Date(start_date)) {
     return res.status(400).json({ message: 'End date cannot be before start date' });
  }

  try {
    // TODO: Implement logic to:
    // 1. Check if institute exists, create if not (or handle error)
    // 2. Check if manager exists (by name?), create if not, get manager_id
    // 3. Insert into PROJECT table

    console.log('Received project data:', req.body);
    // Placeholder response - Replace with actual DB interaction
    res.status(201).json({ message: 'Project created successfully (placeholder)', data: req.body });

  } catch (err) {
    console.error("Error creating project:", err);
    next(err); // Pass error to global error handler
  }
});

// POST /api/projects/:projectName/posts - Associate posts with a project
router.post('/:projectName/posts', async (req, res, next) => {
  const { projectName } = req.params;
  const { postIds } = req.body; // Expecting an array of post_id

  if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
    return res.status(400).json({ message: 'Requires an array of postIds' });
  }

  try {
    // TODO: Implement logic to:
    // 1. Verify project exists
    // 2. Verify each post_id exists in the POST table
    // 3. Insert into PROJECT_POST table, handling potential duplicates (ON DUPLICATE KEY UPDATE or INSERT IGNORE)

    console.log(`Associating posts ${postIds.join(', ')} with project ${projectName}`);
    // Placeholder response
    res.status(200).json({ message: `Posts associated with ${projectName} (placeholder)` });

  } catch (err) {
    console.error("Error associating posts:", err);
    next(err);
  }
});

// POST /api/projects/:projectName/results - Enter analysis results
router.post('/:projectName/results', async (req, res, next) => {
  const { projectName } = req.params;
  // Expecting body like: { postId: 123, fieldName: 'sentiment', value: 'positive' }
  // Or maybe an array for bulk entry: [ { postId: 123, fieldName: 'sentiment', value: 'positive' }, ... ]
  const results = req.body; // Assuming single result object for now

   if (!results || !results.postId || !results.fieldName || results.value === undefined) {
     return res.status(400).json({ message: 'Requires postId, fieldName, and value for analysis result' });
   }

  try {
    // TODO: Implement logic to:
    // 1. Verify project exists
    // 2. Verify post exists and is associated with the project (check PROJECT_POST)
    // 3. Verify field exists for the project (check FIELD)
    // 4. Insert or update into ANALYSIS_RESULT table

    console.log(`Adding analysis result for project ${projectName}:`, results);
    // Placeholder response
    res.status(201).json({ message: 'Analysis result added (placeholder)', data: results });

  } catch (err) {
    console.error("Error adding analysis result:", err);
    next(err);
  }
});


// TODO: Add routes for creating/managing Fields within a project if needed separately

module.exports = router; 