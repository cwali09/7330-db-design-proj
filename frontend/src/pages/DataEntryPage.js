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

  // --- State for New Project ---
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    institute_name: '',
    manager_first_name: '',
    manager_last_name: '',
    // REMOVED: fields array is no longer part of project creation
  });

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
  });
  // Re-use socialMediaPlatforms state for post dropdown

  // --- State for Associating Posts ---
  const [associationData, setAssociationData] = useState({
    projectName: '',
    postIds: '', // Comma-separated string initially
  });

  // --- State for Entering Analysis Result ---
  const [resultProjectName, setResultProjectName] = useState('');
  const [resultSocialMedia, setResultSocialMedia] = useState('');
  const [resultUsername, setResultUsername] = useState('');
  const [userPosts, setUserPosts] = useState([]);
  const [fetchingUserPosts, setFetchingUserPosts] = useState(false);
  const [userPostsMessage, setUserPostsMessage] = useState('');
  const [selectedPostId, setSelectedPostId] = useState('');
  const [resultFieldName, setResultFieldName] = useState('');
  const [resultValue, setResultValue] = useState('');

  // --- State for available posts list and selection
  const [availablePosts, setAvailablePosts] = useState([]); // To store { post_id, displayText }
  const [selectedPostIdsForAssociation, setSelectedPostIdsForAssociation] = useState([]); // Store selected IDs
  const [loadingPosts, setLoadingPosts] = useState(false); // Loading indicator for posts dropdown

  // --- Fetch Social Media Platforms on Mount ---
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const response = await apiService.getSocialMediaPlatforms();
        setSocialMediaPlatforms(response.data || []);
      } catch (error) {
        console.error("Error fetching social media platforms:", error);
        setMessage({ text: 'Could not load social media platforms.', type: 'error' });
      }
    };
    fetchPlatforms();
  }, []);

  // --- Fetch Available Posts for Dropdown ---
  useEffect(() => {
    // Fetch posts only when the 'Associate Posts' tab is potentially active or component mounts
    // You might refine this condition based on your exact tab switching logic
    // For simplicity, fetch on mount. Could also fetch when assocProjectName changes.
    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const response = await apiService.getAllPostsList();
        setAvailablePosts(response.data || []); // Ensure it's an array
      } catch (error) {
        // --- CHECK BROWSER CONSOLE FOR THIS ERROR ---
        console.error("Error fetching available posts:", error);
        showMessage('Failed to load posts list for dropdown.', 'error');
        setAvailablePosts([]); // Clear on error
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, []); // Empty dependency array means fetch once on mount

  // --- Helper to display messages ---
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    // Optional: Clear message after a delay
    // setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // --- Helper Functions for Date Formatting (if needed) ---
  const formatDateTime = (dateTimeString) => {
      if (!dateTimeString) return 'N/A';
      try {
          return new Date(dateTimeString).toLocaleString();
      } catch (e) {
          return dateTimeString;
      }
  };

  const truncateContent = (content, maxLength = 50) => {
      if (!content) return '';
      return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };


  // --- Handlers for Form Inputs ---

  const handleNewProjectChange = (e) => {
    const { name, value } = e.target;
    setNewProjectData(prev => ({ ...prev, [name]: value }));
  };

  // --- Handlers for New Field(s) Form ---
  const handleFieldProjectNameChange = (e) => {
      setFieldProjectName(e.target.value);
  };

  const handleNewFieldChange = (e, index) => {
      const { name, value } = e.target;
      const updatedFields = [...newFields];
      updatedFields[index] = { ...updatedFields[index], [name]: value };
      setNewFields(updatedFields);
  };

  const addFieldEntry = () => {
      setNewFields(prev => [...prev, { field_name: '', description: '' }]);
  };

  const removeFieldEntry = (index) => {
      if (newFields.length <= 1) return; // Keep at least one entry
      setNewFields(prev => prev.filter((_, i) => i !== index));
  };


  const handlePlatformNameChange = (e) => {
    setPlatformName(e.target.value);
  };

  const handleUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePostChange = (e) => {
    const { name, value } = e.target;
    setPostData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssociationChange = (e) => {
    const { name, value } = e.target;
    setAssociationData(prev => ({ ...prev, [name]: value }));
  };

  // --- Handlers for Result Entry ---
  const handleResultSocialMediaChange = (e) => {
      setResultSocialMedia(e.target.value);
      setUserPosts([]); // Clear posts when platform changes
      setSelectedPostId('');
      setUserPostsMessage('');
  };

  const handleResultUsernameChange = (e) => {
      setResultUsername(e.target.value);
      setUserPosts([]); // Clear posts when username changes
      setSelectedPostId('');
      setUserPostsMessage('');
  };

  const handleSelectedPostChange = (e) => {
      setSelectedPostId(e.target.value);
  };

  // Handler for multi-select dropdown
  const handleSelectedPostsChange = (e) => {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      // Ensure values are integers
      setSelectedPostIdsForAssociation(selectedOptions.map(id => parseInt(id, 10)));
  };

  // --- Async Handlers for API Calls ---

  const handleNewProjectSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' }); // Clear previous messages
    // Basic validation
    if (new Date(newProjectData.end_date) < new Date(newProjectData.start_date)) {
        showMessage('End date cannot be before start date.', 'error');
        return;
    }
    try {
      const response = await apiService.createProject(newProjectData);
      showMessage(`Project '${response.data.data.name}' created successfully!`, 'success');
      // Clear the form
      setNewProjectData({
        name: '', start_date: '', end_date: '', institute_name: '',
        manager_first_name: '', manager_last_name: ''
      });
    } catch (error) {
      console.error("Error creating project:", error);
      showMessage(`Error creating project: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // --- Handler for Submitting New Fields ---
  const handleNewFieldsSubmit = async (e) => {
      e.preventDefault();
      setMessage({ text: '', type: '' });
      if (!fieldProjectName.trim()) {
          showMessage('Please enter the Project Name to add fields to.', 'error');
          return;
      }
      // Filter out any empty field entries
      const validFields = newFields.filter(f => f.field_name && f.field_name.trim() !== '');
      if (validFields.length === 0) {
          showMessage('Please enter at least one valid field name.', 'error');
          return;
      }
      // Optional: Check for duplicate field names within the submission
      const fieldNames = validFields.map(f => f.field_name.trim());
      if (new Set(fieldNames).size !== fieldNames.length) {
          showMessage('Duplicate field names detected in the list.', 'error');
          return;
      }

      try {
          // Assuming apiService.addProjectFields takes projectName and the array of fields
          const response = await apiService.addProjectFields(fieldProjectName, validFields);
          showMessage(`${response.data.createdCount} field(s) added successfully to project '${fieldProjectName}'!`, 'success');
          // Clear the form
          setFieldProjectName('');
          setNewFields([{ field_name: '', description: '' }]);
      } catch (error) {
          console.error("Error adding fields:", error);
          showMessage(`Error adding fields: ${error.response?.data?.message || error.message}`, 'error');
      }
  };


  const handlePlatformSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    if (!platformName.trim()) {
        showMessage('Platform name cannot be empty.', 'error');
        return;
    }
    try {
      const response = await apiService.createSocialMediaPlatform({ name: platformName });
      showMessage(`Social media platform '${response.data.data.name}' created successfully!`, 'success');
      setPlatformName(''); // Clear form
      // Refresh platform list
      const updatedPlatforms = await apiService.getSocialMediaPlatforms();
      setSocialMediaPlatforms(updatedPlatforms.data || []);
    } catch (error) {
      console.error("Error creating platform:", error);
      showMessage(`Error creating platform: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    // Basic validation
    if (!userData.social_media_name || !userData.username.trim()) {
        showMessage('Social Media Platform and Username are required.', 'error');
        return;
    }
    try {
      const response = await apiService.createUserAccount(userData);
      showMessage(`User account '${response.data.data.username}' on '${response.data.data.social_media_name}' created successfully!`, 'success');
      // Clear form
      setUserData({
        social_media_name: '', username: '', first_name: '', last_name: '',
        country_birth: '', country_residence: '', age: '', gender: '', verified: false
      });
    } catch (error) {
      console.error("Error creating user account:", error);
      showMessage(`Error creating user account: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    if (!postData.social_media_name || !postData.username.trim() || !postData.content.trim()) {
        showMessage('Platform, Username, and Content are required for a post.', 'error');
        return;
    }
    try {
      const response = await apiService.createPost(postData);
      showMessage(`Post (ID: ${response.data.data.post_id}) created successfully!`, 'success');
      // Clear form
      setPostData({ social_media_name: '', username: '', content: '' });
    } catch (error) {
      console.error("Error creating post:", error);
      showMessage(`Error creating post: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handleAssociationSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    const postIdsArray = associationData.postIds.split(',')
        .map(id => id.trim())
        .filter(id => id !== ''); // Remove empty strings

    if (!associationData.projectName.trim() || postIdsArray.length === 0) {
        showMessage('Project Name and at least one Post ID are required.', 'error');
        return;
    }
    // Validate IDs are numbers (basic check)
    if (postIdsArray.some(id => isNaN(parseInt(id)))) {
        showMessage('Post IDs must be comma-separated numbers.', 'error');
        return;
    }

    try {
      // Pass the array of IDs directly
      const response = await apiService.associatePosts(associationData.projectName, postIdsArray);
      showMessage(response.data.message, 'success'); // Use message from backend
      // Clear form
      setAssociationData({ projectName: '', postIds: '' });
    } catch (error) {
      console.error("Error associating posts:", error);
      showMessage(`Error associating posts: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // --- Handler for Finding User Posts ---
  const handleFindUserPosts = async () => {
      setMessage({ text: '', type: '' });
      setUserPostsMessage('');
      setUserPosts([]);
      setSelectedPostId('');
      if (!resultSocialMedia || !resultUsername.trim()) {
          setUserPostsMessage('Please select a platform and enter a username.');
          return;
      }
      setFetchingUserPosts(true);
      try {
          const response = await apiService.getPostsByUser(resultSocialMedia, resultUsername);
          if (response.data && response.data.length > 0) {
              setUserPosts(response.data);
          } else {
              setUserPostsMessage(`No posts found for user '${resultUsername}' on '${resultSocialMedia}'.`);
          }
      } catch (error) {
          console.error("Error fetching user posts:", error);
          setUserPostsMessage(`Error fetching posts: ${error.response?.data?.message || error.message}`);
      } finally {
          setFetchingUserPosts(false);
      }
  };

  // --- Handler for Submitting Analysis Result ---
  const handleResultSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    if (!resultProjectName.trim() || !selectedPostId || !resultFieldName.trim() || !resultValue.trim()) {
        showMessage('Project Name, selected Post, Field Name, and Value are required.', 'error');
        return;
    }

    const resultData = {
        projectName: resultProjectName,
        postId: parseInt(selectedPostId, 10), // Ensure postId is an integer
        fieldName: resultFieldName,
        value: resultValue
    };

    try {
      const response = await apiService.addAnalysisResult(resultData);
      showMessage(response.data.message, 'success');
      // Clear only field/value/post selection, keep project/user context
      setSelectedPostId('');
      setResultFieldName('');
      setResultValue('');
      // Optionally clear userPosts list or keep it for adding more results for the same user
      // setUserPosts([]);
      // setUserPostsMessage('');
    } catch (error) {
      console.error("Error adding analysis result:", error);
      showMessage(`Error adding result: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // --- Handler for Associating Posts ---
  const handleAssociatePostsSubmit = async (e) => {
    e.preventDefault();
    showMessage('', ''); // Clear previous messages

    // Validate project name and selected posts
    if (!associationData.projectName.trim()) {
      showMessage('Project Name is required.', 'error');
      return;
    }
    if (selectedPostIdsForAssociation.length === 0) {
      showMessage('Please select at least one post to associate.', 'error');
      return;
    }

    try {
      // --- FIX: Use the correct function name 'associatePosts' ---
      const response = await apiService.associatePosts(
        associationData.projectName,
        selectedPostIdsForAssociation // Send the array of numbers
      );
      // --- End FIX ---

      showMessage(response.data.message || 'Posts associated successfully!', 'success');
      // Clear selection after successful association
      setSelectedPostIdsForAssociation([]);
      // Optionally clear project name too, or keep it for associating more posts
      // setAssociationData(prev => ({ ...prev, projectName: '' }));
    } catch (error) {
      console.error("Error associating posts:", error); // Error is caught here
      showMessage(`Error associating posts: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  return (
    <div className="data-entry-container">
      <h1>Data Entry</h1>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button onClick={() => setActiveTab('newProject')} className={activeTab === 'newProject' ? 'active' : ''}>1. New Project</button>
        <button onClick={() => setActiveTab('newField')} className={activeTab === 'newField' ? 'active' : ''}>2. Add Fields</button>
        <button onClick={() => setActiveTab('newPlatform')} className={activeTab === 'newPlatform' ? 'active' : ''}>3. New Platform</button>
        <button onClick={() => setActiveTab('newUser')} className={activeTab === 'newUser' ? 'active' : ''}>4. New User</button>
        <button onClick={() => setActiveTab('newPost')} className={activeTab === 'newPost' ? 'active' : ''}>5. New Post</button>
        <button onClick={() => setActiveTab('associatePosts')} className={activeTab === 'associatePosts' ? 'active' : ''}>6. Associate Posts</button>
        <button onClick={() => setActiveTab('enterResults')} className={activeTab === 'enterResults' ? 'active' : ''}>7. Enter Results</button>
      </div>

      {/* Message Display Area */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tab Content Area */}
      <div className="tab-content">

        {activeTab === 'newProject' && (
          <form onSubmit={handleNewProjectSubmit} className="data-entry-form">
            <h2>1. Create New Project</h2>
             <div className="form-group">
               <label htmlFor="name">Project Name:</label>
               <input type="text" id="name" name="name" value={newProjectData.name} onChange={handleNewProjectChange} maxLength="100" />
             </div>
             <div className="form-group">
               <label htmlFor="start_date">Start Date:</label>
               <input type="date" id="start_date" name="start_date" value={newProjectData.start_date} onChange={handleNewProjectChange} />
             </div>
             <div className="form-group">
               <label htmlFor="end_date">End Date:</label>
               <input type="date" id="end_date" name="end_date" value={newProjectData.end_date} onChange={handleNewProjectChange} />
             </div>
             <div className="form-group">
               <label htmlFor="institute_name">Institute Name:</label>
               {/* TODO: Replace with dropdown fetched from INSTITUTE table */}
               <input type="text" id="institute_name" name="institute_name" value={newProjectData.institute_name} onChange={handleNewProjectChange} maxLength="100" />
             </div>
             <div className="form-group">
               <label htmlFor="manager_first_name">Manager First Name:</label>
               {/* TODO: Replace with dropdown fetched from PROJECT_MANAGER table */}
               <input type="text" id="manager_first_name" name="manager_first_name" value={newProjectData.manager_first_name} onChange={handleNewProjectChange} maxLength="50" />
             </div>
             <div className="form-group">
               <label htmlFor="manager_last_name">Manager Last Name:</label>
               <input type="text" id="manager_last_name" name="manager_last_name" value={newProjectData.manager_last_name} onChange={handleNewProjectChange} maxLength="50" />
             </div>
             <button type="submit">Create Project</button>
          </form>
        )}

        {activeTab === 'newField' && (
          <form onSubmit={handleNewFieldsSubmit} className="data-entry-form">
            <h2>2. Add Analysis Fields to Project</h2>
             <div className="form-group">
               <label htmlFor="fieldProjectName">Project Name:</label>
               {/* TODO: Replace with dropdown fetched from PROJECT table */}
               <input type="text" id="fieldProjectName" name="fieldProjectName" value={fieldProjectName} onChange={handleFieldProjectNameChange} maxLength="100" />
             </div>

             <fieldset>
                <legend>Fields to Add</legend>
                {newFields.map((field, index) => (
                    <div key={index} className="field-entry">
                        <div className="form-group">
                            <label htmlFor={`field_name_${index}`}>Field Name:</label>
                            <input
                                type="text"
                                id={`field_name_${index}`}
                                name="field_name"
                                value={field.field_name}
                                onChange={(e) => handleNewFieldChange(e, index)}
                                maxLength="50"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`description_${index}`}>Description (Optional):</label>
                            <input
                                type="text"
                                id={`description_${index}`}
                                name="description"
                                value={field.description}
                                onChange={(e) => handleNewFieldChange(e, index)}
                                maxLength="255"
                            />
                        </div>
                        {newFields.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeFieldEntry(index)}
                                className="remove-field-button"
                            >
                                Remove Field
                            </button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addFieldEntry} className="add-field-button">
                    Add Another Field
                </button>
             </fieldset>

             <button type="submit">Add Fields to Project</button>
          </form>
        )}

        {activeTab === 'newPlatform' && (
          <form onSubmit={handlePlatformSubmit} className="data-entry-form">
            <h2>3. Create New Social Media Platform</h2>
             <div className="form-group">
               <label htmlFor="platformName">Platform Name:</label>
               <input type="text" id="platformName" value={platformName} onChange={handlePlatformNameChange} maxLength="50" />
             </div>
             <button type="submit">Create Platform</button>
          </form>
        )}

        {activeTab === 'newUser' && (
          <form onSubmit={handleUserSubmit} className="data-entry-form">
            <h2>4. Create New User Account</h2>
             <div className="form-group">
               <label htmlFor="userSocialMedia">Social Media Platform:</label>
               <select id="userSocialMedia" name="social_media_name" value={userData.social_media_name} onChange={handleUserChange}>
                 <option value="">-- Select Platform --</option>
                 {socialMediaPlatforms.map(platform => (
                   <option key={platform.name} value={platform.name}>{platform.name}</option>
                 ))}
               </select>
             </div>
             <div className="form-group">
               <label htmlFor="username">Username:</label>
               <input type="text" id="username" name="username" value={userData.username} onChange={handleUserChange} maxLength="40" />
             </div>
             <div className="form-group">
               <label htmlFor="first_name">First Name (Optional):</label>
               <input type="text" id="first_name" name="first_name" value={userData.first_name} onChange={handleUserChange} maxLength="50" />
             </div>
             <div className="form-group">
               <label htmlFor="last_name">Last Name (Optional):</label>
               <input type="text" id="last_name" name="last_name" value={userData.last_name} onChange={handleUserChange} maxLength="50" />
             </div>
             <div className="form-group">
               <label htmlFor="country_birth">Country of Birth (Optional):</label>
               <input type="text" id="country_birth" name="country_birth" value={userData.country_birth} onChange={handleUserChange} maxLength="50" />
             </div>
             <div className="form-group">
               <label htmlFor="country_residence">Country of Residence (Optional):</label>
               <input type="text" id="country_residence" name="country_residence" value={userData.country_residence} onChange={handleUserChange} maxLength="50" />
             </div>
             <div className="form-group">
               <label htmlFor="age">Age (Optional):</label>
               <input type="number" id="age" name="age" value={userData.age} onChange={handleUserChange} min="0" max="150" />
             </div>
             <div className="form-group">
               <label htmlFor="gender">Gender (Optional):</label>
               <input type="text" id="gender" name="gender" value={userData.gender} onChange={handleUserChange} maxLength="20" />
             </div>
             <div className="form-group form-group-inline">
               <input type="checkbox" id="verified" name="verified" checked={userData.verified} onChange={handleUserChange} />
               <label htmlFor="verified">Verified Account</label>
             </div>
             <button type="submit">Create User</button>
          </form>
        )}

        {activeTab === 'newPost' && (
          <form onSubmit={handlePostSubmit} className="data-entry-form">
            <h2>5. Create New Post</h2>
             <div className="form-group">
               <label htmlFor="postSocialMedia">Social Media Platform:</label>
               <select id="postSocialMedia" name="social_media_name" value={postData.social_media_name} onChange={handlePostChange}>
                 <option value="">-- Select Platform --</option>
                 {socialMediaPlatforms.map(platform => (
                   <option key={platform.name} value={platform.name}>{platform.name}</option>
                 ))}
               </select>
             </div>
             <div className="form-group">
               <label htmlFor="postUsername">Username:</label>
               {/* TODO: Ideally, fetch/validate username exists for the selected platform */}
               <input type="text" id="postUsername" name="username" value={postData.username} onChange={handlePostChange} maxLength="40" />
             </div>
             <div className="form-group">
               <label htmlFor="content">Content:</label>
               <textarea id="content" name="content" value={postData.content} onChange={handlePostChange}></textarea>
             </div>
             <button type="submit">Create Post</button>
          </form>
        )}

        {activeTab === 'associatePosts' && (
          <form onSubmit={handleAssociatePostsSubmit} className="data-entry-form">
            <h2>6. Associate Posts with Project</h2>
             <div className="form-group">
               <label htmlFor="assocProjectName">Project Name:</label>
               {/* TODO: Replace with dropdown fetched from PROJECT table */}
               <input type="text" id="assocProjectName" name="projectName" value={associationData.projectName} onChange={handleAssociationChange} maxLength="100" />
             </div>
             {/* --- NEW Dropdown Section --- */}
             <div className="form-group">
               <label htmlFor="postsToAssociate">Select Posts to Associate:</label>
               {loadingPosts ? (
                 <p>Loading posts...</p>
               ) : availablePosts.length > 0 ? (
                 <select
                   id="postsToAssociate"
                   multiple // Enable multi-selection
                   value={selectedPostIdsForAssociation} // Bind to state holding selected IDs
                   onChange={handleSelectedPostsChange} // Use the specific handler
                   size="10" // Show multiple items at once
                   style={{ minWidth: '300px', height: '150px' }} // Basic styling
                 >
                   {availablePosts.map(post => (
                     <option key={post.post_id} value={post.post_id}>
                       {post.displayText}
                     </option>
                   ))}
                 </select>
               ) : (
                 <p>No posts available to associate, or failed to load.</p>
               )}
             </div>
             {/* --- End NEW Dropdown Section --- */}
             <button type="submit" disabled={loadingPosts}>Associate Selected Posts</button>
          </form>
        )}


        {activeTab === 'enterResults' && (
           <form onSubmit={handleResultSubmit} className="data-entry-form">
             <h2>7. Enter Analysis Result</h2>
              <div className="form-group">
               <label htmlFor="resultProjectName">Project Name:</label>
               {/* TODO: Replace with a select dropdown populated by fetched projects */}
               <input type="text" id="resultProjectName" value={resultProjectName} onChange={(e) => setResultProjectName(e.target.value)} />
             </div>

             {/* User Account Selection */}
             <fieldset>
                <legend>Find Post by User Account</legend>
                 <div className="form-group">
                   <label htmlFor="resultSocialMedia">Social Media Platform:</label>
                   <select id="resultSocialMedia" value={resultSocialMedia} onChange={handleResultSocialMediaChange}>
                     <option value="">-- Select Platform --</option>
                     {socialMediaPlatforms.map(platform => (
                       <option key={platform.name} value={platform.name}>{platform.name}</option>
                     ))}
                   </select>
                 </div>
                 <div className="form-group">
                   <label htmlFor="resultUsername">Username:</label>
                   <input type="text" id="resultUsername" value={resultUsername} onChange={handleResultUsernameChange} maxLength="40" />
                 </div>
                 <button type="button" onClick={handleFindUserPosts} disabled={fetchingUserPosts || !resultSocialMedia || !resultUsername.trim()}>
                    {fetchingUserPosts ? 'Finding...' : 'Find Posts'}
                 </button>
                 {userPostsMessage && <p className="message error">{userPostsMessage}</p>}
             </fieldset>

             {/* Post Selection Dropdown */}
             {userPosts.length > 0 && (
                 <div className="form-group">
                   <label htmlFor="selectedPostId">Select Post:</label>
                   <select id="selectedPostId" value={selectedPostId} onChange={handleSelectedPostChange}>
                     <option value="">-- Select a Post --</option>
                     {userPosts.map(post => (
                       <option key={post.post_id} value={post.post_id}>
                         ID: {post.post_id} ({formatDateTime(post.post_time)}) - "{truncateContent(post.content)}"
                       </option>
                     ))}
                   </select>
                 </div>
             )}

             {/* Field and Value */}
              <div className="form-group">
               <label htmlFor="fieldName">Field Name:</label>
               {/* TODO: Replace with a select dropdown populated by fetched fields (maybe filtered by project) */}
               <input type="text" id="fieldName" name="fieldName" value={resultFieldName} onChange={(e) => setResultFieldName(e.target.value)} maxLength="50" />
             </div>
              <div className="form-group">
               <label htmlFor="value">Value:</label>
               <input type="text" id="value" name="value" value={resultValue} onChange={(e) => setResultValue(e.target.value)} maxLength="255" />
             </div>
              <button type="submit" disabled={!selectedPostId}>Add Result</button> {/* Disable submit until a post is selected */}
           </form>
        )}

      </div> {/* End Tab Content Area */}
    </div>
  );
}

export default DataEntryPage; 