import React, { useState } from 'react';
import './Dashboard.css';
import userIcon from '../assets/usericon.png';
import { Link } from 'react-router-dom';

const Modify = () => {
  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' }
  ];

  const portfolioWeights = [
    { stock: 'TCS', analystWeight: 30, shares: 100, indexWeight: 18, stance: 'Auto-Calculate', notes: '.....' },
    { stock: 'HDFC', analystWeight: 20, shares: 200, indexWeight: 15, stance: 'Auto-Calculate', notes: '.....' },
    { stock: 'INFY', analystWeight: 25, shares: 150, indexWeight: 20, stance: 'Auto-Calculate', notes: '.....' },
    { stock: 'PVR', analystWeight: 25, shares: 60, indexWeight: 16, stance: 'Auto-Calculate', notes: '.....' }
  ];

  const [weights, setWeights] = useState(portfolioWeights.map(row => row.analystWeight));
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'invalid' or 'confirmSave'

  const handleWeightChange = (index, value) => {
    const updated = [...weights];
    updated[index] = parseFloat(value);
    setWeights(updated);
  };

  const handleDone = () => {
    const total = weights.reduce((acc, curr) => acc + curr, 0);
    if (total !== 100) {
      setModalType("invalid");
      setShowModal(true);
    } else {
      alert("Weights are valid and sum to 100%");
    }
  };

  const handleSave = () => {
    setModalType("confirmSave");
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalType("");
  };

  const handleConfirmSave = () => {
    setShowModal(false);
    alert("Changes saved! ✅");
  };

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
          <h1 className="dashboard-title">Modify Portfolio Weights</h1>
        </div>

        {/* Modify Table Section */}
        <div className="modify-table-container">
          <table className="modify-table">
            <thead>
              <tr className="modify-table-header-row">
                <th className="modify-table-header">Stock Name</th>
                <th className="modify-table-header">Analyst Weight (%)</th>
                <th className="modify-table-header">Number of Stocks</th>
                <th className="modify-table-header">Index Weight (%)</th>
                <th className="modify-table-header">Analyst Stance</th>
                <th className="modify-table-header">Notes</th>
                <th className="modify-table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {portfolioWeights.map((row, index) => (
                <tr className="modify-table-row" key={index}>
                  <td className="modify-table-cell">{row.stock}</td>
                  <td className="modify-table-cell">
                    <input
                      type="number"
                      value={weights[index]}
                      onChange={(e) => handleWeightChange(index, e.target.value)}
                      className="modify-input"
                    />
                  </td>
                  <td className="modify-table-cell">
                    <input
                      type="number"
                      defaultValue={row.shares}
                      className="modify-input"
                    />
                  </td>
                  <td className="modify-table-cell">{row.indexWeight}</td>
                  <td className="modify-table-cell">{row.stance}</td>
                  <td className="modify-table-cell">{row.notes}</td>
                  <td className="modify-table-cell">
                    <button className="modify-btn">Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Action Buttons */}
          <div className="button-container">
            <button className="done-btn" onClick={handleDone}>Done</button>
            <button className="save-btn" onClick={handleSave}>Save</button>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              {modalType === "invalid" && (
                <>
                  <h2>Invalid Weights</h2>
                  <p>Your stock weights do not add up to 100%.</p>
                  <button className="modal-btn" onClick={handleModalClose}>Try Again</button>
                </>
              )}
              {modalType === "confirmSave" && (
                <>
                  <h2>Confirm Save</h2>
                  <p>Are you sure you want to save the changes?</p>
                  <div className="modal-actions">
                    <button className="modal-btn yes" onClick={handleConfirmSave}>Yes</button>
                    <button className="modal-btn no" onClick={handleModalClose}>No</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Modify;
