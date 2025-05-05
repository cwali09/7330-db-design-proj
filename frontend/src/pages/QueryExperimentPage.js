import React, { useState } from 'react';
import apiService from '../services/apiService';
import './QueryExperimentPage.css'; // Create this CSS file

function QueryExperimentPage() {
  const [projectName, setProjectName] = useState('');
  const [experimentData, setExperimentData] = useState(null); // Will hold { posts: [], statistics: [] }
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
    setExperimentData(null); // Clear previous results

    try {
      const response = await apiService.queryExperiment(projectName);
      setExperimentData(response.data); // Store { posts: [...], statistics: [...] }
      if (response.data?.posts?.length === 0) {
        setMessage(`Project '${projectName}' found, but no posts are associated with it yet.`);
      } else {
         setMessage(''); // Clear message on success with data
      }
    } catch (error) {
      console.error("Error querying experiment:", error);
      setExperimentData(null); // Clear data on error
      if (error.response?.status === 404) {
        setMessage(error.response.data.message || `Project '${projectName}' not found.`);
      } else {
        setMessage(`Error querying experiment: ${error.response?.data?.message || error.message}`);
      }
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

      {message && <p className={`message ${message.startsWith('Error') ? 'error' : 'success'}`}>{message}</p>}

      {loading && <p>Loading experiment data...</p>}

      {experimentData && (
        <div className="results-container">
          {/* --- Statistics Section --- */}
          {experimentData.statistics && experimentData.statistics.length > 0 && (
            <div className="statistics-section">
              <h2>Field Completion Statistics</h2>
              <p>Total Posts in Project: {experimentData.statistics[0]?.total_project_posts ?? 0}</p>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Field Name</th>
                    <th>Posts with Result</th>
                    <th>Completion (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {experimentData.statistics.map((stat, index) => (
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
           {experimentData.statistics && experimentData.statistics.length === 0 && experimentData.posts?.length > 0 && (
             <p><em>No analysis fields defined or results entered for this project yet.</em></p>
           )}


          {/* --- Posts Section --- */}
          {experimentData.posts && experimentData.posts.length > 0 && (
            <div className="posts-section">
              <h2>Associated Posts</h2>
              {experimentData.posts.map((post) => (
                <div key={post.post_id} className="post-item">
                  <div className="post-details">
                    <p><strong>Post ID:</strong> {post.post_id}</p>
                    <p><strong>Platform:</strong> {post.social_media_name}</p>
                    <p><strong>Username:</strong> {post.username}</p>
                    <p><strong>Time:</strong> {formatDateTime(post.post_time)}</p>
                    <p><strong>Content:</strong></p>
                    <pre className="post-content">{post.content}</pre>
                  </div>
                  <div className="post-results">
                    <strong>Analysis Results for this Project:</strong>
                    {post.results && post.results.length > 0 ? (
                      <ul>
                        {post.results.map((result, idx) => (
                          <li key={idx}>
                            <strong>{result.fieldName}:</strong> {result.value}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p><em>No results entered for this post in this project.</em></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QueryExperimentPage; 