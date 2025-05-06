import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import './QueryExperimentPage.css'; // Create this CSS file

function QueryExperimentPage() {
  const [projectName, setProjectName] = useState('');
  const [processedPosts, setProcessedPosts] = useState([]); // Will store unique posts with nested results
  const [statistics, setStatistics] = useState([]); // State to hold aggregate statistics
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleProjectNameChange = (e) => {
    setProjectName(e.target.value);
  };

  // --- Helper function to group results by post_id ---
  const groupResultsByPost = (postsData) => {
    if (!postsData || postsData.length === 0) {
      return [];
    }

    const postsMap = new Map();

    postsData.forEach(row => {
      const postId = row.post_id;
      // Extract result details from the row
      const result = {
        field_name: row.field_name,
        value: row.value,
        // Include other field-specific details if needed, e.g., field_description
        field_description: row.field_description
      };

      if (postsMap.has(postId)) {
        // If post already exists, add the result to its results array
        // Avoid adding if field_name is null/undefined (might indicate post has no results yet)
        if (result.field_name) {
            postsMap.get(postId).results.push(result);
        }
      } else {
        // If post is new, create its entry
        postsMap.set(postId, {
          // Store unique post details
          post_id: row.post_id,
          content: row.content,
          username: row.username,
          social_media_name: row.social_media_name,
          post_time: row.post_time,
          // Initialize results array
          // Add the first result only if field_name is valid
          results: result.field_name ? [result] : []
        });
      }
    });

    // Convert map values back to an array
    return Array.from(postsMap.values());
  };
  // --- End helper function ---


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setMessage('Please enter a project name.');
      return;
    }
    setLoading(true);
    setMessage('');
    setProcessedPosts([]); // Clear previous processed posts
    setStatistics([]); // Clear previous statistics

    try {
      console.log(`Fetching experiment data for project: ${projectName}`);
      const response = await apiService.queryExperiment(projectName);
      console.log("Full Axios Response Object:", response);

      const responseData = response.data;
      console.log("API Response Data:", responseData);

      if (response && responseData && Array.isArray(responseData.posts)) {
        const rawPostsData = responseData.posts;
        const statisticsData = Array.isArray(responseData.statistics) ? responseData.statistics : [];

        if (!Array.isArray(responseData.statistics)) {
            console.warn(
                "Backend API returned 'statistics' as type", typeof responseData.statistics,
                "instead of an array. Defaulting to []. Check 'QueryExperiment' procedure.",
                responseData.statistics
            );
        }

        // --- Process the raw posts data ---
        const groupedPosts = groupResultsByPost(rawPostsData);
        console.log("Processed (Grouped) Posts Data:", groupedPosts);
        setProcessedPosts(groupedPosts); // Store the grouped data
        // ---

        setStatistics(statisticsData); // Store the aggregate statistics

        // Adjust messages based on the *processed* posts count
        if (groupedPosts.length === 0 && statisticsData.length === 0) {
          setMessage(`Project '${projectName}' found, but it has no posts or analysis results.`);
        } else if (groupedPosts.length === 0) {
          // This case might be less likely now if postsData includes rows even without results,
          // but keep it for robustness. Check groupResultsByPost logic if needed.
          setMessage(`Project '${projectName}' found, but it has no associated posts (or posts with results).`);
        } else {
          setMessage(`Successfully fetched data for project '${projectName}'.`);
        }

      } else {
        console.error("Unexpected API response structure inside response.data:", responseData);
        let specificError = "Received unexpected data format from the server.";
        if (response && responseData) {
            if (!Array.isArray(responseData.posts)) specificError += " ('posts' was not an array or missing)";
        } else if (!response?.data) {
             specificError += " (Response data is missing)";
        }
        setMessage(specificError);
        setProcessedPosts([]); // Ensure clear on error
        setStatistics([]);
      }

    } catch (err) {
      console.error("Error fetching experiment data:", err);
      const backendErrorMessage = err.response?.data?.message;

      if (err.response && err.response.status === 404) {
        setMessage(backendErrorMessage || `Project '${projectName}' not found.`);
      } else {
        setMessage(backendErrorMessage || err.message || 'Failed to fetch experiment data. Please try again.');
      }
      setProcessedPosts([]); // Ensure clear on error
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

      {processedPosts.length > 0 && !loading && (
        <div className="results-container">
          {/* --- Statistics Section (Uses 'statistics' state) --- */}
          {statistics.length > 0 && (
            <div className="statistics-section">
              <h2>Field Completion Statistics</h2>
              {/* Assuming statistics array structure is: [{ field_name, posts_with_result_count, completion_percentage, total_project_posts }] */}
              {/* Display total posts once, e.g., from the first stat row if available */}
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
                      {/* Ensure completion_percentage is treated as number before toFixed */}
                      <td>{stat.completion_percentage != null ? Number(stat.completion_percentage).toFixed(2) : '0.00'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Message if no aggregate stats but posts exist */}
          {statistics.length === 0 && processedPosts.length > 0 && (
             <p><em>No aggregate analysis statistics found for this project.</em></p>
           )}

          {/* --- Posts Section (Uses 'processedPosts' state) --- */}
          <div className="posts-section">
              <h2>Associated Posts and Results</h2>
              {/* Map over the processed posts */}
              {processedPosts.map((post) => {
                // 'post' here is an object with post details and a 'results' array
                return (
                  <div key={post.post_id} className="post-item">
                    {/* Display Post Details Once */}
                    <div className="post-details">
                        <p><strong>Post ID:</strong> {post.post_id}</p>
                        <p><strong>User:</strong> {post.username} ({post.social_media_name})</p>
                        <p><strong>Time:</strong> {formatDateTime(post.post_time)}</p>
                        <p><strong>Content:</strong></p>
                        <div className="post-content">{post.content || <em>No content</em>}</div>
                    </div>
                    {/* Display Analysis Results for this Post */}
                    <div className="post-results">
                      <strong>Analysis Results:</strong>
                      {/* Map over the nested 'results' array */}
                      {post.results && post.results.length > 0 ? (
                        <ul>
                          {post.results.map((result, index) => (
                            <li key={`${result.field_name}-${index}`}> {/* Use field_name + index for key */}
                              <strong>{result.field_name}:</strong>
                              {/* Display the value */}
                              <span> {result.value !== null && result.value !== undefined ? String(result.value) : <em>N/A</em>}</span>
                              {/* Optionally display description if needed */}
                              {/* {result.field_description && <em style={{fontSize: '0.9em', marginLeft: '5px'}}>({result.field_description})</em>} */}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p><em>No analysis results found for this post.</em></p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      )}
       {/* Message if loading finished but no posts were found/processed */}
       {!loading && processedPosts.length === 0 && message && !message.includes('Failed') && !message.includes('Error') && (
           <p><em>{message.includes('found, but') ? message : `No posts found for project '${projectName}'.`}</em></p>
       )}
    </div>
  );
}

export default QueryExperimentPage; 