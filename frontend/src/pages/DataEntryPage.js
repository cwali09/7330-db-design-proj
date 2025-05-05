import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService'; // Create this service file
import './DataEntryPage.css'; // Assuming you have or will create this

// Basic inline styles for tabs (consider moving to a CSS file for larger apps)
// REMOVED: tabStyles object is no longer needed as styles are in CSS

function DataEntryPage() {
  // --- State for Active Tab ---
  const [activeTab, setActiveTab] = useState('createProject'); // Default tab

  // --- State for Project Entry ---
  const [projectData, setProjectData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    institute_name: '',
    manager_first_name: '',
    manager_last_name: '',
  });

  // --- State for New Social Media Platform Entry ---
  const [newPlatformName, setNewPlatformName] = useState('');

  // --- State for Existing Social Media Platforms (for dropdowns) ---
  const [platforms, setPlatforms] = useState([]);
  const [platformsLoading, setPlatformsLoading] = useState(true);
  const [platformsError, setPlatformsError] = useState(null);


  // --- State for New User Account Entry ---
  const [newUserAccountData, setNewUserAccountData] = useState({
      social_media_name: '', // Will be populated from dropdown
      username: '',
      first_name: '',
      last_name: '',
      country_birth: '',
      country_residence: '',
      age: '',
      gender: '',
      verified: false
  });

  // --- State for Post Association ---
  const [assocProjectName, setAssocProjectName] = useState('');
  const [assocPostIds, setAssocPostIds] = useState(''); // Comma-separated IDs

  // --- State for Analysis Result Entry ---
  const [resultProjectName, setResultProjectName] = useState('');
  const [resultData, setResultData] = useState({
    postId: '',
    fieldName: '',
    value: '',
  });

  // --- State for Field Entry ---
  const [fieldProjectName, setFieldProjectName] = useState('');
  const [fieldData, setFieldData] = useState({
      field_name: '',
      description: ''
  });

  // --- State for New Post Entry ---
  const [newPostData, setNewPostData] = useState({
      social_media_name: '', // Will be populated from dropdown
      username: '',
      content: '',
  });

  const [message, setMessage] = useState(''); // For feedback

  // --- Fetch Existing Platforms on Mount ---
  useEffect(() => {
      const fetchPlatforms = async () => {
          try {
              setPlatformsLoading(true);
              setPlatformsError(null);
              const response = await apiService.getSocialMediaPlatforms();
              // Ensure the response data is an array before setting state
              if (Array.isArray(response.data)) {
                  setPlatforms(response.data);
                  // Set default selection for forms if platforms exist
                  if (response.data.length > 0) {
                      setNewUserAccountData(prev => ({ ...prev, social_media_name: response.data[0].name }));
                      setNewPostData(prev => ({ ...prev, social_media_name: response.data[0].name }));
                      // TODO: Set default for assocProjectName if projects are fetched
                  }
              } else {
                  setPlatforms([]); // Set to empty array if data is not array
                  console.warn("Received non-array data for platforms:", response.data);
              }
          } catch (error) {
              console.error("Error fetching platforms:", error);
              setPlatformsError(`Error fetching platforms: ${error.response?.data?.message || error.message}`);
              setPlatforms([]); // Clear platforms on error
          } finally {
              setPlatformsLoading(false);
          }
      };
      fetchPlatforms();
      // TODO: Fetch projects and fields here as well if needed for dropdowns
  }, []); // Empty dependency array means this runs once on mount

  // --- Helper function for tab button styling (REMOVED) ---
  // const getButtonStyle = (tabName) => {
  //   return activeTab === tabName
  //     ? { ...tabStyles.tabButton, ...tabStyles.activeTabButton }
  //     : tabStyles.tabButton;
  // };

  // --- Handlers for Form Input Changes ---

  const handleProjectChange = (e) => {
    setProjectData({ ...projectData, [e.target.name]: e.target.value });
  };

  const handlePlatformChange = (e) => {
    setNewPlatformName(e.target.value);
  };

  const handleUserAccountChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUserAccountData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNewPostChange = (e) => {
    setNewPostData({ ...newPostData, [e.target.name]: e.target.value });
  };

  const handleAssociationChange = (e) => {
    if (e.target.name === 'assocProjectName') {
      setAssocProjectName(e.target.value);
    } else if (e.target.name === 'assocPostIds') {
      setAssocPostIds(e.target.value);
    }
  };

  const handleFieldChange = (e) => {
      if (e.target.name === 'fieldProjectName') {
          setFieldProjectName(e.target.value);
      } else {
          setFieldData({ ...fieldData, [e.target.name]: e.target.value });
      }
  };

  const handleResultChange = (e) => {
      if (e.target.name === 'resultProjectName') {
          setResultProjectName(e.target.value);
      } else {
          setResultData({ ...resultData, [e.target.name]: e.target.value });
      }
  };


  // --- Handlers for Form Submissions ---

  const handleNewProjectSubmit = async (e) => {
    e.preventDefault();
    setMessage('Creating new project...');
    try {
      // Removed unused 'response' variable assignment
      await apiService.createProject(projectData);
      setMessage(`Project '${projectData.name}' created successfully!`);
      // Clear form
      setProjectData({
        name: '', start_date: '', end_date: '', institute_name: '', manager_first_name: '', manager_last_name: ''
      });
      // TODO: Optionally refresh project list if displayed in dropdowns
    } catch (error) {
      console.error("Error creating project:", error);
      setMessage(`Error creating project: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleNewPlatformSubmit = async (e) => {
    e.preventDefault();
    setMessage('Creating new platform...');
    if (!newPlatformName.trim()) {
        setMessage('Platform name cannot be empty.');
        return;
    }
    try {
        const response = await apiService.createSocialMediaPlatform({ name: newPlatformName });
        setMessage(`Platform '${newPlatformName}' created successfully! (ID: ${response.data.id})`);
        setNewPlatformName(''); // Clear input
        // Refresh platform list
        const refreshResponse = await apiService.getSocialMediaPlatforms();
        if (Array.isArray(refreshResponse.data)) {
            setPlatforms(refreshResponse.data);
             // Set default selection for forms if platforms exist now
             if (refreshResponse.data.length > 0 && !newUserAccountData.social_media_name) {
                 setNewUserAccountData(prev => ({ ...prev, social_media_name: refreshResponse.data[0].name }));
             }
             if (refreshResponse.data.length > 0 && !newPostData.social_media_name) {
                 setNewPostData(prev => ({ ...prev, social_media_name: refreshResponse.data[0].name }));
             }
        }
    } catch (error) {
        console.error("Error creating platform:", error);
        setMessage(`Error creating platform: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleNewUserAccountSubmit = async (e) => {
    e.preventDefault();
    setMessage('Creating new user account...');
    // Basic validation
    if (!newUserAccountData.social_media_name || !newUserAccountData.username) {
        setMessage('Please select a platform and enter a username.');
        return;
    }
    // Convert age to number or null
    const payload = {
        ...newUserAccountData,
        age: newUserAccountData.age ? parseInt(newUserAccountData.age, 10) : null,
    };
    // Remove age from payload if it's NaN after parsing
    if (isNaN(payload.age)) {
        delete payload.age;
    }

    try {
        const response = await apiService.createUserAccount(payload);
        setMessage(`User account '${payload.username}' on '${payload.social_media_name}' created successfully!`);
        // Clear form, keeping platform selection
        setNewUserAccountData({
            social_media_name: newUserAccountData.social_media_name, // Keep platform
            username: '', first_name: '', last_name: '', country_birth: '',
            country_residence: '', age: '', gender: '', verified: false
        });
    } catch (error) {
        console.error("Error creating user account:", error);
        setMessage(`Error creating user account: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handler for New Post form submission (Corrected)
  const handleNewPostSubmit = async (e) => {
      e.preventDefault();
      setMessage('Creating new post...');
      // Validate required fields (post_date removed from validation)
      if (!newPostData.social_media_name) {
          setMessage('Please select a social media platform for the new post.');
          return;
      }
      // Removed post_date check
      if (!newPostData.username || newPostData.content === undefined || newPostData.content === null) {
          setMessage('Please fill in Username and Content for the new post.');
          return;
      }
      try {
          // Send the data structure without post_date
          // The apiService.createPost function just passes this object along
          const postPayload = {
              social_media_name: newPostData.social_media_name,
              username: newPostData.username,
              content: newPostData.content,
          };
          const response = await apiService.createPost(postPayload);
          // Use optional chaining for safer access
          const postId = response?.data?.data?.post_id;
          const postTime = response?.data?.data?.post_time;
          setMessage(`New post created successfully! ${postId ? `ID: ${postId}` : ''} ${postTime ? `at ${new Date(postTime).toLocaleString()}`: ''}`);
          // Clear the form, resetting state without post_date
          setNewPostData({
              social_media_name: platforms.length > 0 ? platforms[0].name : '', // Reset to default or empty
              username: '',
              content: '',
          });
      } catch (error) {
          console.error("Error creating post:", error); // Log the full error
          setMessage(`Error creating post: ${error.response?.data?.message || error.message}`);
      }
  };

  const handleAssociationSubmit = async (e) => {
    e.preventDefault();
    setMessage('Associating posts...');
    if (!assocProjectName || !assocPostIds) {
        setMessage('Please select a project and enter Post IDs.');
        return;
    }
    // Convert comma-separated string to array of numbers
    const postIdsArray = assocPostIds.split(',')
                                     .map(id => parseInt(id.trim(), 10))
                                     .filter(id => !isNaN(id) && id > 0);

    if (postIdsArray.length === 0) {
        setMessage('Please enter valid, comma-separated Post IDs (numbers greater than 0).');
        return;
    }

    try {
        await apiService.associatePosts(assocProjectName, postIdsArray);
        setMessage(`Successfully associated ${postIdsArray.length} post(s) with project '${assocProjectName}'.`);
        // Clear form
        setAssocProjectName(platforms.length > 0 ? platforms[0].name : ''); // Reset to default project or empty
        setAssocPostIds('');
    } catch (error) {
        console.error("Error associating posts:", error);
        setMessage(`Error associating posts: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleFieldSubmit = async (e) => {
      e.preventDefault();
      setMessage('Adding field...');
      if (!fieldProjectName || !fieldData.field_name) {
          setMessage('Project Name and Field Name are required.');
          return;
      }
      try {
          await apiService.addProjectField(fieldProjectName, fieldData);
          setMessage(`Field '${fieldData.field_name}' added successfully to project '${fieldProjectName}'.`);
          // Clear form
          setFieldProjectName(''); // Or reset to default project
          setFieldData({ field_name: '', description: '' });
          // TODO: Optionally refresh fields list if displayed
      } catch (error) {
          console.error("Error adding field:", error);
          setMessage(`Error adding field: ${error.response?.data?.message || error.message}`);
      }
  };

  const handleResultSubmit = async (e) => {
      e.preventDefault();
      setMessage('Adding analysis result...');
      const { postId, fieldName, value } = resultData;
      if (!resultProjectName || !postId || !fieldName || value === undefined || value === null) {
          setMessage('Project Name, Post ID, Field Name, and Value are required.');
          return;
      }
      const numericPostId = parseInt(postId, 10);
      if (isNaN(numericPostId) || numericPostId <= 0) {
          setMessage('Please enter a valid Post ID (a positive number).');
          return;
      }

      try {
          await apiService.addAnalysisResult(resultProjectName, { postId: numericPostId, fieldName, value });
          setMessage(`Analysis result added successfully for Post ID ${numericPostId}, Field '${fieldName}' in project '${resultProjectName}'.`);
          // Clear form
          setResultProjectName(''); // Or reset to default project
          setResultData({ postId: '', fieldName: '', value: '' });
      } catch (error) {
          console.error("Error adding analysis result:", error);
          setMessage(`Error adding analysis result: ${error.response?.data?.message || error.message}`);
      }
  };


  return (
    // Use CSS classes instead of inline styles
    <div className="data-entry-container">
      <h1>Data Entry</h1>

       {/* Tab Navigation */}
       <div className="tabs">
         <button onClick={() => setActiveTab('createProject')} className={activeTab === 'createProject' ? 'active' : ''}>
           1. Create Project
         </button>
         <button onClick={() => setActiveTab('createPlatform')} className={activeTab === 'createPlatform' ? 'active' : ''}>
           2. Create Social Media Platform
         </button>
         <button onClick={() => setActiveTab('createUserAccount')} className={activeTab === 'createUserAccount' ? 'active' : ''}>
           3. Create User Account
         </button>
         <button onClick={() => setActiveTab('createPost')} className={activeTab === 'createPost' ? 'active' : ''}>
           4. Create Post
         </button>
         <button onClick={() => setActiveTab('associatePosts')} className={activeTab === 'associatePosts' ? 'active' : ''}>
           5. Associate Posts
         </button>
         <button onClick={() => setActiveTab('defineFields')} className={activeTab === 'defineFields' ? 'active' : ''}>
           6. Define Project Fields
         </button>
         <button onClick={() => setActiveTab('enterResults')} className={activeTab === 'enterResults' ? 'active' : ''}>
           7. Enter Analysis Results
         </button>
       </div>

       {/* Message Area */}
       {message && <p className={`message ${message.startsWith('Error') ? 'error' : 'success'}`}>{message}</p>}

       {/* Tab Content Area */}
       <div className="tab-content">
         {/* Conditionally render forms based on activeTab */}

        {activeTab === 'createProject' && (
          <form onSubmit={handleNewProjectSubmit} className="data-entry-form">
            <h2>1. Create New Project</h2>
            <div className="form-group">
              <label htmlFor="name">Project Name:</label>
              <input type="text" id="name" name="name" value={projectData.name} onChange={handleProjectChange} maxLength="100" required />
            </div>
            <div className="form-group">
              <label htmlFor="start_date">Start Date:</label>
              <input type="date" id="start_date" name="start_date" value={projectData.start_date} onChange={handleProjectChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="end_date">End Date:</label>
              <input type="date" id="end_date" name="end_date" value={projectData.end_date} onChange={handleProjectChange} />
            </div>
             <div className="form-group">
              <label htmlFor="institute_name">Institute Name:</label>
              <input type="text" id="institute_name" name="institute_name" value={projectData.institute_name} onChange={handleProjectChange} maxLength="100" required />
            </div>
             <div className="form-group">
              <label htmlFor="manager_first_name">Manager First Name:</label>
              <input type="text" id="manager_first_name" name="manager_first_name" value={projectData.manager_first_name} onChange={handleProjectChange} maxLength="50" required />
            </div>
             <div className="form-group">
              <label htmlFor="manager_last_name">Manager Last Name:</label>
              <input type="text" id="manager_last_name" name="manager_last_name" value={projectData.manager_last_name} onChange={handleProjectChange} maxLength="50" required />
            </div>
            <button type="submit">Create Project</button>
          </form>
        )}

        {activeTab === 'createPlatform' && (
          <form onSubmit={handleNewPlatformSubmit} className="data-entry-form">
            <h2>2. Create New Social Media Platform</h2>
            <div className="form-group">
              <label htmlFor="newPlatformName">Platform Name:</label>
              <input
                type="text"
                id="newPlatformName"
                value={newPlatformName}
                onChange={handlePlatformChange}
                maxLength="50"
                required
              />
            </div>
            <button type="submit">Create Platform</button>
          </form>
        )}

        {activeTab === 'createUserAccount' && (
          <form onSubmit={handleNewUserAccountSubmit} className="data-entry-form">
            <h2>3. Create New User Account</h2>
            {platformsLoading && <p>Loading platforms...</p>}
            {platformsError && <p className="message error">{platformsError}</p>}
            <div className="form-group">
              <label htmlFor="user_social_media_name">Social Media Name:</label>
              <select
                id="user_social_media_name"
                name="social_media_name"
                value={newUserAccountData.social_media_name}
                onChange={handleUserAccountChange}
                required
                disabled={platformsLoading || platformsError || platforms.length === 0}
              >
                {platforms.length === 0 && !platformsLoading && <option value="">No platforms available</option>}
                {platforms.map(platform => (
                  <option key={platform.name} value={platform.name}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="user_username">Username:</label>
              <input type="text" id="user_username" name="username" value={newUserAccountData.username} onChange={handleUserAccountChange} maxLength="40" required />
            </div>
             <div className="form-group">
              <label htmlFor="first_name">First Name:</label>
              <input type="text" id="first_name" name="first_name" value={newUserAccountData.first_name} onChange={handleUserAccountChange} maxLength="50" />
            </div>
             <div className="form-group">
              <label htmlFor="last_name">Last Name:</label>
              <input type="text" id="last_name" name="last_name" value={newUserAccountData.last_name} onChange={handleUserAccountChange} maxLength="50" />
            </div>
             <div className="form-group">
              <label htmlFor="country_birth">Country of Birth:</label>
              <input type="text" id="country_birth" name="country_birth" value={newUserAccountData.country_birth} onChange={handleUserAccountChange} maxLength="50" />
            </div>
             <div className="form-group">
              <label htmlFor="country_residence">Country of Residence:</label>
              <input type="text" id="country_residence" name="country_residence" value={newUserAccountData.country_residence} onChange={handleUserAccountChange} maxLength="50" />
            </div>
             <div className="form-group">
              <label htmlFor="age">Age:</label>
              <input type="number" id="age" name="age" value={newUserAccountData.age} onChange={handleUserAccountChange} min="0" />
            </div>
             <div className="form-group">
              <label htmlFor="gender">Gender:</label>
              <input type="text" id="gender" name="gender" value={newUserAccountData.gender} onChange={handleUserAccountChange} maxLength="20" />
            </div>
             <div className="form-group form-group-inline">
              <input type="checkbox" id="verified" name="verified" checked={newUserAccountData.verified} onChange={handleUserAccountChange} />
              <label htmlFor="verified">Verified Account</label>
            </div>
            <button type="submit" disabled={platformsLoading || platformsError || platforms.length === 0}>Create User Account</button>
          </form>
        )}

        {activeTab === 'createPost' && (
          <form onSubmit={handleNewPostSubmit} className="data-entry-form">
            <h2>4. Create New Post</h2>
             {platformsLoading && <p>Loading platforms...</p>}
             {platformsError && <p className="message error">{platformsError}</p>}
             <div className="form-group">
                 <label htmlFor="post_social_media_name">Social Media Name:</label>
                 <select
                     id="post_social_media_name"
                     name="social_media_name"
                     value={newPostData.social_media_name}
                     onChange={handleNewPostChange}
                     required
                     disabled={platformsLoading || platformsError || platforms.length === 0}
                 >
                     {platforms.length === 0 && !platformsLoading && <option value="">No platforms available</option>}
                     {platforms.map(platform => (
                         <option key={platform.name} value={platform.name}>
                             {platform.name}
                         </option>
                     ))}
                 </select>
             </div>
              <div className="form-group">
                 <label htmlFor="username">Username:</label>
                 <input type="text" id="username" name="username" value={newPostData.username} onChange={handleNewPostChange} maxLength="40" required />
             </div>
             <div className="form-group">
                 <label htmlFor="content">Content:</label>
                 <textarea id="content" name="content" value={newPostData.content} onChange={handleNewPostChange} required></textarea>
             </div>
             <button type="submit" disabled={platformsLoading || platforms.length === 0}>Create Post</button>
          </form>
        )}

        {activeTab === 'associatePosts' && (
          <form onSubmit={handleAssociationSubmit} className="data-entry-form">
            <h2>5. Associate Posts with Project</h2>
             <div className="form-group">
              <label htmlFor="assocProjectName">Project Name:</label>
              {/* TODO: Replace with a select dropdown populated by fetched projects */}
              <input
                type="text"
                id="assocProjectName"
                name="assocProjectName"
                value={assocProjectName}
                onChange={handleAssociationChange}
                required
              />
              {/* Example Select (uncomment and adapt when projects are fetched):
              <select
                id="assocProjectName"
                name="assocProjectName"
                value={assocProjectName}
                onChange={handleAssociationChange}
                required
              >
                 <option value="">Select a Project</option>
                 {projects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
              */}
            </div>
             <div className="form-group">
              <label htmlFor="assocPostIds">Post IDs (comma-separated):</label>
              <input
                type="text"
                id="assocPostIds"
                name="assocPostIds"
                value={assocPostIds}
                onChange={handleAssociationChange}
                placeholder="e.g., 1, 5, 12"
                required
              />
            </div>
             <button type="submit">Associate Posts</button>
          </form>
        )}

        {activeTab === 'defineFields' && (
          <form onSubmit={handleFieldSubmit} className="data-entry-form">
              <h2>6. Add Analysis Field to Project</h2>
              <div className="form-group">
                  <label htmlFor="fieldProjectName">Project Name:</label>
                  {/* TODO: Replace with a select dropdown populated by fetched projects */}
                  <input type="text" id="fieldProjectName" value={fieldProjectName} onChange={(e) => setFieldProjectName(e.target.value)} required />
              </div>
              <div className="form-group">
                  <label htmlFor="field_name">Field Name:</label>
                  <input type="text" id="field_name" name="field_name" value={fieldData.field_name} onChange={handleFieldChange} maxLength="50" required />
              </div>
              <div className="form-group">
                  <label htmlFor="description">Field Description (Optional):</label>
                  <textarea id="description" name="description" value={fieldData.description} onChange={handleFieldChange}></textarea>
              </div>
              <button type="submit">Add Field</button>
          </form>
        )}

        {activeTab === 'enterResults' && (
           <form onSubmit={handleResultSubmit} className="data-entry-form">
             <h2>7. Enter Analysis Result</h2>
              <div className="form-group">
               <label htmlFor="resultProjectName">Project Name:</label>
               {/* TODO: Replace with a select dropdown populated by fetched projects */}
               <input type="text" id="resultProjectName" value={resultProjectName} onChange={(e) => setResultProjectName(e.target.value)} required />
             </div>
              <div className="form-group">
               <label htmlFor="postId">Post ID:</label>
               <input type="number" id="postId" name="postId" value={resultData.postId} onChange={handleResultChange} min="1" required />
             </div>
              <div className="form-group">
               <label htmlFor="fieldName">Field Name:</label>
               {/* TODO: Replace with a select dropdown populated by fetched fields (maybe filtered by project) */}
               <input type="text" id="fieldName" name="fieldName" value={resultData.fieldName} onChange={handleResultChange} maxLength="50" required />
             </div>
              <div className="form-group">
               <label htmlFor="value">Value:</label>
               <input type="text" id="value" name="value" value={resultData.value} onChange={handleResultChange} maxLength="255" required />
             </div>
              <button type="submit">Add Result</button>
           </form>
        )}

      </div> {/* End Tab Content Area */}
    </div>
  );
}

export default DataEntryPage; 