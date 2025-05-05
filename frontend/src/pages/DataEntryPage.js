import React, { useState } from 'react';
import apiService from '../services/apiService'; // Create this service file

// Basic inline styles for tabs (consider moving to a CSS file for larger apps)
const tabStyles = {
    tabsContainer: {
        marginBottom: '20px',
        borderBottom: '1px solid #ccc',
        paddingBottom: '5px',
    },
    tabButton: {
        padding: '10px 15px',
        cursor: 'pointer',
        border: '1px solid transparent',
        borderBottom: 'none',
        marginRight: '5px',
        background: '#f0f0f0',
        borderRadius: '5px 5px 0 0',
    },
    activeTabButton: {
        border: '1px solid #ccc',
        borderBottom: '1px solid white', // Creates the "connected" look
        background: 'white',
        fontWeight: 'bold',
    },
    tabContent: {
        padding: '20px',
        border: '1px solid #ccc',
        borderTop: 'none',
        borderRadius: '0 0 5px 5px',
        marginTop: '-6px', // Overlap with tab border bottom
    }
};

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

  // --- State for New User Account Entry ---
  const [newUserAccountData, setNewUserAccountData] = useState({
      social_media_name: '',
      username: '',
      first_name: '',
      last_name: '',
      country_birth: '',
      country_residence: '',
      age: '',
      gender: '',
      verified: false // Default to false
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

  // --- State for New Post Entry (Corrected) ---
  const [newPostData, setNewPostData] = useState({
      social_media_name: '', // Changed from platform
      username: '',          // Added
      content: '',
      post_date: '',         // Consider using a date picker input type="date"
      // Removed author_id
  });

  const [message, setMessage] = useState(''); // For feedback

  // --- Handlers ---
  const handleProjectChange = (e) => {
    setProjectData({ ...projectData, [e.target.name]: e.target.value });
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setMessage('Submitting project...');
    try {
      const response = await apiService.createProject(projectData);
      setMessage(`Project '${response.data.data.name}' created successfully (Backend response: ${response.data.message})`);
      // Clear form or provide other feedback
      setProjectData({ name: '', start_date: '', end_date: '', institute_name: '', manager_first_name: '', manager_last_name: '' });
    } catch (error) {
      setMessage(`Error creating project: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handler for New Social Media Platform form changes
  const handleNewPlatformChange = (e) => {
      setNewPlatformName(e.target.value);
  };

  // Handler for New Social Media Platform form submission
  const handleNewPlatformSubmit = async (e) => {
      e.preventDefault();
      setMessage('Creating social media platform...');
      if (!newPlatformName || newPlatformName.trim() === '') {
          setMessage('Please enter a name for the social media platform.');
          return;
      }
      try {
          const platformData = { name: newPlatformName.trim() };
          const response = await apiService.createSocialMediaPlatform(platformData);
          setMessage(`Social media platform '${response.data.data.name}' created successfully.`);
          setNewPlatformName(''); // Clear the form
          // Optional: You could refetch the list of platforms here if needed elsewhere
      } catch (error) {
          setMessage(`Error creating platform: ${error.response?.data?.message || error.message}`);
      }
  };

  // Handler for New User Account form changes
  const handleNewUserAccountChange = (e) => {
      const { name, value, type, checked } = e.target;
      setNewUserAccountData(prevData => ({
          ...prevData,
          [name]: type === 'checkbox' ? checked : value
      }));
  };

  // Handler for New User Account form submission
  const handleNewUserAccountSubmit = async (e) => {
      e.preventDefault();
      setMessage('Creating user account...');
      if (!newUserAccountData.social_media_name || !newUserAccountData.username) {
          setMessage('Please fill in Social Media Name and Username.');
          return;
      }
      try {
          // Prepare data, ensuring age is a number or null
          const dataToSend = {
              ...newUserAccountData,
              age: newUserAccountData.age ? parseInt(newUserAccountData.age) : null
          };
          const response = await apiService.createUserAccount(dataToSend);
          setMessage(`User account '${response.data.data.username}' on '${response.data.data.social_media_name}' created successfully.`);
          // Clear the form
          setNewUserAccountData({
              social_media_name: '', username: '', first_name: '', last_name: '',
              country_birth: '', country_residence: '', age: '', gender: '', verified: false
          });
      } catch (error) {
          setMessage(`Error creating user account: ${error.response?.data?.message || error.message}`);
      }
  };

  const handleNewPostChange = (e) => {
      setNewPostData({ ...newPostData, [e.target.name]: e.target.value });
  };

  const handleNewPostSubmit = async (e) => {
      e.preventDefault();
      setMessage('Creating new post...');
      // Validate required fields based on the corrected state
      if (!newPostData.social_media_name || !newPostData.username || !newPostData.content || !newPostData.post_date) {
          setMessage('Please fill in Social Media Name, Username, Content, and Post Date for the new post.');
          return;
      }
      try {
          // Send the corrected data structure
          const response = await apiService.createPost(newPostData);
          setMessage(`New post created successfully with ID: ${response.data.data.post_id} (Backend response: ${response.data.message})`);
          // Clear the form using the corrected state structure
          setNewPostData({ social_media_name: '', username: '', content: '', post_date: '' });
      } catch (error) {
          setMessage(`Error creating post: ${error.response?.data?.message || error.message}`);
      }
  };

  const handleAssociationSubmit = async (e) => {
     e.preventDefault();
     setMessage('Associating posts...');
     const postIdsArray = assocPostIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
     if (!assocProjectName || postIdsArray.length === 0) {
         setMessage('Please enter a project name and valid, comma-separated post IDs.');
         return;
     }
     try {
         const response = await apiService.associatePosts(assocProjectName, postIdsArray);
         setMessage(`Posts associated with project '${assocProjectName}' (Backend response: ${response.data.message})`);
         setAssocProjectName('');
         setAssocPostIds('');
     } catch (error) {
         setMessage(`Error associating posts: ${error.response?.data?.message || error.message}`);
     }
  };

  const handleFieldChange = (e) => {
      setFieldData({ ...fieldData, [e.target.name]: e.target.value });
  };

  const handleFieldSubmit = async (e) => {
      e.preventDefault();
      setMessage('Adding project field...');
      if (!fieldProjectName || !fieldData.field_name) {
          setMessage('Please provide a project name and a field name.');
          return;
      }
      try {
          const response = await apiService.addProjectField(fieldProjectName, fieldData);
          setMessage(`Field '${fieldData.field_name}' added to project '${fieldProjectName}' (Backend response: ${response.data.message})`);
          // Keep project name, clear field data
          setFieldData({ field_name: '', description: '' });
      } catch (error) {
          setMessage(`Error adding field: ${error.response?.data?.message || error.message}`);
      }
  };

   const handleResultChange = (e) => {
     setResultData({ ...resultData, [e.target.name]: e.target.value });
   };

   const handleResultSubmit = async (e) => {
     e.preventDefault();
     setMessage('Submitting analysis result...');
      if (!resultProjectName || !resultData.postId || !resultData.fieldName || resultData.value === '') {
          setMessage('Please fill in all fields for the analysis result.');
          return;
      }
     try {
         const response = await apiService.addAnalysisResult(resultProjectName, resultData);
         setMessage(`Analysis result added for project '${resultProjectName}' (Backend response: ${response.data.message})`);
         setResultData({ postId: '', fieldName: '', value: '' });
         // Keep resultProjectName potentially for multiple entries
     } catch (error) {
         setMessage(`Error adding result: ${error.response?.data?.message || error.message}`);
     }
   };

  // Helper to get button style
  const getButtonStyle = (tabName) => ({
      ...tabStyles.tabButton,
      ...(activeTab === tabName ? tabStyles.activeTabButton : {}),
  });

  return (
    <div>
      <h2>Data Entry</h2>
      {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}

      {/* Tab Navigation */}
      <div style={tabStyles.tabsContainer}>
        <button style={getButtonStyle('createProject')} onClick={() => setActiveTab('createProject')}>
          1. Create Project
        </button>
        <button style={getButtonStyle('createPlatform')} onClick={() => setActiveTab('createPlatform')}>
          2. Create Social Media Platform
        </button>
        <button style={getButtonStyle('createUserAccount')} onClick={() => setActiveTab('createUserAccount')}>
          3. Create User Account
        </button>
        <button style={getButtonStyle('createPost')} onClick={() => setActiveTab('createPost')}>
          4. Create Post
        </button>
        <button style={getButtonStyle('associatePosts')} onClick={() => setActiveTab('associatePosts')}>
          5. Associate Posts
        </button>
        <button style={getButtonStyle('defineFields')} onClick={() => setActiveTab('defineFields')}>
          6. Define Project Fields
        </button>
        <button style={getButtonStyle('enterResults')} onClick={() => setActiveTab('enterResults')}>
          7. Enter Analysis Results
        </button>
      </div>

      {/* Tab Content Area */}
      <div style={tabStyles.tabContent}>
        {/* Conditionally render forms based on activeTab */}

        {activeTab === 'createProject' && (
          <form onSubmit={handleProjectSubmit}>
            <h3>1. Create New Project</h3>
            <div className="form-group">
              <label htmlFor="name">Project Name:</label>
              <input type="text" id="name" name="name" value={projectData.name} onChange={handleProjectChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="start_date">Start Date:</label>
              <input type="date" id="start_date" name="start_date" value={projectData.start_date} onChange={handleProjectChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="end_date">End Date:</label>
              <input type="date" id="end_date" name="end_date" value={projectData.end_date} onChange={handleProjectChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="institute_name">Institute Name:</label>
              <input type="text" id="institute_name" name="institute_name" value={projectData.institute_name} onChange={handleProjectChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="manager_first_name">Manager First Name:</label>
              <input type="text" id="manager_first_name" name="manager_first_name" value={projectData.manager_first_name} onChange={handleProjectChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="manager_last_name">Manager Last Name:</label>
              <input type="text" id="manager_last_name" name="manager_last_name" value={projectData.manager_last_name} onChange={handleProjectChange} required />
            </div>
            <button type="submit">Create Project</button>
          </form>
        )}

        {activeTab === 'createPlatform' && (
            <form onSubmit={handleNewPlatformSubmit}>
                <h3>2. Create New Social Media Platform</h3>
                <div className="form-group">
                    <label htmlFor="platform_name">Platform Name:</label>
                    <input
                        type="text"
                        id="platform_name"
                        name="platform_name"
                        value={newPlatformName}
                        onChange={handleNewPlatformChange}
                        maxLength="50"
                        required
                    />
                </div>
                <button type="submit">Create Platform</button>
            </form>
        )}

        {activeTab === 'createUserAccount' && (
            <form onSubmit={handleNewUserAccountSubmit}>
                <h3>3. Create New User Account</h3>
                {/* Required Fields */}
                <div className="form-group">
                    <label htmlFor="ua_social_media_name">Social Media Platform:</label>
                    <input type="text" id="ua_social_media_name" name="social_media_name" value={newUserAccountData.social_media_name} onChange={handleNewUserAccountChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="ua_username">Username:</label>
                    <input type="text" id="ua_username" name="username" value={newUserAccountData.username} onChange={handleNewUserAccountChange} maxLength="40" required />
                </div>
                {/* Optional Fields */}
                <div className="form-group">
                    <label htmlFor="ua_first_name">First Name (Optional):</label>
                    <input type="text" id="ua_first_name" name="first_name" value={newUserAccountData.first_name} onChange={handleNewUserAccountChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="ua_last_name">Last Name (Optional):</label>
                    <input type="text" id="ua_last_name" name="last_name" value={newUserAccountData.last_name} onChange={handleNewUserAccountChange} />
                </div>
                 <div className="form-group">
                    <label htmlFor="ua_country_birth">Country of Birth (Optional):</label>
                    <input type="text" id="ua_country_birth" name="country_birth" value={newUserAccountData.country_birth} onChange={handleNewUserAccountChange} />
                </div>
                 <div className="form-group">
                    <label htmlFor="ua_country_residence">Country of Residence (Optional):</label>
                    <input type="text" id="ua_country_residence" name="country_residence" value={newUserAccountData.country_residence} onChange={handleNewUserAccountChange} />
                </div>
                 <div className="form-group">
                    <label htmlFor="ua_age">Age (Optional):</label>
                    <input type="number" id="ua_age" name="age" value={newUserAccountData.age} onChange={handleNewUserAccountChange} min="1" />
                </div>
                 <div className="form-group">
                    <label htmlFor="ua_gender">Gender (Optional):</label>
                    <input type="text" id="ua_gender" name="gender" value={newUserAccountData.gender} onChange={handleNewUserAccountChange} />
                </div>
                 <div className="form-group">
                    <label htmlFor="ua_verified">Verified Account:</label>
                    <input type="checkbox" id="ua_verified" name="verified" checked={newUserAccountData.verified} onChange={handleNewUserAccountChange} />
                </div>
                <button type="submit">Create User Account</button>
            </form>
        )}

        {activeTab === 'createPost' && (
          <form onSubmit={handleNewPostSubmit}>
              <h3>4. Create New Post</h3>
              <div className="form-group">
                  <label htmlFor="social_media_name">Social Media Name:</label>
                  {/* You might want a dropdown if you have a fixed list of platforms */}
                  <input type="text" id="social_media_name" name="social_media_name" value={newPostData.social_media_name} onChange={handleNewPostChange} required />
              </div>
               <div className="form-group">
                  <label htmlFor="username">Username:</label>
                  <input type="text" id="username" name="username" value={newPostData.username} onChange={handleNewPostChange} maxLength="40" required />
              </div>
              <div className="form-group">
                  <label htmlFor="content">Content:</label>
                  <textarea id="content" name="content" value={newPostData.content} onChange={handleNewPostChange} required></textarea>
              </div>
              <div className="form-group">
                  <label htmlFor="post_date">Post Date:</label>
                  {/* Use type="date" for better UX, ensure backend handles YYYY-MM-DD */}
                  <input type="date" id="post_date" name="post_date" value={newPostData.post_date} onChange={handleNewPostChange} required />
              </div>
              {/* Removed Author ID input */}
              <button type="submit">Create Post</button>
          </form>
        )}

        {activeTab === 'associatePosts' && (
          <form onSubmit={handleAssociationSubmit}>
            <h3>5. Associate Posts with Project</h3>
             <div className="form-group">
              <label htmlFor="assocProjectName">Project Name:</label>
              <input type="text" id="assocProjectName" value={assocProjectName} onChange={(e) => setAssocProjectName(e.target.value)} required />
            </div>
             <div className="form-group">
              <label htmlFor="assocPostIds">Post IDs (comma-separated):</label>
              <input type="text" id="assocPostIds" value={assocPostIds} onChange={(e) => setAssocPostIds(e.target.value)} required />
            </div>
             <button type="submit">Associate Posts</button>
          </form>
        )}

        {activeTab === 'defineFields' && (
          <form onSubmit={handleFieldSubmit}>
              <h3>6. Add Analysis Field to Project</h3>
              <div className="form-group">
                  <label htmlFor="fieldProjectName">Project Name:</label>
                  <input type="text" id="fieldProjectName" value={fieldProjectName} onChange={(e) => setFieldProjectName(e.target.value)} required />
              </div>
              <div className="form-group">
                  <label htmlFor="field_name">Field Name:</label>
                  <input type="text" id="field_name" name="field_name" value={fieldData.field_name} onChange={handleFieldChange} required />
              </div>
              <div className="form-group">
                  <label htmlFor="description">Field Description (Optional):</label>
                  <textarea id="description" name="description" value={fieldData.description} onChange={handleFieldChange}></textarea>
              </div>
              <button type="submit">Add Field</button>
          </form>
        )}

        {activeTab === 'enterResults' && (
           <form onSubmit={handleResultSubmit}>
             <h3>7. Enter Analysis Result</h3>
              <div className="form-group">
               <label htmlFor="resultProjectName">Project Name:</label>
               <input type="text" id="resultProjectName" value={resultProjectName} onChange={(e) => setResultProjectName(e.target.value)} required />
             </div>
              <div className="form-group">
               <label htmlFor="postId">Post ID:</label>
               <input type="number" id="postId" name="postId" value={resultData.postId} onChange={handleResultChange} required />
             </div>
              <div className="form-group">
               <label htmlFor="fieldName">Field Name:</label>
               <input type="text" id="fieldName" name="fieldName" value={resultData.fieldName} onChange={handleResultChange} required />
             </div>
              <div className="form-group">
               <label htmlFor="value">Value:</label>
               <input type="text" id="value" name="value" value={resultData.value} onChange={handleResultChange} required />
             </div>
              <button type="submit">Add Result</button>
           </form>
        )}

      </div> {/* End Tab Content Area */}
    </div>
  );
}

export default DataEntryPage; 