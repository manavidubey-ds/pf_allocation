import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';
import userIcon from '../assets/usericon.png';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/stocks')
      .then(res => {
        console.log('Fetched Stocks:', res.data);
        setStocks(res.data); // ensure the backend returns an array
      })
      .catch(err => {
        console.error('Error fetching stocks:', err);
      });
  }, []);

  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' }
  ];

  // Calculate totals
  const totalAnalystWeight = stocks.reduce((sum, item) => sum + parseFloat(item.analyst_weight || 0), 0).toFixed(2);
  const totalIndexWeight = stocks.reduce((sum, item) => sum + parseFloat(item.index_weight || 0), 0).toFixed(2);

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
                <div className="user-name"> ABC</div>
                <div className="user-email">abc@gmail.com</div>
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
              {Array.isArray(stocks) && stocks.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.stock_name}</td>
                  <td>{item.analyst_weight}</td>
                  <td>{item.index_weight}</td>
                  <td>{item.stance}</td>
                  <td>{item.last_closing_price}</td>
                  <td>{item.number_of_shares}</td>
                  <td className={item.gain?.startsWith('+') ? 'text-green' : 'text-red'}>
                    {item.gain}
                  </td>
                </tr>
              ))}
              {/* New row for totals */}
              <tr>
                <td colSpan="1">Total</td>
                <td>{totalAnalystWeight}</td>
                <td>{totalIndexWeight}</td>
                <td colSpan="4"></td> {/* Span the remaining columns */}
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;