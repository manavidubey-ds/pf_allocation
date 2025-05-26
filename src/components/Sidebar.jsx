import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import userIcon from '../assets/usericon.png';
import '../pages/Dashboard.css';

const Sidebar = () => {
  const location = useLocation();

  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' }
  ];

  return (
    <aside className="sidebar">
        <h2 className="sidebar-title">Model Portfolio Tracker</h2>
    
      <div className="dashboard-user-info sidebar-user-info">
        <div className="dashboard-user">
          <img src={userIcon} alt="User Icon" className="dashboard-user-icon" />
          <div className="user-text">
          <div className="user-name">DZ</div>
        <div className="user-email">help@dataeaze.com</div>
        <div className="user-email">Power Sector Analyst</div>
          </div>
        </div>
      </div>
    
      <nav className="sidebar-nav">
        {navPages.map((page) => (
          <Link
            key={page.name}
            to={page.route}
            className={location.pathname === page.route ? 'active' : ''}
          >
            {page.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
