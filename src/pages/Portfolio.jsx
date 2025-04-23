import React from 'react';
import './Dashboard.css';
import userIcon from '../assets/usericon.png';
import { Link } from 'react-router-dom';

const Portfolio = () => {
  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' },
  ];

  const portfolioStocks = [
    { stock_name: 'HDFC', sector: 'Banking', quantity: 1500, company: '------------------' },
    { stock_name: 'LIC', sector: 'Banking', quantity: 2000, company: '------------------' },
    { stock_name: 'ITC', sector: 'FMCG', quantity: 1200, company: '------------------' },
    { stock_name: 'NESTLE', sector: 'FMCG', quantity: 2300, company: '------------------' },
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
          <input type="text" placeholder="Search for stocks & more" className="dashboard-search" />
          <div className="dashboard-user-info">
            <div className="dashboard-user">
              <img src={userIcon} alt="User Icon" className="dashboard-user-icon" />
              <div className="user-text">
                <div className="user-name">ABC</div>
                <div className="user-email">abc@gmail.com</div>
              </div>
            </div>
          </div>
        </div>

        <div className="portfolio-section">
          <h2 className="dashboard-title">Stocks in Portfolio</h2>

          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Stock Name</th>
                  <th>Sector Name</th>
                  <th>Number of Stocks (QTY)</th>
                  <th>Company</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {portfolioStocks.map((stock, index) => (
                  <tr key={index}>
                    <td>{stock.stock_name}</td>
                    <td>{stock.sector}</td>
                    <td>{stock.quantity}</td>
                    <td>{stock.company}</td>
                    <td>
                      <button className="edit-btn">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
