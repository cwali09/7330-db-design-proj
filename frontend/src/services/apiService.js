import axios from 'axios';

// Determine the base URL for the API.
// Use the backend port defined in the backend's .env file (or default).
// Make sure the backend server is running.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Project Endpoints ---
const createProject = (projectData) => {
  return apiClient.post('/projects', projectData);
};

const associatePosts = (projectName, postIds) => {
  // Ensure projectName is URL-encoded if it might contain special characters
  const encodedProjectName = encodeURIComponent(projectName);
  return apiClient.post(`/projects/${encodedProjectName}/posts`, { postIds });
};

const addAnalysisResult = (projectName, resultData) => {
  const encodedProjectName = encodeURIComponent(projectName);
  // Assuming resultData is { postId, fieldName, value }
  return apiClient.post(`/projects/${encodedProjectName}/results`, resultData);
};

const addProjectField = (projectName, fieldData) => {
  const encodedProjectName = encodeURIComponent(projectName);
  // fieldData should be { field_name: '...', description: '...' }
  return apiClient.post(`/projects/${encodedProjectName}/fields`, fieldData);
};

// --- Social Media Platform Endpoints ---
const createSocialMediaPlatform = (platformData) => {
    // platformData should be { name: '...' }
    return apiClient.post('/social-media', platformData);
};

// Optional: Function to get existing platforms
const getSocialMediaPlatforms = () => {
    return apiClient.get('/social-media');
};

// --- User Account Endpoints ---
const createUserAccount = (userData) => {
    // userData should match the fields expected by POST /api/users
    return apiClient.post('/users', userData);
};

// --- Post Endpoints ---
// Creates a new post. Expects { social_media_name, username, content }.
// post_time is set automatically by the backend.
const createPost = (postData) => {
    // postData should be { social_media_name, username, content }
    return apiClient.post('/posts', postData);
};

// --- Post Query Endpoint ---
const queryPosts = (criteria) => {
  // Remove empty criteria before sending
  const activeCriteria = Object.entries(criteria)
    .filter(([key, value]) => value !== null && value !== '')
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});

  return apiClient.get('/posts/query', { params: activeCriteria });
};

// --- Experiment Query Endpoint ---
const queryExperiment = (projectName) => {
  const encodedProjectName = encodeURIComponent(projectName);
  return apiClient.get(`/projects/${encodedProjectName}/experiment`);
};

// Export functions
const apiService = {
  createProject,
  associatePosts,
  addProjectField,
  addAnalysisResult,
  createSocialMediaPlatform,
  getSocialMediaPlatforms,
  createUserAccount,
  createPost,
  queryPosts,
  queryExperiment,
};

export default apiService; 