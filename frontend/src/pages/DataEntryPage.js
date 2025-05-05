import React, { useState } from 'react';
import apiService from '../services/apiService'; // Create this service file

function DataEntryPage() {
  // --- State for Project Entry ---
  const [projectData, setProjectData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    institute_name: '',
    manager_first_name: '',
    manager_last_name: '',
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

   const handleFieldChange = (e) => {
       setFieldData({ ...fieldData, [e.target.name]: e.target.value });
   };

   const handleFieldSubmit = async (e) => {
       e.preventDefault();
       setMessage('Adding field...');
       if (!fieldProjectName || !fieldData.field_name) {
           setMessage('Please enter a project name and field name.');
           return;
       }
       try {
           const response = await apiService.addProjectField(fieldProjectName, fieldData);
           setMessage(`Field added/verified for project '${fieldProjectName}' (Backend response: ${response.data.message})`);
           setFieldData({ field_name: '', description: '' }); // Clear field form
           // Keep fieldProjectName potentially for multiple entries
       } catch (error) {
           setMessage(`Error adding field: ${error.response?.data?.message || error.message}`);
       }
   };

  return (
    <div>
      <h2>Data Entry</h2>
      {message && <p style={{ color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}

      {/* --- Project Entry Form --- */}
      <form onSubmit={handleProjectSubmit}>
        <h3>Enter New Project</h3>
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

      {/* --- Post Association Form --- */}
      <form onSubmit={handleAssociationSubmit}>
        <h3>Associate Posts with Project</h3>
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

      {/* --- Field Entry Form --- */}
      <form onSubmit={handleFieldSubmit}>
          <h3>Add Analysis Field to Project</h3>
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

      {/* --- Analysis Result Entry Form --- */}
       <form onSubmit={handleResultSubmit}>
         <h3>Enter Analysis Result</h3>
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
    </div>
  );
}

export default DataEntryPage; 