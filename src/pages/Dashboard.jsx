import React from 'react';
import './Dashboard.css';
import userIcon from '../assets/usericon.png';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' }
  ];

  const dummyTableData = [
    { stock: 'SBIN', analyst: '30', index: '25', stance: 'OW', price: '270', quantity: '100', gain: '+6%' },
    { stock: 'HDFC', analyst: '20', index: '22', stance: 'UW', price: '1724', quantity: '100', gain: '-7%' },
    { stock: 'HCL', analyst: '10', index: '15', stance: 'OW', price: '1000', quantity: '100', gain: '-5%' },
    { stock: 'KOTAKBANK', analyst: '30', index: '20', stance: 'UW', price: '1820', quantity: '100', gain: '+2%' },
    { stock: 'CANBK', analyst: '10', index: '18', stance: 'OW', price: '500', quantity: '100', gain: '-3%' },
    { stock: '', analyst: '100', index: '100', stance: '', price: '', quantity: '', gain: '' },
  ];

  return (
    <div className="dashboard-wrapper">
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

      <main className="dashboard-container">
        <div className="dashboard-topbar">
          <input type="text" placeholder="Search..." className="dashboard-search" />
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

        <div className="dashboard-header-wrapper">
          <div className="dashboard-header-left">
            <h1 className="dashboard-title">Current Allocation Sector</h1>
            <div className="dashboard-filters">
              <select className="dashboard-select">
                <option>Select Allocation Sector</option>
                <option>Energy</option>
                <option>Finance</option>
              </select>
            </div>
          </div>

          <div className="dashboard-card big-card">
            <div className="big-card-row">
              <div className="big-card-label">Total Invested Amount</div>
              <div className="big-card-value">10,000 Cr</div>
            </div>

            <div className="big-card-row">
              <div className="big-card-label">Current Portfolio Value</div>
              <div className="big-card-value">10,612 Cr</div>
            </div>

            <div className="big-card-row pndl-date-row">
              <div className="pnl-info">
                <div className="big-card-label">Total P&amp;L</div>
                <div className="big-card-value green">+1.12%</div>
              </div>
              <div className="date-info">
                <div className="big-card-label">As of</div>
                <input type="date" className="dashboard-date" />
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Analyst Weight</th>
                <th>Index Weight</th>
                <th>Analyst Stance</th>
                <th>Last Closing Price</th>
                <th>Number of Stocks</th>
                <th>Gain</th>
              </tr>
            </thead>
            <tbody>
              {dummyTableData.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.stock}</td>
                  <td>{item.analyst}</td>
                  <td>{item.index}</td>
                  <td>{item.stance}</td>
                  <td>{item.price}</td>
                  <td>{item.quantity}</td>
                  <td className={item.gain.startsWith('+') ? 'text-green' : 'text-red'}>
                    {item.gain}
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

export default Dashboard;
