import React, { useState } from 'react';
import apiService from '../services/apiService';

function QueryExperimentPage() {
  const [projectName, setProjectName] = useState('');
  const [experimentData, setExperimentData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName) {
      setMessage('Please enter a project name.');
      return;
    }
    setLoading(true);
    setMessage('');
    setExperimentData(null);
    try {
      const response = await apiService.queryExperiment(projectName);
      setExperimentData(response.data);
    } catch (error) {
      setMessage(`Error querying experiment: ${error.response?.data?.message || error.message}`);
      setExperimentData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Query Experiment (Project) Details</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="projectName">Project Name:</label>
          <input
            type="text"
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Querying...' : 'Get Experiment Details'}
        </button>
      </form>

      {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'blue' }}>{message}</p>}

      {experimentData && (
        <div className="results-container">
          <h3>Details for Project: {experimentData.projectName}</h3>

          <h4>Field Completion Percentages:</h4>
          {experimentData.fieldCompletion?.length > 0 ? (
            <ul>
              {experimentData.fieldCompletion.map((field, index) => (
                <li key={index}>
                  <strong>{field.fieldName}:</strong> {field.percentage.toFixed(1)}%
                </li>
              ))}
            </ul>
          ) : (
            <p>No field completion data available (or no fields defined/results entered).</p>
          )}


          <h4>Associated Posts and Results:</h4>
          {experimentData.posts?.length > 0 ? (
            experimentData.posts.map((post) => (
              <div key={post.postId} className="post-item">
                <p><strong>Post ID:</strong> {post.postId}</p>
                <p><strong>Content:</strong> {post.content}</p>
                <p><strong>Poster:</strong> {post.socialMedia} / {post.username}</p>
                <p><strong>Time:</strong> {new Date(post.postTime).toLocaleString()}</p>
                <p><strong>Analysis Results:</strong></p>
                {post.results?.length > 0 ? (
                  <ul>
                    {post.results.map((result, idx) => (
                      <li key={idx}>
                        <strong>{result.fieldName}:</strong> {result.value}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p><em>No analysis results entered for this post in this project.</em></p>
                )}
              </div>
            ))
          ) : (
            <p>No posts found associated with this project.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default QueryExperimentPage; 