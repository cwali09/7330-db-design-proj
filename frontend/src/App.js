import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css'; // Basic styling

// Import Page Components (create these files next)
import HomePage from './pages/HomePage';
import DataEntryPage from './pages/DataEntryPage';
import QueryPostsPage from './pages/QueryPostsPage';
import QueryExperimentPage from './pages/QueryExperimentPage';
import QueryPostsThenExperimentsPage from './pages/QueryPostsThenExperimentsPage';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <h1>Social Media Analyzer</h1>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/data-entry">Data Entry</Link></li>
            <li><Link to="/query-posts">Query Posts</Link></li>
            <li><Link to="/query-experiment">Query Experiment</Link></li>
            <li><Link to="/query-posts-then-experiments">Posts &rarr; Experiments</Link></li>
          </ul>
        </nav>

        <main className="content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/data-entry" element={<DataEntryPage />} />
            <Route path="/query-posts" element={<QueryPostsPage />} />
            <Route path="/query-experiment" element={<QueryExperimentPage />} />
            <Route path="/query-posts-then-experiments" element={<QueryPostsThenExperimentsPage />} />
            {/* Add more specific routes or nested routes as needed */}
          </Routes>
        </main>

        <footer className="footer">
          <p>&copy; 2025 CS 5330 Group Project</p>
        </footer>
      </div>
    </Router>
  );
}

export default App; 