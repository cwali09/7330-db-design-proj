import React, { useState } from 'react';
import apiService from '../services/apiService';
import './QueryPostsThenExperimentsPage.css'; // Create this CSS file
import { formatDateTime, truncateContent } from '../utils/formatters'; // Assuming you have these utils

function QueryPostsThenExperimentsPage() {
    // --- State ---
    const [stage, setStage] = useState('queryPosts'); // 'queryPosts', 'showPosts', 'showExperiments'
    const [postQueryCriteria, setPostQueryCriteria] = useState({
        username: '',
        socialMediaName: '',
        startDate: '',
        endDate: '',
        contentKeyword: ''
    });
    const [foundPosts, setFoundPosts] = useState([]);
    const [foundExperiments, setFoundExperiments] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingExperiments, setLoadingExperiments] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success', 'error', 'info'

    // --- Handlers ---
    const handlePostQueryChange = (e) => {
        const { name, value } = e.target;
        setPostQueryCriteria(prev => ({ ...prev, [name]: value }));
    };

    const showMessage = (text, type = 'info') => {
        setMessage({ text, type });
    };

    const handlePostQuerySubmit = async (e) => {
        e.preventDefault();
        setLoadingPosts(true);
        setFoundPosts([]);
        setFoundExperiments([]); // Clear previous experiment results
        setStage('queryPosts'); // Reset stage visually
        showMessage('Searching for posts...', 'info');

        try {
            const response = await apiService.queryPosts(postQueryCriteria);
            if (response.data && response.data.length > 0) {
                setFoundPosts(response.data);
                showMessage(`Found ${response.data.length} post(s).`, 'success');
                setStage('showPosts'); // Move to next stage
            } else {
                showMessage('No posts found matching the criteria.', 'info');
                setStage('queryPosts'); // Stay on query stage
            }
        } catch (error) {
            console.error("Error querying posts:", error);
            showMessage(`Error querying posts: ${error.response?.data?.message || error.message}`, 'error');
            setStage('queryPosts'); // Stay on query stage
        } finally {
            setLoadingPosts(false);
        }
    };

    const handleFindExperiments = async () => {
        if (foundPosts.length === 0) {
            showMessage('No posts available to find experiments for.', 'error');
            return;
        }

        const postIds = foundPosts.map(post => post.post_id);
        setLoadingExperiments(true);
        setFoundExperiments([]);
        showMessage('Searching for associated experiments...', 'info');
        setStage('showPosts'); // Keep showing posts while loading experiments

        try {
            const response = await apiService.findExperimentsByPosts(postIds);
            // The backend returns { message, experiments: [...] }
            if (response.data && response.data.experiments && response.data.experiments.length > 0) {
                setFoundExperiments(response.data.experiments);
                showMessage(response.data.message || `Found ${response.data.experiments.length} associated experiment(s).`, 'success');
                setStage('showExperiments'); // Move to final stage
            } else {
                showMessage(response.data.message || 'No experiments found associated with these posts.', 'info');
                // Decide if you want to stay on 'showPosts' or move to 'showExperiments' with a message
                setStage('showExperiments'); // Move to final stage to show the "no results" message there
            }
        } catch (error) {
            console.error("Error finding experiments by posts:", error);
            showMessage(`Error finding experiments: ${error.response?.data?.message || error.message}`, 'error');
            setStage('showPosts'); // Revert stage if error occurs
        } finally {
            setLoadingExperiments(false);
        }
    };

    const handleReset = () => {
        setStage('queryPosts');
        setPostQueryCriteria({ username: '', socialMediaName: '', startDate: '', endDate: '', contentKeyword: '' });
        setFoundPosts([]);
        setFoundExperiments([]);
        setMessage({ text: '', type: '' });
        setLoadingPosts(false);
        setLoadingExperiments(false);
    };

    // --- Rendering ---
    return (
        <div className="query-posts-experiments-container">
            <h1>Query Posts & Find Associated Experiments</h1>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Stage 1: Post Query Form */}
            <div className="query-section">
                <h2>Step 1: Find Posts</h2>
                <form onSubmit={handlePostQuerySubmit} className="query-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="username">Username:</label>
                            <input type="text" id="username" name="username" value={postQueryCriteria.username} onChange={handlePostQueryChange} maxLength="40" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="socialMediaName">Social Media:</label>
                            <input type="text" id="socialMediaName" name="socialMediaName" value={postQueryCriteria.socialMediaName} onChange={handlePostQueryChange} maxLength="50" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="startDate">Start Date:</label>
                            <input type="date" id="startDate" name="startDate" value={postQueryCriteria.startDate} onChange={handlePostQueryChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="endDate">End Date:</label>
                            <input type="date" id="endDate" name="endDate" value={postQueryCriteria.endDate} onChange={handlePostQueryChange} />
                        </div>
                    </div>
                    <div className="form-row">
                         <div className="form-group full-width">
                             <label htmlFor="contentKeyword">Content Keyword:</label>
                             <input type="text" id="contentKeyword" name="contentKeyword" value={postQueryCriteria.contentKeyword} onChange={handlePostQueryChange} />
                         </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" disabled={loadingPosts}>
                            {loadingPosts ? 'Searching Posts...' : 'Search Posts'}
                        </button>
                         <button type="button" onClick={handleReset} disabled={loadingPosts || loadingExperiments}>
                             Start Over
                         </button>
                    </div>
                </form>
            </div>

            {/* Stage 2: Show Found Posts & Trigger Experiment Search */}
            {stage === 'showPosts' && !loadingPosts && foundPosts.length > 0 && (
                <div className="results-section">
                    <h2>Step 2: Found Posts ({foundPosts.length})</h2>
                    <p>Review the posts found below. Click the button to find experiments associated with these specific posts.</p>
                    <button onClick={handleFindExperiments} disabled={loadingExperiments} className="find-experiments-button">
                        {loadingExperiments ? 'Finding Experiments...' : 'Find Associated Experiments'}
                    </button>
                    <ul className="simple-post-list">
                        {foundPosts.map(post => (
                            <li key={post.post_id}>
                                <strong>ID: {post.post_id}</strong> | User: {post.username} ({post.social_media_name}) | Time: {formatDateTime(post.post_time)} | Content: "{truncateContent(post.content, 100)}"
                            </li>
                        ))}
                    </ul>
                </div>
            )}

             {/* Loading indicator for experiments */}
             {loadingExperiments && stage === 'showPosts' && <p><em>Loading associated experiments...</em></p>}


            {/* Stage 3: Show Found Experiments */}
            {stage === 'showExperiments' && !loadingExperiments && (
                <div className="results-section">
                    <h2>Step 3: Associated Experiments</h2>
                    {foundExperiments.length > 0 ? (
                        foundExperiments.map((expData, index) => (
                            <div key={expData.project?.project_name || index} className="experiment-item">
                                <h3>Experiment: {expData.project?.project_name}</h3>
                                <div className="experiment-details">
                                    <p><strong>Manager:</strong> {expData.project?.manager_first_name} {expData.project?.manager_last_name}</p>
                                    <p><strong>Institute:</strong> {expData.project?.institute_name}</p>
                                    <p><strong>Dates:</strong> {formatDateTime(expData.project?.start_date, false)} to {formatDateTime(expData.project?.end_date, false)}</p>
                                </div>

                                {/* Display Posts within this experiment - similar to QueryExperimentPage */}
                                <h4>Posts & Results in this Experiment:</h4>
                                {expData.posts && expData.posts.length > 0 ? (
                                    expData.posts.map(post => (
                                        <div key={post.post_id} className="post-item-nested">
                                            <div className="post-details-nested">
                                                <p><strong>Post ID: {post.post_id}</strong> {foundPosts.some(fp => fp.post_id === post.post_id) ? <span className="highlight-post">(Matched Query)</span> : ''}</p>
                                                <p>User: {post.username} ({post.social_media_name})</p>
                                                <p>Time: {formatDateTime(post.post_time)}</p>
                                                <p className="post-content-nested">Content: {post.content}</p>
                                            </div>
                                            <div className="post-results-nested">
                                                <strong>Analysis Results:</strong>
                                                {post.results && post.results.length > 0 ? (
                                                    <ul>
                                                        {post.results.map((result, idx) => (
                                                            <li key={`${post.post_id}-${result.field_name}-${idx}`}>
                                                                <strong>{result.field_name}:</strong> {result.value ?? <em>(No result entered)</em>}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p><em>No analysis fields defined or results found for this post in this experiment.</em></p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p><em>No posts are currently associated with this experiment.</em></p>
                                )}

                                {/* Display Statistics - similar to QueryExperimentPage */}
                                <h4>Statistics for this Experiment:</h4>
                                {expData.statistics && expData.statistics.length > 0 ? (
                                     <table className="statistics-table">
                                         <thead>
                                             <tr>
                                                 <th>Field Name</th>
                                                 <th>Description</th>
                                                 <th>Completion (%)</th>
                                                 <th>Posts Analyzed / Total</th>
                                             </tr>
                                         </thead>
                                         <tbody>
                                             {expData.statistics.map((stat, idx) => (
                                                 <tr key={`${stat.field_name}-${idx}`}>
                                                     <td>{stat.field_name}</td>
                                                     <td>{stat.field_description || '-'}</td>
                                                     <td>{stat.completion_percentage}%</td>
                                                     <td>{stat.posts_with_result_for_field} / {stat.total_project_posts}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                ) : (
                                     <p><em>No statistics available (no fields defined for this project?).</em></p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p><em>{message.text.includes('No experiments found') ? message.text : 'No associated experiments found for the selected posts.'}</em></p>
                    )}
                </div>
            )}
        </div>
    );
}

export default QueryPostsThenExperimentsPage; 