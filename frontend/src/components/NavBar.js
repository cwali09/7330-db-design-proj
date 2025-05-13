import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css'; // Assuming you have CSS for the NavBar

function NavBar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">DB Project</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/data-entry">Data Entry</Link></li>
        <li><Link to="/query-posts">Query Posts</Link></li>
        <li><Link to="/query-experiment">Query Experiment</Link></li>
        <li><Link to="/query-posts-experiments">Query Posts & Experiments</Link></li>
        {/* Add links for new pages */}
        <li><Link to="/repost">Create Repost</Link></li>
        <li><Link to="/view-reposts">View Reposts</Link></li>
      </ul>
    </nav>
  );
}

export default NavBar; 