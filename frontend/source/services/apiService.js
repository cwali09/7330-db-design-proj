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
  return apiClient.get(`/experiments/${encodedProjectName}`);
};


// Export functions
const apiService = {
  createProject,
  associatePosts,
  addAnalysisResult,
  queryPosts,
  queryExperiment,
};

export default apiService; 