import React from 'react';
import './Dashboard.css';
import { useNavigate, Link } from 'react-router-dom';
import userIcon from '../assets/usericon.png';

const PortfolioDetails = () => {
  const navigate = useNavigate();

  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' }
  ];

  const portfolioData = [
    {
      stock: 'KotakBank',
      initialWeight: 10,
      indexWeight: 12,
      numberShares: 100,
      currentPrice: 525,
      gain: '+4%',
      note: 'Change in Nifty Bank'
    },
    {
      stock: 'Infosys',
      initialWeight: 15,
      indexWeight: 13,
      numberShares: 150,
      currentPrice: 1350,
      gain: '-1.5%',
      note: 'Tech Sector Correction'
    },
    {
      stock: 'Reliance',
      initialWeight: 18,
      indexWeight: 17,
      numberShares: 200,
      currentPrice: 2450,
      gain: '+2.8%',
      note: 'Strong Q4 earnings'
    },
    {
      stock: 'TCS',
      initialWeight: 12,
      indexWeight: 14,
      numberShares: 120,
      currentPrice: 3450,
      gain: '+5.5%',
      note: 'AI-based Revenue Growth'
    }
  ];

  const totalPnL = '-3.25%';
  const isPositive = totalPnL.startsWith('+');

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="sidebar-title">PF Allocation Tool</h2>
        <nav className="sidebar-nav">
          {navPages.map((page) => (
            <Link
              key={page.name}
              to={page.route}
              className={(page.route === '/list' && window.location.pathname.includes('/portfolio')) || window.location.pathname === page.route ? 'active' : ''}>
              {page.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Dashboard */}
      <main className="dashboard-container">
        {/* Topbar */}
        <div className="dashboard-topbar">
          <input type="text" className="dashboard-search" placeholder="Search .." />
          <div className="dashboard-user-info">
            <div className="dashboard-user">
              <img src={userIcon} alt="User Icon" className="dashboard-user-icon" />
              <div className="user-text">
                <div className="user-name">John Doe</div>
                <div className="user-email">john@example.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Heading Section */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Portfolio Allocations List</h1>
        </div>
        <button className="list-table-btn back-btn" onClick={() => navigate('/list')}>← Back</button>
        <div className="dashboard-subtitle">Date: <span>01 - 03 - 2025</span></div>

        {/* Table */}
        <div className="list-table-container">
          <table className="list-table">
            <thead>
              <tr className="list-table-header-row">
                <th className="list-table-header">Stock</th>
                <th className="list-table-header">Analyst Weight</th>
                <th className="list-table-header">Index Weight</th>
                <th className="list-table-header">Analyst Stance</th>
                <th className="list-table-header">Number of Shares</th>
                <th className="list-table-header">Current Price</th>
                <th className="list-table-header">Gain</th>
                <th className="list-table-header">Note</th>
                <th className="list-table-header">View Report</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.map((item, index) => (
                <tr key={index} className="list-table-row">
                  <td className="list-table-cell">{item.stock}</td>
                  <td className="list-table-cell">{item.initialWeight}</td>
                  <td className="list-table-cell">{item.indexWeight}</td>
                  <td className="list-table-cell">{item.indexWeight > item.initialWeight ? 'Underweight' : 'Overweight'}</td>
                  <td className="list-table-cell">{item.numberShares}</td>
                  <td className="list-table-cell">{item.currentPrice}</td>
                  <td className={`list-table-cell ${item.gain.startsWith('+') ? 'text-green' : 'text-red'}`}>
                    {item.gain}
                  </td>
                  <td className="list-table-cell">{item.note}</td>
                  <td className="list-table-cell"><button className="list-table-btn">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pnl-footer">
          <span className={`pnl-badge ${isPositive ? 'green-badge' : 'red-badge'}`}>
            Total P&L: {totalPnL}
          </span>
        </div>
      </main>
    </div>
  );
};

export default PortfolioDetails;
