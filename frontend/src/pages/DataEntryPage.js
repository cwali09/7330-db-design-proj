import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService'; // Create this service file
import './DataEntryPage.css'; // Assuming you have or will create this

// Basic inline styles for tabs (consider moving to a CSS file for larger apps)
// REMOVED: tabStyles object is no longer needed as styles are in CSS

function DataEntryPage() {
  // --- State for Active Tab ---
  const [activeTab, setActiveTab] = useState('newProject'); // Default tab

  // --- State for Messages ---
  const [message, setMessage] = useState({ text: '', type: '' }); // { text: '...', type: 'success' | 'error' }

  // --- State for New Project (Modified) ---
  const [newProjectData, setNewProjectData] = useState({
    // Project Details
    name: '',
    start_date: '',
    end_date: '',
    description: '',
    // New Institute Details
    institute_name: '',
    // New Manager Details
    manager_id: '', // Assuming manager ID is provided by user
    manager_first_name: '',
    manager_last_name: '',
  });
  // REMOVED: institutes and managers state are no longer needed for this form
  // const [institutes, setInstitutes] = useState([]);
  // const [managers, setManagers] = useState([]);

  // --- State for New Field(s) ---
  const [fieldProjectName, setFieldProjectName] = useState(''); // Project to add fields to
  const [newFields, setNewFields] = useState([{ field_name: '', description: '' }]); // Array for bulk field creation

  // --- State for New Social Media Platform ---
  const [platformName, setPlatformName] = useState('');

  // --- State for New User Account ---
  const [userData, setUserData] = useState({
    social_media_name: '',
    username: '',
    first_name: '',
    last_name: '',
    country_birth: '',
    country_residence: '',
    age: '',
    gender: '',
    verified: false,
  });
  const [socialMediaPlatforms, setSocialMediaPlatforms] = useState([]); // For user account dropdown

  // --- State for New Post ---
  const [postData, setPostData] = useState({
    social_media_name: '',
    username: '',
    content: '',
    post_time: '',
    city: '',
    state: '',
    country: '',
    likes: 0,
    dislikes: 0,
    shares: 0,
    views: 0,
    url: '',
    location: '', // Consider if this duplicates city/state/country or is different
  });
  const [usersForPost, setUsersForPost] = useState([]); // For post dropdown
  const [loadingUsersForPost, setLoadingUsersForPost] = useState(false); // Loading indicator

  // --- State for Associate Posts ---
  const [assocProjectName, setAssocProjectName] = useState('');
  const [availablePosts, setAvailablePosts] = useState([]); // All posts for multi-select
  const [selectedPostIdsForAssociation, setSelectedPostIdsForAssociation] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false); // Loading indicator for posts dropdown

  // --- Fetch Data for Dropdowns (Modified: Removed Institute/Manager Fetch) ---
  useEffect(() => {
    // Fetch platforms for User Account tab
    const fetchPlatforms = async () => {
      try {
        const response = await apiService.getSocialMediaPlatforms();
        setSocialMediaPlatforms(response.data || []);
      } catch (error) {
        console.error("Error fetching social media platforms:", error);
        showMessage('Could not load social media platforms.', 'error');
      }
    };

    // Fetch all posts for the association dropdown
    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const response = await apiService.getAllPostsList();
        setAvailablePosts(response.data || []);
      } catch (error) {
        console.error("Error fetching available posts:", error);
        showMessage('Failed to load posts list for dropdown.', 'error');
        setAvailablePosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPlatforms();
    fetchPosts(); // Fetch posts for association

    // REMOVED: fetchInstitutes and fetchManagers calls are no longer needed here
    // fetchInstitutes();
    // fetchManagers();
  }, []);

  // --- Fetch Users Dynamically Based on Selected Platform for New Post ---
  useEffect(() => {
    const fetchUsersForPlatform = async () => {
      if (!postData.social_media_name) {
        setUsersForPost([]); // Clear users if no platform is selected
        return;
      }

      setLoadingUsersForPost(true);
      setMessage({ text: '', type: '' }); // Clear previous messages
      try {
        console.log(`[DataEntryPage] Fetching users for platform: ${postData.social_media_name}`);
        const response = await apiService.getAllUsersList(postData.social_media_name);
        setUsersForPost(response.data || []);
        if ((response.data || []).length === 0 && postData.social_media_name) {
            showMessage(`No users found for platform ${postData.social_media_name}. You can create users under the "New User Account" tab.`, 'info');
        }
      } catch (error) {
        let detailedErrorMessage = "An unexpected error occurred.";
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error(`[DataEntryPage] Error fetching users for platform ${postData.social_media_name} - Status: ${error.response.status}`, error.response.data);
          detailedErrorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        } else if (error.request) {
          // The request was made but no response was received
          console.error(`[DataEntryPage] Error fetching users for platform ${postData.social_media_name} - No response:`, error.request);
          detailedErrorMessage = "No response from server. Please check network connection and if the server is running.";
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error(`[DataEntryPage] Error fetching users for platform ${postData.social_media_name} - Request setup error:`, error.message);
          detailedErrorMessage = error.message;
        }
        showMessage(`Could not load users for platform ${postData.social_media_name}. Details: ${detailedErrorMessage}`, 'error');
        setUsersForPost([]);
      } finally {
        setLoadingUsersForPost(false);
      }
    };

    fetchUsersForPlatform();
  }, [postData.social_media_name]); // Dependency: fetch when platform changes

  // --- Utility Functions ---
  const showMessage = (text, type) => {
    setMessage({ text, type });
    // Optional: Clear message after some time
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // --- Handlers for Form Inputs ---

  // Handler for New Project form
  const handleNewProjectChange = (e) => {
    const { name, value } = e.target;
    setNewProjectData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handler for New Field form (individual field)
  const handleNewFieldChange = (index, e) => {
    const { name, value } = e.target;
    const updatedFields = [...newFields];
    updatedFields[index][name] = value;
    setNewFields(updatedFields);
  };

  // Add a new blank field entry
  const addFieldEntry = () => {
    setNewFields([...newFields, { field_name: '', description: '' }]);
  };

  // Remove a field entry
  const removeFieldEntry = (index) => {
    if (newFields.length > 1) { // Keep at least one field
      const updatedFields = newFields.filter((_, i) => i !== index);
      setNewFields(updatedFields);
    }
  };

  // Handler for New User Account form
  const handleUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handler for New Post form
  const handlePostChange = (e) => {
    const { name, value } = e.target;
    setPostData(prevData => ({
      ...prevData,
      [name]: value
    }));

    // If the platform changed, reset the selected user
    if (name === 'social_media_name') {
        setPostData(prevData => ({
            ...prevData,
            username: '' // Reset username when platform changes
        }));
    }
  };

  // Handler for multi-select dropdown
  const handleSelectedPostsChange = (e) => {
      const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
      // Ensure values are integers
      setSelectedPostIdsForAssociation(selectedOptions);
  };

  // --- Async Handlers for API Calls ---

  // Modified Submit Handler for New Project
  const handleNewProjectSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' }); // Clear previous messages

    // Basic validation (expand as needed)
    if (!newProjectData.name || !newProjectData.start_date || !newProjectData.end_date ||
        !newProjectData.institute_name || !newProjectData.manager_id ||
        !newProjectData.manager_first_name || !newProjectData.manager_last_name) {
      showMessage('All project, institute, and manager fields are required.', 'error');
      return;
    }
    if (new Date(newProjectData.end_date) < new Date(newProjectData.start_date)) {
      showMessage('Project end date cannot be before start date.', 'error');
      return;
    }
    // Add more specific validation (e.g., manager_id format, name lengths) if necessary

    try {
      // The payload now includes all details
      const response = await apiService.createProject(newProjectData); // Pass the whole state object
      showMessage(`Project '${response.data.data.project_name}' created successfully along with Institute and Manager!`, 'success');
      // Clear the form
      setNewProjectData({
        name: '', start_date: '', end_date: '', description: '',
        institute_name: '',
        manager_id: '', manager_first_name: '', manager_last_name: ''
      });
    } catch (error) {
      console.error("Error creating project/institute/manager:", error);
      showMessage(`Error: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // Handler for adding new fields to a project
  const handleAddFieldSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!fieldProjectName || newFields.some(field => !field.field_name)) {
      showMessage('Project Name and all Field Names are required.', 'error');
      return;
    }

    // Filter out empty description fields if needed, or validate them
    const fieldsPayload = newFields.map(field => ({
        field_name: field.field_name.trim(),
        description: field.description.trim() || null // Send null if description is empty
    }));


    try {
      const response = await apiService.addProjectFields(fieldProjectName, fieldsPayload);
      showMessage(response.data.message || 'Fields added successfully!', 'success');
      // Clear form
      setFieldProjectName('');
      setNewFields([{ field_name: '', description: '' }]);
    } catch (error) {
      console.error("Error adding project fields:", error);
      showMessage(`Error adding fields: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // Handler for creating a new social media platform
  const handlePlatformSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    if (!platformName.trim()) {
        showMessage('Platform name cannot be empty.', 'error');
        return;
    }
    try {
        const response = await apiService.createSocialMediaPlatform({ name: platformName });
        showMessage(`Platform '${response.data.data.name}' created successfully!`, 'success');
        setPlatformName(''); // Clear input
        // Optionally refresh platform list if needed elsewhere
        // fetchPlatforms();
    } catch (error) {
        console.error("Error creating platform:", error);
        showMessage(`Error creating platform: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // Handler for creating a new user account
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    // Add validation as needed
    if (!userData.social_media_name || !userData.username || !userData.first_name || !userData.last_name) {
        showMessage('Platform, Username, First Name, and Last Name are required.', 'error');
        return;
    }
    try {
        // Ensure age is a number or null/undefined if empty
        const payload = {
            ...userData,
            age: userData.age === '' ? null : parseInt(userData.age, 10),
            verified: userData.verified || false // Ensure boolean
        };
        const response = await apiService.createUserAccount(payload);
        showMessage(`User '${response.data.data.username}' on platform '${response.data.data.social_media_name}' created successfully!`, 'success');
        // Clear form
        setUserData({
            social_media_name: '', username: '', first_name: '', last_name: '',
            country_birth: '', country_residence: '', age: '', gender: '', verified: false,
        });
    } catch (error) {
        console.error("Error creating user account:", error);
        showMessage(`Error creating user: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // Handler for creating a new post
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    // Add validation
    if (!postData.social_media_name || !postData.username || !postData.content || !postData.post_time) {
        showMessage('Platform, Username, Content, and Post Time are required.', 'error');
        return;
    }
    try {
        // Ensure numeric fields are numbers
        const payload = {
            ...postData,
            likes: parseInt(postData.likes, 10) || 0,
            dislikes: parseInt(postData.dislikes, 10) || 0,
            shares: parseInt(postData.shares, 10) || 0,
            views: parseInt(postData.views, 10) || 0,
        };
        const response = await apiService.createPost(payload);
        showMessage(`Post created successfully! (ID: ${response.data.data.post_id})`, 'success');
        // Clear form
        setPostData({
            social_media_name: '', username: '', content: '', post_time: '',
            city: '', state: '', country: '', likes: 0, dislikes: 0, shares: 0, views: 0, url: '', location: '',
        });
    } catch (error) {
        console.error("Error creating post:", error);
        showMessage(`Error creating post: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // Handler for associating posts with a project
  const handleAssociatePostsSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!assocProjectName || selectedPostIdsForAssociation.length === 0) {
      showMessage('Project Name and at least one Post must be selected.', 'error');
      return;
    }

    try {
      const response = await apiService.associatePosts(assocProjectName, selectedPostIdsForAssociation);
      showMessage(response.data.message || 'Posts associated successfully!', 'success');
      // Clear form
      setAssocProjectName('');
      setSelectedPostIdsForAssociation([]);
      // Optionally refresh available posts if association changes their status
      // fetchPosts();
    } catch (error) {
      console.error("Error associating posts:", error);
      showMessage(`Error associating posts: ${error.response?.data?.message || error.message}`, 'error');
    }
  };


  // --- Render Logic ---
  return (
    <div className="data-entry-container">
      <h1>Data Entry</h1>

      {/* Tab Navigation */}
      <div className="tabs">
        <button onClick={() => setActiveTab('newProject')} className={activeTab === 'newProject' ? 'active' : ''}>New Project (+ Inst/Mgr)</button>
        <button onClick={() => setActiveTab('addFields')} className={activeTab === 'addFields' ? 'active' : ''}>Add Project Fields</button>
        <button onClick={() => setActiveTab('newPlatform')} className={activeTab === 'newPlatform' ? 'active' : ''}>New Platform</button>
        <button onClick={() => setActiveTab('newUser')} className={activeTab === 'newUser' ? 'active' : ''}>New User Account</button>
        <button onClick={() => setActiveTab('newPost')} className={activeTab === 'newPost' ? 'active' : ''}>New Post</button>
        <button onClick={() => setActiveTab('associatePosts')} className={activeTab === 'associatePosts' ? 'active' : ''}>Associate Posts</button>
      </div>

      {/* Message Display */}
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      {/* Tab Content */}
      <div className="tab-content">

        {/* New Project Tab (Modified) */}
        {activeTab === 'newProject' && (
          <form onSubmit={handleNewProjectSubmit} className="data-entry-form">
            <h2>Create New Project, Institute, and Manager</h2>
            <div className="form-section">
                <h3>Project Details</h3>
                <div className="form-group">
                    <label htmlFor="name">Project Name:</label>
                    <input type="text" id="name" name="name" value={newProjectData.name} onChange={handleNewProjectChange} required maxLength="100" />
                </div>
                <div className="form-group">
                    <label htmlFor="start_date">Start Date:</label>
                    <input type="date" id="start_date" name="start_date" value={newProjectData.start_date} onChange={handleNewProjectChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="end_date">End Date:</label>
                    <input type="date" id="end_date" name="end_date" value={newProjectData.end_date} onChange={handleNewProjectChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea id="description" name="description" value={newProjectData.description} onChange={handleNewProjectChange}></textarea>
                </div>
            </div>

            <div className="form-section">
                <h3>New Institute Details</h3>
                <div className="form-group">
                    <label htmlFor="institute_name">Institute Name:</label>
                    <input type="text" id="institute_name" name="institute_name" value={newProjectData.institute_name} onChange={handleNewProjectChange} required maxLength="100" />
                </div>
            </div>

            <div className="form-section">
                <h3>New Manager Details</h3>
                 <div className="form-group">
                    <label htmlFor="manager_id">Manager ID:</label>
                    <input type="text" id="manager_id" name="manager_id" value={newProjectData.manager_id} onChange={handleNewProjectChange} required maxLength="50" />
                </div>
                <div className="form-group">
                    <label htmlFor="manager_first_name">Manager First Name:</label>
                    <input type="text" id="manager_first_name" name="manager_first_name" value={newProjectData.manager_first_name} onChange={handleNewProjectChange} required maxLength="50" />
                </div>
                <div className="form-group">
                    <label htmlFor="manager_last_name">Manager Last Name:</label>
                    <input type="text" id="manager_last_name" name="manager_last_name" value={newProjectData.manager_last_name} onChange={handleNewProjectChange} required maxLength="50" />
                </div>
            </div>

            <button type="submit" className="submit-button">Create Project, Institute & Manager</button>
          </form>
        )}

        {/* Add Project Fields Tab */}
        {activeTab === 'addFields' && (
            <form onSubmit={handleAddFieldSubmit} className="data-entry-form">
                <h2>Add Custom Fields to Existing Project</h2>
                <div className="form-group">
                    <label htmlFor="fieldProjectName">Project Name:</label>
                    <input
                        type="text"
                        id="fieldProjectName"
                        name="fieldProjectName"
                        value={fieldProjectName}
                        onChange={(e) => setFieldProjectName(e.target.value)}
                        required
                        maxLength="100"
                        placeholder="Enter the exact name of the project"
                    />
                </div>

                <h3>Fields to Add:</h3>
                {newFields.map((field, index) => (
                    <div key={index} className="field-entry">
                        <div className="form-group inline">
                            <label htmlFor={`field_name_${index}`}>Field Name:</label>
                            <input
                                type="text"
                                id={`field_name_${index}`}
                                name="field_name"
                                value={field.field_name}
                                onChange={(e) => handleNewFieldChange(index, e)}
                                required
                                maxLength="50"
                                placeholder="e.g., SentimentScore"
                            />
                        </div>
                        <div className="form-group inline">
                            <label htmlFor={`description_${index}`}>Description (Optional):</label>
                            <input
                                type="text"
                                id={`description_${index}`}
                                name="description"
                                value={field.description}
                                onChange={(e) => handleNewFieldChange(index, e)}
                                maxLength="255"
                                placeholder="e.g., Score from -1 to 1"
                            />
                        </div>
                        {newFields.length > 1 && (
                             <button type="button" onClick={() => removeFieldEntry(index)} className="remove-button">Remove</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addFieldEntry} className="add-button">Add Another Field</button>
                <button type="submit" className="submit-button">Add Fields to Project</button>
            </form>
        )}

        {/* New Social Media Platform Tab */}
        {activeTab === 'newPlatform' && (
            <form onSubmit={handlePlatformSubmit} className="data-entry-form">
                <h2>Create New Social Media Platform</h2>
                <div className="form-group">
                    <label htmlFor="platformName">Platform Name:</label>
                    <input
                        type="text"
                        id="platformName"
                        name="platformName"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        required
                        maxLength="50"
                        placeholder="e.g., Twitter, Facebook"
                    />
                </div>
                <button type="submit" className="submit-button">Create Platform</button>
            </form>
        )}

        {/* New User Account Tab */}
        {activeTab === 'newUser' && (
            <form onSubmit={handleUserSubmit} className="data-entry-form">
                <h2>Create New User Account</h2>
                 <div className="form-group">
                    <label htmlFor="user_social_media_name">Platform:</label>
                    <select
                        id="user_social_media_name"
                        name="social_media_name"
                        value={userData.social_media_name}
                        onChange={handleUserChange}
                        required
                    >
                        <option value="">Select Platform</option>
                        {socialMediaPlatforms.map(platform => (
                            <option key={platform.name} value={platform.name}>{platform.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="username">Username:</label>
                    <input type="text" id="username" name="username" value={userData.username} onChange={handleUserChange} required maxLength="50" />
                </div>
                 <div className="form-group">
                    <label htmlFor="first_name">First Name:</label>
                    <input type="text" id="first_name" name="first_name" value={userData.first_name} onChange={handleUserChange} required maxLength="50" />
                </div>
                 <div className="form-group">
                    <label htmlFor="last_name">Last Name:</label>
                    <input type="text" id="last_name" name="last_name" value={userData.last_name} onChange={handleUserChange} required maxLength="50" />
                </div>
                 <div className="form-group">
                    <label htmlFor="country_birth">Country of Birth:</label>
                    <input type="text" id="country_birth" name="country_birth" value={userData.country_birth} onChange={handleUserChange} maxLength="50" />
                </div>
                 <div className="form-group">
                    <label htmlFor="country_residence">Country of Residence:</label>
                    <input type="text" id="country_residence" name="country_residence" value={userData.country_residence} onChange={handleUserChange} maxLength="50" />
                </div>
                 <div className="form-group">
                    <label htmlFor="age">Age:</label>
                    <input type="number" id="age" name="age" value={userData.age} onChange={handleUserChange} min="0" />
                </div>
                 <div className="form-group">
                    <label htmlFor="gender">Gender:</label>
                     <select id="gender" name="gender" value={userData.gender} onChange={handleUserChange}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                </div>
                 <div className="form-group checkbox-group">
                    <input type="checkbox" id="verified" name="verified" checked={userData.verified} onChange={handleUserChange} />
                    <label htmlFor="verified">Verified Account</label>
                </div>
                <button type="submit" className="submit-button">Create User Account</button>
            </form>
        )}

        {/* New Post Tab */}
        {activeTab === 'newPost' && (
            <form onSubmit={handlePostSubmit} className="data-entry-form">
                <h2>Create New Post</h2>
                 <div className="form-group">
                    <label htmlFor="post_social_media_name">Platform:</label>
                    <select
                        id="post_social_media_name"
                        name="social_media_name"
                        value={postData.social_media_name}
                        onChange={handlePostChange}
                        required
                    >
                        <option value="">Select Platform</option>
                        {socialMediaPlatforms.map(platform => (
                            <option key={platform.name} value={platform.name}>{platform.name}</option>
                        ))}
                    </select>
                </div>
                 <div className="form-group">
                    <label htmlFor="post_username">Username:</label>
                     <select
                        id="post_username"
                        name="username"
                        value={postData.username}
                        onChange={handlePostChange}
                        required
                        disabled={!postData.social_media_name || loadingUsersForPost} // Disable if no platform or loading
                    >
                        <option value="">{loadingUsersForPost ? 'Loading users...' : (postData.social_media_name ? 'Select User' : 'Select Platform First')}</option>
                        {usersForPost.map(user => (
                            <option key={`${user.social_media_name}-${user.username}`} value={user.username}>
                                {user.username}
                            </option>
                        ))}
                    </select>
                     {/* Optional: Show message if no users found */}
                     {!loadingUsersForPost && postData.social_media_name && usersForPost.length === 0 && (
                         <p className="info-text">No users found for this platform.</p>
                     )}
                </div>
                <div className="form-group">
                    <label htmlFor="content">Content:</label>
                    <textarea id="content" name="content" value={postData.content} onChange={handlePostChange} required></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="post_time">Post Time:</label>
                    <input type="datetime-local" id="post_time" name="post_time" value={postData.post_time} onChange={handlePostChange} required />
                </div>
                {/* Optional Fields */}
                 <div className="form-group">
                    <label htmlFor="city">City:</label>
                    <input type="text" id="city" name="city" value={postData.city} onChange={handlePostChange} maxLength="50" />
                </div>
                 <div className="form-group">
                    <label htmlFor="state">State:</label>
                    <input type="text" id="state" name="state" value={postData.state} onChange={handlePostChange} maxLength="50" />
                </div>
                 <div className="form-group">
                    <label htmlFor="country">Country:</label>
                    <input type="text" id="country" name="country" value={postData.country} onChange={handlePostChange} maxLength="50" />
                </div>
                 <div className="form-group">
                    <label htmlFor="likes">Likes:</label>
                    <input type="number" id="likes" name="likes" value={postData.likes} onChange={handlePostChange} min="0" />
                </div>
                 <div className="form-group">
                    <label htmlFor="dislikes">Dislikes:</label>
                    <input type="number" id="dislikes" name="dislikes" value={postData.dislikes} onChange={handlePostChange} min="0" />
                </div>
                 <div className="form-group">
                    <label htmlFor="shares">Shares:</label>
                    <input type="number" id="shares" name="shares" value={postData.shares} onChange={handlePostChange} min="0" />
                </div>
                 <div className="form-group">
                    <label htmlFor="views">Views:</label>
                    <input type="number" id="views" name="views" value={postData.views} onChange={handlePostChange} min="0" />
                </div>
                 <div className="form-group">
                    <label htmlFor="url">URL:</label>
                    <input type="url" id="url" name="url" value={postData.url} onChange={handlePostChange} maxLength="255" />
                </div>
                 <div className="form-group">
                    <label htmlFor="location">Location (e.g., Geo-coordinates):</label>
                    <input type="text" id="location" name="location" value={postData.location} onChange={handlePostChange} maxLength="100" />
                </div>
                <button type="submit" className="submit-button" disabled={loadingUsersForPost}>Create Post</button>
            </form>
        )}

        {/* Associate Posts Tab */}
        {activeTab === 'associatePosts' && (
            <form onSubmit={handleAssociatePostsSubmit} className="data-entry-form">
                <h2>Associate Posts with Project</h2>
                <div className="form-group">
                    <label htmlFor="assocProjectName">Project Name:</label>
                    <input
                        type="text"
                        id="assocProjectName"
                        name="assocProjectName"
                        value={assocProjectName}
                        onChange={(e) => setAssocProjectName(e.target.value)}
                        required
                        maxLength="100"
                        placeholder="Enter the exact name of the project"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="postsToAssociate">Select Posts:</label>
                    {loadingPosts ? (
                        <p>Loading posts...</p>
                    ) : availablePosts.length > 0 ? (
                        <select
                            id="postsToAssociate"
                            name="postsToAssociate"
                            multiple // Enable multi-select
                            value={selectedPostIdsForAssociation}
                            onChange={handleSelectedPostsChange}
                            required
                            size="10" // Show 10 items at a time
                        >
                            {availablePosts.map(post => (
                                <option key={post.post_id} value={post.post_id}>
                                    ID: {post.post_id} | User: {post.username} ({post.social_media_name}) | Content: "{post.content.substring(0, 50)}..."
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p>No posts available to associate. Please create posts first.</p>
                    )}
                </div>
                 <button type="submit" className="submit-button" disabled={loadingPosts || availablePosts.length === 0}>Associate Selected Posts</button>
            </form>
        )}

      </div> {/* end .tab-content */}
    </div> // end .data-entry-container
  );
}

export default DataEntryPage; 