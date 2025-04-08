import React from 'react';
import './Dashboard.css';
import userIcon from '../assets/usericon.png';
import { Link } from 'react-router-dom';

const List = () => {
  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' }
  ];

  const tableData = [
    { sr: 1, date: '01-04-2023', stocks: 'SBI', gain: '+3%', notes: 'As per change in NIFTY50 Index' },
    { sr: 2, date: '01-01-2023', stocks: 'PNB, CANARA', gain: '-4%', notes: 'As per change in NIFTY50 Index' },
    { sr: 3, date: '01-10-2023', stocks: 'ICICI, HDFC', gain: '+2%', notes: 'As per change in NIFTY50 Index' },
  ];

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
              className={window.location.pathname === page.route ? 'active' : ''}
            >
              {page.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Dashboard */}
      <main className="dashboard-container">
        {/* Topbar */}
        <div className="dashboard-topbar">
          <input type="text" className="dashboard-search" placeholder="Search.." />
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

        {/* Page Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Portfolio Allocations List</h1>
        </div>

        {/* Unique Table Section */}
        <div className="list-table-container">
          <table className="list-table">
            <thead>
              <tr className="list-table-header-row">
                <th className="list-table-header">Sr No</th>
                <th className="list-table-header">Date of Change</th>
                <th className="list-table-header">Stocks Picked</th>
                <th className="list-table-header">Gain</th>
                <th className="list-table-header">Notes</th>
                <th className="list-table-header">Report</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr className="list-table-row" key={index}>
                  <td className="list-table-cell">{row.sr}</td>
                  <td className="list-table-cell">{row.date}</td>
                  <td className="list-table-cell">{row.stocks}</td>
                  <td className={`list-table-cell ${row.gain.startsWith('+') ? 'text-green' : 'text-red'}`}>
                    {row.gain}
                  </td>
                  <td className="list-table-cell">{row.notes}</td>
                  <td className="list-table-cell">
                  <Link to="/portfolio-details">
                  <button className="list-table-btn">View</button>
                  </Link>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default List;
