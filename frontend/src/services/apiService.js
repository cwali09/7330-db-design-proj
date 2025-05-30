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
// Creates a new project (without fields).
// Expects projectData like: { name, start_date, ..., manager_last_name }
const createProject = (projectData) => {
  return apiClient.post('/projects', projectData);
};

// Adds multiple analysis fields to an existing project.
// Expects fieldsData like: [{ field_name, description }, ...]
const addProjectFields = (projectName, fieldsData) => {
  const encodedProjectName = encodeURIComponent(projectName);
  // Send the array of fields in the request body
  return apiClient.post(`/projects/${encodedProjectName}/fields`, { fields: fieldsData });
};

const associatePosts = (projectName, postIds) => {
  // Ensure projectName is URL-encoded if it might contain special characters
  const encodedProjectName = encodeURIComponent(projectName);
  return apiClient.post(`/projects/${encodedProjectName}/posts`, { postIds });
};

// --- Analysis Result Endpoints ---
// Adds a single analysis result for a specific post within a project.
// Expects resultData like: { projectName, postId, fieldName, value }
const addAnalysisResult = (resultData) => {
  // Assuming the backend route is POST /api/results
  return apiClient.post('/results', resultData);
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

// Fetches posts for a specific user account
const getPostsByUser = (socialMediaName, username) => {
    return apiClient.get('/posts/by-user', {
        params: { socialMediaName, username }
    });
};

// --- Function to get simple post list ---
const getAllPostsList = () => {
    return apiClient.get('/posts/list');
};

// --- NEW: Function to find experiments by post IDs ---
const findExperimentsByPosts = (postIds) => {
    // Use POST request as defined in the backend
    return apiClient.post('/experiments/by-posts', { postIds });
};
// --- End NEW Function ---

// --- Institute Management ---
const getInstitutes = () => apiClient.get('/institutes');
const createInstitute = (instituteData) => apiClient.post('/institutes', instituteData); // If you add institute creation form

// --- Manager Management ---
const getManagers = () => apiClient.get('/managers');
const createManager = (managerData) => apiClient.post('/managers', managerData); // If you add manager creation form

// Modified: Accepts optional platform to filter users
const getAllUsersList = (platform) => {
    const params = platform ? { platform } : {};
    return apiClient.get('/users', { params });
};

// Export functions
const apiService = {
  createProject,
  addProjectFields,
  associatePosts,
  addAnalysisResult,
  createSocialMediaPlatform,
  getSocialMediaPlatforms,
  createUserAccount,
  createPost,
  queryPosts,
  queryExperiment,
  getPostsByUser,
  getAllPostsList,
  findExperimentsByPosts,
  getInstitutes,
  createInstitute,
  getManagers,
  createManager,
  getAllUsersList
};

export default apiService; 