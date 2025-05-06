const db = require('../db');

/**
 * Fetches detailed experiment data for a given project name.
 * Includes project details, manager (from PROJECT_MANAGER), institute,
 * associated posts with results, and aggregate statistics.
 * Adheres strictly to schema.txt.
 *
 * @param {string} projectName - The name of the project.
 * @param {object} connection - An active database connection.
 * @returns {Promise<object|null>} - Experiment data object or null if project not found.
 */
async function getExperimentDetails(projectName, connection) {
    // 1. Fetch Project, Manager (from PROJECT_MANAGER), Institute details
    const [projectDetails] = await connection.query(`
        SELECT
            p.name AS project_name,
            p.start_date,
            p.end_date,
            pm.first_name AS manager_first_name,
            pm.last_name AS manager_last_name,
            i.name AS institute_name
        FROM PROJECT p
        LEFT JOIN INSTITUTE i ON p.institute_name = i.name
        LEFT JOIN PROJECT_MANAGER pm ON p.manager_id = pm.manager_id
        WHERE p.name = ?
    `, [projectName]);

    if (projectDetails.length === 0) {
        return null; // Project not found
    }

    // 2. Fetch Posts associated with the project, including their results and field details
    const [postResults] = await connection.query(`
        SELECT
            po.post_id,
            po.username,
            po.social_media_name,
            po.content,
            po.post_time,
            f.field_name,
            f.description AS field_description,
            ar.value AS analysis_value
        FROM PROJECT_POST pp
        JOIN POST po ON pp.post_id = po.post_id
        LEFT JOIN FIELD f ON pp.project_name = f.project_name
        LEFT JOIN ANALYSIS_RESULT ar ON pp.project_name = ar.project_name
                                     AND pp.post_id = ar.post_id
                                     AND f.field_name = ar.field_name
        WHERE pp.project_name = ?
        ORDER BY po.post_id, f.field_name;
    `, [projectName]);

    // 3. Process the postResults into a structured format (group by post_id)
    const postsMap = new Map();
    postResults.forEach(row => {
        if (!postsMap.has(row.post_id)) {
            postsMap.set(row.post_id, {
                post_id: row.post_id,
                username: row.username,
                social_media_name: row.social_media_name,
                content: row.content,
                post_time: row.post_time,
                results: []
            });
        }
        if (row.field_name) {
            postsMap.get(row.post_id).results.push({
                field_name: row.field_name,
                field_description: row.field_description,
                value: row.analysis_value
            });
        }
    });
    const processedPosts = Array.from(postsMap.values());

    // 4. Fetch Aggregate Statistics (Completion Percentage per Field)
    const [statistics] = await connection.query(`
        SELECT
            f.field_name,
            f.description AS field_description,
            COUNT(DISTINCT pp.post_id) AS total_project_posts,
            COUNT(DISTINCT ar.post_id) AS posts_with_result_for_field,
            (COUNT(DISTINCT ar.post_id) / COUNT(DISTINCT pp.post_id)) * 100 AS completion_percentage
        FROM FIELD f
        LEFT JOIN PROJECT_POST pp ON f.project_name = pp.project_name
        LEFT JOIN ANALYSIS_RESULT ar ON f.project_name = ar.project_name
                                     AND f.field_name = ar.field_name
                                     AND pp.post_id = ar.post_id
        WHERE f.project_name = ?
        GROUP BY f.field_name, f.description
        ORDER BY f.field_name;
    `, [projectName]);

    const formattedStatistics = statistics.map(stat => ({
        ...stat,
        completion_percentage: stat.total_project_posts > 0 ? parseFloat(stat.completion_percentage).toFixed(2) : '0.00'
    }));

    // 5. Combine all data
    return {
        project: projectDetails[0],
        posts: processedPosts,
        statistics: formattedStatistics
    };
}

module.exports = {
    getExperimentDetails
}; 