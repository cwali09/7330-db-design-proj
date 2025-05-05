import React, { useState } from 'react';
import apiService from '../services/apiService';

function QueryPostsPage() {
  const [queryCriteria, setQueryCriteria] = useState({
    socialMedia: '',
    startDate: '',
    endDate: '',
    username: '',
    firstName: '',
    lastName: '',
  });
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setQueryCriteria({ ...queryCriteria, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setResults([]);
    try {
      const response = await apiService.queryPosts(queryCriteria);
      setResults(response.data);
      setMessage(response.data.length === 0 ? 'No posts found matching criteria.' : '');
    } catch (error) {
      setMessage(`Error querying posts: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Query Posts</h2>
      <form onSubmit={handleSubmit}>
        <h3>Search Criteria</h3>
        <div className="form-group">
          <label htmlFor="socialMedia">Social Media:</label>
          <input type="text" id="socialMedia" name="socialMedia" value={queryCriteria.socialMedia} onChange={handleChange} />
        </div>
         <div className="form-group">
          <label htmlFor="startDate">Start Date:</label>
          <input type="date" id="startDate" name="startDate" value={queryCriteria.startDate} onChange={handleChange} />
        </div>
         <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input type="date" id="endDate" name="endDate" value={queryCriteria.endDate} onChange={handleChange} />
        </div>
         <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" value={queryCriteria.username} onChange={handleChange} />
        </div>
         <div className="form-group">
          <label htmlFor="firstName">First Name:</label>
          <input type="text" id="firstName" name="firstName" value={queryCriteria.firstName} onChange={handleChange} />
        </div>
         <div className="form-group">
          <label htmlFor="lastName">Last Name:</label>
          <input type="text" id="lastName" name="lastName" value={queryCriteria.lastName} onChange={handleChange} />
        </div>
        <p><small>Note: Combine criteria using AND logic.</small></p>
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search Posts'}
        </button>
      </form>

      {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'blue' }}>{message}</p>}

      {results.length > 0 && (
        <div className="results-container">
          <h3>Query Results</h3>
          {results.map((post, index) => (
            <div key={index} className="post-item">
              <p><strong>Text:</strong> {post.text}</p>
              <p><strong>Poster:</strong> {post.poster.socialMedia} / {post.poster.username}</p>
              <p><strong>Time:</strong> {new Date(post.time).toLocaleString()}</p>
              <p><strong>Associated Projects:</strong> {post.associatedProjects.join(', ') || 'None'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QueryPostsPage; 