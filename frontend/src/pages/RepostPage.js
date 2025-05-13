import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { formatDateTime, truncateContent } from '../utils/formatters'; // Assuming you have this
import './RepostPage.css'; // Create this CSS file

function RepostPage() {
    const [socialMediaName, setSocialMediaName] = useState('');
    const [username, setUsername] = useState('');
    const [socialMediaPlatforms, setSocialMediaPlatforms] = useState([]);
    const [foundPosts, setFoundPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false); // For repost button
    const [message, setMessage] = useState({ text: '', type: '' });

    // Fetch platforms for dropdown
    useEffect(() => {
        const fetchPlatforms = async () => {
            try {
                const response = await apiService.getSocialMediaPlatforms();
                setSocialMediaPlatforms(response.data || []);
            } catch (error) {
                console.error("Error fetching platforms:", error);
                setMessage({ text: 'Failed to load social media platforms.', type: 'error' });
            }
        };
        fetchPlatforms();
    }, []);

    const showMessage = (text, type = 'info') => {
        setMessage({ text, type });
    };

    const handleFindPosts = async (e) => {
        e.preventDefault();
        if (!socialMediaName || !username.trim()) {
            showMessage('Please select a platform and enter a username.', 'error');
            return;
        }
        setLoadingPosts(true);
        setFoundPosts([]); // Clear previous results
        showMessage('Finding posts...', 'info');
        try {
            // Using the existing getUserPosts which expects query params
            const response = await apiService.getUserPosts(socialMediaName, username);
            if (response.data && response.data.length > 0) {
                setFoundPosts(response.data);
                showMessage(`Found ${response.data.length} posts.`, 'success');
            } else {
                setFoundPosts([]);
                showMessage('No posts found for this user.', 'info');
            }
        } catch (error) {
            console.error("Error finding user posts:", error);
            showMessage(`Error finding posts: ${error.message}`, 'error');
            setFoundPosts([]);
        } finally {
            setLoadingPosts(false);
        }
    };

    const handleRepost = async (originalPostId) => {
        setLoadingAction(true);
        showMessage(`Reposting post ID ${originalPostId}...`, 'info');
        try {
            const response = await apiService.createRepost(originalPostId);
            showMessage(`Successfully reposted post ID ${originalPostId}. New post ID: ${response.data.data.post_id}`, 'success');
            // Optionally: Refresh the found posts list or update UI somehow
        } catch (error) {
            console.error("Error creating repost:", error);
            showMessage(`Error reposting: ${error.message}`, 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div className="repost-page-container">
            <h1>Create a Repost</h1>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleFindPosts} className="find-posts-form">
                <h2>Find Original Post by User</h2>
                <div className="form-group">
                    <label htmlFor="repostSocialMedia">Social Media Platform:</label>
                    <select
                        id="repostSocialMedia"
                        value={socialMediaName}
                        onChange={(e) => setSocialMediaName(e.target.value)}
                    >
                        <option value="">-- Select Platform --</option>
                        {socialMediaPlatforms.map(platform => (
                            <option key={platform.name} value={platform.name}>{platform.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="repostUsername">Username:</label>
                    <input
                        type="text"
                        id="repostUsername"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength="40"
                    />
                </div>
                <button type="submit" disabled={loadingPosts || !socialMediaName || !username.trim()}>
                    {loadingPosts ? 'Finding...' : 'Find Posts'}
                </button>
            </form>

            {foundPosts.length > 0 && (
                <div className="found-posts-list">
                    <h2>Select Post to Repost</h2>
                    <ul>
                        {foundPosts.map(post => (
                            <li key={post.post_id} className="post-item">
                                <div className="post-details">
                                    <strong>ID:</strong> {post.post_id} <br />
                                    <strong>Time:</strong> {formatDateTime(post.post_time)} <br />
                                    <strong>Content:</strong> <pre>{truncateContent(post.content, 100)}</pre>
                                </div>
                                <button
                                    onClick={() => handleRepost(post.post_id)}
                                    disabled={loadingAction}
                                    className="repost-button"
                                >
                                    {loadingAction ? 'Reposting...' : 'Repost This'}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default RepostPage; 