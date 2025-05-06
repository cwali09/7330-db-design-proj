import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import './QueryExperimentPage.css'; // Create this CSS file

function QueryExperimentPage() {
  const [projectName, setProjectName] = useState('');
  const [posts, setPosts] = useState([]);
  const [statistics, setStatistics] = useState([]); // State to hold analysis results/statistics
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleProjectNameChange = (e) => {
    setProjectName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setMessage('Please enter a project name.');
      return;
    }
    setLoading(true);
    setMessage('');
    setPosts([]); // Clear previous results
    setStatistics([]); // Clear previous results

    try {
      console.log(`Fetching experiment data for project: ${projectName}`);
      const response = await apiService.queryExperiment(projectName);
      // Log the *entire* axios response object
      console.log("Full Axios Response Object:", response);

      // Access data via response.data
      const responseData = response.data;
      console.log("API Response Data:", responseData);

      // Check if posts is an array. Be more flexible with statistics initially.
      if (response && responseData && Array.isArray(responseData.posts)) {
        const postsData = responseData.posts;
        // Ensure statisticsData is treated as an array for the state
        // Default to empty array [] if it's not an array as received from API
        const statisticsData = Array.isArray(responseData.statistics) ? responseData.statistics : [];

        // Add a warning if statistics was not an array, as it indicates a backend/DB issue
        if (!Array.isArray(responseData.statistics)) {
            console.warn(
                "Backend API returned 'statistics' as type",
                typeof responseData.statistics,
                "instead of an array. Defaulting to []. Check 'QueryExperiment' procedure.",
                responseData.statistics // Log the actual problematic value
            );
            // Optionally add to the user message:
            // setMessage(prev => prev + " (Note: Statistics data format needed adjustment)");
        }

        setPosts(postsData);
        setStatistics(statisticsData); // Store the (potentially defaulted) statistics array

        // Adjust messages based on the actual data received
        // Use statisticsData.length which will be 0 if it wasn't an array originally
        if (postsData.length === 0 && statisticsData.length === 0) {
          setMessage(`Project '${projectName}' found, but it has no posts or analysis results.`);
        } else if (postsData.length === 0) {
          setMessage(`Project '${projectName}' found, but it has no associated posts.`);
        } else {
          setMessage(`Successfully fetched data for project '${projectName}'.`);
        }

      } else {
        // Handle cases where the structure inside response.data is unexpected (e.g., posts missing or not array)
        console.error("Unexpected API response structure inside response.data:", responseData);
        let specificError = "Received unexpected data format from the server.";
        if (response && responseData) {
            // Only check posts here, as we handle non-array statistics above
            if (!Array.isArray(responseData.posts)) specificError += " ('posts' was not an array or missing)";
        } else if (!response?.data) {
             specificError += " (Response data is missing)";
        }
        setMessage(specificError);
        setPosts([]);
        setStatistics([]);
      }

    } catch (err) {
      console.error("Error fetching experiment data:", err);
      // Check if the error response *itself* contains a message (common for backend errors)
      const backendErrorMessage = err.response?.data?.message;

      if (err.response && err.response.status === 404) {
        setMessage(backendErrorMessage || `Project '${projectName}' not found.`); // Use backend message if available
      } else {
        setMessage(backendErrorMessage || err.message || 'Failed to fetch experiment data. Please try again.'); // Use backend message if available
      }
      setPosts([]);
      setStatistics([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date/time string
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      return new Date(dateTimeString).toLocaleString();
    } catch (e) {
      return dateTimeString; // Return original if formatting fails
    }
  };

  return (
    <div className="query-experiment-container">
      <h1>Query Experiment Data</h1>

      <form onSubmit={handleSubmit} className="query-form">
        <div className="form-group">
          <label htmlFor="projectName">Project Name:</label>
          <input
            type="text"
            id="projectName"
            value={projectName}
            onChange={handleProjectNameChange}
            placeholder="Enter the exact project name"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Querying...' : 'Query Experiment'}
        </button>
      </form>

      {message && <p className={`message ${message.includes('Failed') || message.includes('Error') || message.includes('not found') ? 'error' : 'success'}`}>{message}</p>}

      {loading && <p>Loading experiment data...</p>}

      {posts.length > 0 && !loading && (
        <div className="results-container">
          {/* --- Statistics Section --- */}
          {statistics.length > 0 && (
            <div className="statistics-section">
              <h2>Field Completion Statistics</h2>
              <p>Total Posts in Project: {statistics[0]?.total_project_posts ?? 'N/A'}</p>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Field Name</th>
                    <th>Posts with Result</th>
                    <th>Completion (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.map((stat, index) => (
                    <tr key={index}>
                      <td>{stat.field_name}</td>
                      <td>{stat.posts_with_result_count}</td>
                      <td>{stat.completion_percentage?.toFixed(2) ?? '0.00'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {statistics.length === 0 && posts.length > 0 && (
             <p><em>No analysis fields defined or results entered for this project yet.</em></p>
           )}

          {/* --- Posts Section --- */}
          <div className="posts-section">
              <h2>Associated Posts</h2>
              {posts.map((post) => {
                // Filter statistics array for the current post
                // This relies on 'statistics' being an array in the state
                const postResults = statistics.filter(stat =>
                    // Ensure we are comparing the correct properties.
                    // Assuming statistics array contains rows from ANALYSIS_RESULT joined with FIELD?
                    // Or does the statistics array *only* contain the aggregate data?
                    // *** Re-check what the 'statistics' array actually contains based on QueryExperiment procedure ***
                    // If statistics ONLY contains aggregates (field_name, count, percentage),
                    // then you CANNOT filter it per post like this.
                    // You need a DIFFERENT array containing the *individual* results per post.
                    // Let's assume QueryExperiment's first result set (postsData) contains nested results.
                    // *** IF postsData contains nested results: ***
                    // const postResults = post.results || []; // Assuming results are nested in post object

                    // *** IF statisticsData *was supposed* to contain individual results: ***
                     stat.post_id === post.post_id // This line assumes statistics has individual results with post_id
                );

                // Determine if results are nested within the post object itself
                // (Check your QueryExperiment procedure's first result set structure)
                const resultsToShow = post.results && Array.isArray(post.results) ? post.results : postResults;
                const hasNestedResults = post.results && Array.isArray(post.results);

                return (
                  <div key={post.post_id} className="post-item">
                    <div className="post-details">
                        <p><strong>Post ID:</strong> {post.post_id}</p>
                        <p><strong>User:</strong> {post.username} ({post.social_media_name})</p>
                        <p><strong>Time:</strong> {formatDateTime(post.post_time)}</p>
                        <p><strong>Content:</strong></p>
                        <div className="post-content">{post.content || <em>No content</em>}</div>
                    </div>
                    <div className="post-results">
                      <strong>Analysis Results:</strong>
                      {resultsToShow.length > 0 ? (
                        <ul>
                          {resultsToShow.map((result, index) => (
                            // Use a combination of keys for uniqueness if field_name can repeat per post
                            <li key={`${result.field_name}-${index}`}>
                              <strong>{result.field_name}:</strong> {result.value !== null && result.value !== undefined ? String(result.value) : <em>N/A</em>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p><em>No analysis results found for this post.</em></p>
                      )}
                      {/* Add a note if we are relying on the potentially incorrect 'statistics' filtering */}
                      {!hasNestedResults && postResults.length > 0 && (
                          <p style={{fontSize: '0.8em', color: '#6c757d', marginTop: '5px'}}>
                              (Results filtered from overall statistics - verify backend procedure if inaccurate)
                          </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      )}
    </div>
  );
}

export default QueryExperimentPage; 