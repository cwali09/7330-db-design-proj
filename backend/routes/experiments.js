const express = require('express');
const router = express.Router();
const db = require('../db');

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

module.exports = router; 