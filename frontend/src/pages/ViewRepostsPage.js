import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { formatDateTime, truncateContent } from '../utils/formatters'; // Assuming you have this
import './ViewRepostsPage.css'; // Create this CSS file

function ViewRepostsPage() {
    const [repostedPosts, setRepostedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

     // Fetch reposted posts on component mount
    useEffect(() => {
        const fetchReposts = async () => {
            setLoading(true);
            setMessage({ text: '', type: '' }); // Clear previous messages
            try {
                const response = await apiService.getRepostedPosts();
                setRepostedPosts(response.data || []);
                if (!response.data || response.data.length === 0) {
                     setMessage({ text: 'No reposted posts found in the database.', type: 'info' });
                }
            } catch (error) {
                console.error("Error fetching reposted posts:", error);
                setMessage({ text: `Failed to load reposted posts: ${error.message}`, type: 'error' });
                setRepostedPosts([]); // Clear data on error
            } finally {
                setLoading(false);
            }
        };
        fetchReposts();
    }, []); // Empty dependency array ensures this runs once on mount

    return (
        <div className="view-reposts-container">
            <h1>View All Reposted Posts</h1>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {loading ? (
                <p>Loading reposted posts...</p>
            ) : repostedPosts.length > 0 ? (
                <table className="reposts-table">
                    <thead>
                        <tr>
                            <th>Repost ID</th>
                            <th>Original ID</th>
                            <th>User</th>
                            <th>Platform</th>
                            <th>Content Snippet</th>
                            <th>Repost Time (Action)</th>
                            <th>Post Time (Actual)</th>
                            <th>Likes</th>
                            <th>Dislikes</th>
                            <th>Multimedia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {repostedPosts.map(post => (
                            <tr key={post.post_id}>
                                <td>{post.post_id}</td>
                                <td>{post.original_post_id}</td>
                                <td>{post.username}</td>
                                <td>{post.social_media_name}</td>
                                <td>{truncateContent(post.content, 80)}</td>
                                <td>{formatDateTime(post.repost_time)}</td>
                                <td>{formatDateTime(post.post_time)}</td>
                                <td>{post.likes}</td>
                                <td>{post.dislikes}</td>
                                <td>{post.has_multimedia ? 'Yes' : 'No'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                 !loading && !message.text && <p>No reposted posts found.</p> // Show only if not loading and no specific message
            )}
        </div>
    );
}

export default ViewRepostsPage; 