import React, { useState } from 'react';
import apiService from '../services/apiService';
import './QueryPostsPage.css'; // Optional: Add some basic styling

function QueryPostsPage() {
  // --- State for Flexible Query ---
  const [queryCriteria, setQueryCriteria] = useState({
    socialMedia: '',
    startDate: '',
    endDate: '',
    username: '',
    firstName: '',
    lastName: '',
  });

  // --- State for Specific Queries ---
  const [specificSocialMediaQuery, setSpecificSocialMediaQuery] = useState('');
  const [specificDateRangeQuery, setSpecificDateRangeQuery] = useState({ startDate: '', endDate: '' });
  const [specificUserQuery, setSpecificUserQuery] = useState({ username: '', socialMedia: '' });
  const [specificNameQuery, setSpecificNameQuery] = useState({ firstName: '', lastName: '' });

  // --- State for Results and UI Feedback ---
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentQueryType, setCurrentQueryType] = useState('flexible'); // Track which query is active

  // --- Handlers for Flexible Query ---
  const handleFlexibleChange = (e) => {
    setQueryCriteria({ ...queryCriteria, [e.target.name]: e.target.value });
  };

  const handleFlexibleSubmit = async (e) => {
    e.preventDefault();
    setCurrentQueryType('flexible');
    await executeQuery(queryCriteria);
  };

  // --- Handlers for Specific Queries ---
  const handleSpecificSocialMediaChange = (e) => setSpecificSocialMediaQuery(e.target.value);
  const handleSpecificDateRangeChange = (e) => setSpecificDateRangeQuery({ ...specificDateRangeQuery, [e.target.name]: e.target.value });
  const handleSpecificUserChange = (e) => setSpecificUserQuery({ ...specificUserQuery, [e.target.name]: e.target.value });
  const handleSpecificNameChange = (e) => setSpecificNameQuery({ ...specificNameQuery, [e.target.name]: e.target.value });

  const handleSpecificSocialMediaSubmit = async (e) => {
    e.preventDefault();
    setCurrentQueryType('specificSocialMedia');
    await executeQuery({ socialMedia: specificSocialMediaQuery });
  };

  const handleSpecificDateRangeSubmit = async (e) => {
    e.preventDefault();
    setCurrentQueryType('specificDateRange');
    await executeQuery({ startDate: specificDateRangeQuery.startDate, endDate: specificDateRangeQuery.endDate });
  };

  const handleSpecificUserSubmit = async (e) => {
    e.preventDefault();
    setCurrentQueryType('specificUser');
    await executeQuery({ username: specificUserQuery.username, socialMedia: specificUserQuery.socialMedia });
  };

  const handleSpecificNameSubmit = async (e) => {
    e.preventDefault();
    setCurrentQueryType('specificName');
    await executeQuery({ firstName: specificNameQuery.firstName, lastName: specificNameQuery.lastName });
  };


  // --- Central Query Execution Function ---
  const executeQuery = async (criteria) => {
    setLoading(true);
    setMessage('');
    setResults([]); // Clear previous results

    // Ensure only non-empty values are sent, others default to null/undefined
    const activeCriteria = Object.entries(criteria)
      .filter(([key, value]) => value !== null && value !== '')
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    console.log("Executing query with criteria:", activeCriteria);

    try {
      const response = await apiService.queryPosts(activeCriteria);
      // Ensure response.data is always an array
      const data = Array.isArray(response.data) ? response.data : [];
      setResults(data);
      setMessage(data.length === 0 ? 'No posts found matching criteria.' : `${data.length} post(s) found.`);
    } catch (error) {
      console.error("Error querying posts:", error); // Log the full error
      setMessage(`Error querying posts: ${error.response?.data?.message || error.message}`);
      setResults([]); // Clear results on error
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
    <div className="query-posts-container">
      <h1>Query Posts</h1>

      {/* --- Flexible Query Form --- */}
      <div className="query-section">
        <h2>Flexible Query</h2>
        <form onSubmit={handleFlexibleSubmit} className="query-form flexible-query-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="flex_socialMedia">Social Media:</label>
              <input type="text" id="flex_socialMedia" name="socialMedia" value={queryCriteria.socialMedia} onChange={handleFlexibleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="flex_username">Username:</label>
              <input type="text" id="flex_username" name="username" value={queryCriteria.username} onChange={handleFlexibleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="flex_startDate">Start Date:</label>
              <input type="datetime-local" id="flex_startDate" name="startDate" value={queryCriteria.startDate} onChange={handleFlexibleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="flex_endDate">End Date:</label>
              <input type="datetime-local" id="flex_endDate" name="endDate" value={queryCriteria.endDate} onChange={handleFlexibleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="flex_firstName">First Name:</label>
              <input type="text" id="flex_firstName" name="firstName" value={queryCriteria.firstName} onChange={handleFlexibleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="flex_lastName">Last Name:</label>
              <input type="text" id="flex_lastName" name="lastName" value={queryCriteria.lastName} onChange={handleFlexibleChange} />
            </div>
          </div>
          <button type="submit" disabled={loading}>
            {loading && currentQueryType === 'flexible' ? 'Querying...' : 'Run Flexible Query'}
          </button>
        </form>
      </div>

      <hr className="section-divider" />

      {/* --- Specific Query Sections --- */}
      <h2>Specific Queries</h2>
      <div className="specific-queries-container">

        {/* Query by Social Media */}
        <div className="query-section specific-query">
          <form onSubmit={handleSpecificSocialMediaSubmit} className="query-form">
            <div className="form-group">
              <label htmlFor="spec_socialMedia">Find posts by Social Media:</label>
              <input
                type="text"
                id="spec_socialMedia"
                name="socialMedia"
                value={specificSocialMediaQuery}
                onChange={handleSpecificSocialMediaChange}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading && currentQueryType === 'specificSocialMedia' ? 'Querying...' : 'Find by Platform'}
            </button>
          </form>
        </div>

        {/* Query by Date Range */}
        <div className="query-section specific-query">
          <form onSubmit={handleSpecificDateRangeSubmit} className="query-form">
             <div className="form-group">
               <label htmlFor="spec_startDate">Find posts between Start Date:</label>
               <input
                 type="datetime-local"
                 id="spec_startDate"
                 name="startDate"
                 value={specificDateRangeQuery.startDate}
                 onChange={handleSpecificDateRangeChange}
                 required
               />
             </div>
             <div className="form-group">
               <label htmlFor="spec_endDate">and End Date:</label>
               <input
                 type="datetime-local"
                 id="spec_endDate"
                 name="endDate"
                 value={specificDateRangeQuery.endDate}
                 onChange={handleSpecificDateRangeChange}
                 required
               />
             </div>
            <button type="submit" disabled={loading}>
              {loading && currentQueryType === 'specificDateRange' ? 'Querying...' : 'Find by Date Range'}
            </button>
          </form>
        </div>

        {/* Query by Username and Media */}
        <div className="query-section specific-query">
          <form onSubmit={handleSpecificUserSubmit} className="query-form">
             <div className="form-group">
               <label htmlFor="spec_username">Find posts by Username:</label>
               <input
                 type="text"
                 id="spec_username"
                 name="username"
                 value={specificUserQuery.username}
                 onChange={handleSpecificUserChange}
                 required
               />
             </div>
             <div className="form-group">
               <label htmlFor="spec_userSocialMedia">on Social Media:</label>
               <input
                 type="text"
                 id="spec_userSocialMedia"
                 name="socialMedia"
                 value={specificUserQuery.socialMedia}
                 onChange={handleSpecificUserChange}
                 required
               />
             </div>
            <button type="submit" disabled={loading}>
              {loading && currentQueryType === 'specificUser' ? 'Querying...' : 'Find by User/Platform'}
            </button>
          </form>
        </div>

        {/* Query by First/Last Name */}
        <div className="query-section specific-query">
          <form onSubmit={handleSpecificNameSubmit} className="query-form">
             <div className="form-group">
               <label htmlFor="spec_firstName">Find posts by First Name:</label>
               <input
                 type="text"
                 id="spec_firstName"
                 name="firstName"
                 value={specificNameQuery.firstName}
                 onChange={handleSpecificNameChange}
               />
             </div>
             <div className="form-group">
               <label htmlFor="spec_lastName">and/or Last Name:</label>
               <input
                 type="text"
                 id="spec_lastName"
                 name="lastName"
                 value={specificNameQuery.lastName}
                 onChange={handleSpecificNameChange}
               />
             </div>
             <p className="note">(Requires at least one name)</p>
            <button type="submit" disabled={loading || (!specificNameQuery.firstName && !specificNameQuery.lastName)}>
              {loading && currentQueryType === 'specificName' ? 'Querying...' : 'Find by Name'}
            </button>
          </form>
        </div>
      </div>

      <hr className="section-divider" />

      {/* --- Results Area --- */}
      {message && <p className={`message ${message.startsWith('Error') ? 'error' : 'success'}`}>{message}</p>}

      {results.length > 0 && (
        <div className="results-section">
          <h3>Results</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Post ID</th>
                <th>Platform</th>
                <th>Username</th>
                <th>Content</th>
                <th>Post Time</th>
                {/* Conditionally render based on actual data */}
                {results[0]?.first_name && <th>First Name</th>}
                {results[0]?.last_name && <th>Last Name</th>}
                {results[0]?.associated_projects && <th>Associated Projects</th>}
              </tr>
            </thead>
            <tbody>
              {results.map((post) => (
                // Use a unique key, preferably post.post_id if available and unique
                <tr key={post.post_id || Math.random()}>
                  <td>{post.post_id ?? 'N/A'}</td>
                  {/* Adjust access based on actual column name from SP */}
                  <td>{post.social_media_name ?? 'N/A'}</td>
                  <td>{post.username ?? 'N/A'}</td>
                  <td className="content-cell">{post.content ?? ''}</td>
                  <td>{formatDateTime(post.post_time)}</td>
                  {/* Conditionally render based on actual data */}
                  {post.hasOwnProperty('first_name') && <td>{post.first_name ?? ''}</td>}
                  {post.hasOwnProperty('last_name') && <td>{post.last_name ?? ''}</td>}
                  {post.hasOwnProperty('associated_projects') && (
                     <td>{post.associated_projects ?? 'None'}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default QueryPostsPage; 