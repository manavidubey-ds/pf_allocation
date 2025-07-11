import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import userIcon from '../assets/usericon.png';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import LoadingIndicator from '../components/LoadingIndicator';

const CorporateAction = () => {
  const [corporateActions, setCorporateActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAction, setNewAction] = useState({
    security_name: '',
    action_type: 'dividend',
    value: '',
    ex_date: '',
    record_date: '',
    payment_date: '',
    notes: ''
  });

  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' },
    { name: 'Corporate Action', route: '/corporate-action' }
  ];

  useEffect(() => {
    fetchCorporateActions();
  }, []);

  const fetchCorporateActions = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/corporate-actions');
      if (!response.ok) {
        throw new Error('Failed to fetch corporate actions');
      }
      const data = await response.json();
      setCorporateActions(data);
    } catch (error) {
      console.error('Error fetching corporate actions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAction = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/corporate-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAction),
      });

      if (!response.ok) {
        throw new Error('Failed to add corporate action');
      }

      setShowAddModal(false);
      setNewAction({
        security_name: '',
        action_type: 'dividend',
        value: '',
        ex_date: '',
        record_date: '',
        payment_date: '',
        notes: ''
      });
      fetchCorporateActions();
    } catch (error) {
      console.error('Error adding corporate action:', error);
      setError(error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatValue = (actionType, value) => {
    if (!value) return '-';
    switch (actionType) {
      case 'dividend':
        return `₹${parseFloat(value).toFixed(2)}`;
      case 'face_value':
        return `₹${parseFloat(value).toFixed(2)}`;
      case 'bonus':
        return `${value}:1`;
      default:
        return value;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <Sidebar />
        <main className="dashboard-container">
          <div className="loading-container">
            <LoadingIndicator />
            <p>Loading corporate actions...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <Sidebar />
        <main className="dashboard-container">
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Retry Loading
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <main className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Corporate Actions</h2>
          <button 
            className="add-button"
            onClick={() => setShowAddModal(true)}
          >
            Add Corporate Action
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Security Name</th>
                <th>Action Type</th>
                <th>Value</th>
                <th>Ex-Date</th>
                <th>Record Date</th>
                <th>Payment Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {corporateActions.map((action, index) => (
                <tr key={index}>
                  <td>{action.security_name}</td>
                  <td>{action.action_type}</td>
                  <td>{formatValue(action.action_type, action.value)}</td>
                  <td>{formatDate(action.ex_date)}</td>
                  <td>{formatDate(action.record_date)}</td>
                  <td>{formatDate(action.payment_date)}</td>
                  <td>{action.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Add Corporate Action</h3>
              <div className="form-group">
                <label>Security Name:</label>
                <input
                  type="text"
                  value={newAction.security_name}
                  onChange={(e) => setNewAction({...newAction, security_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Action Type:</label>
                <select
                  value={newAction.action_type}
                  onChange={(e) => setNewAction({...newAction, action_type: e.target.value})}
                >
                  <option value="dividend">Dividend</option>
                  <option value="face_value">Face Value Change</option>
                  <option value="bonus">Bonus Shares</option>
                </select>
              </div>
              <div className="form-group">
                <label>Value:</label>
                <input
                  type="text"
                  value={newAction.value}
                  onChange={(e) => setNewAction({...newAction, value: e.target.value})}
                  placeholder={newAction.action_type === 'bonus' ? 'e.g., 1:1' : 'e.g., 10.00'}
                />
              </div>
              <div className="form-group">
                <label>Ex-Date:</label>
                <input
                  type="date"
                  value={newAction.ex_date}
                  onChange={(e) => setNewAction({...newAction, ex_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Record Date:</label>
                <input
                  type="date"
                  value={newAction.record_date}
                  onChange={(e) => setNewAction({...newAction, record_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Payment Date:</label>
                <input
                  type="date"
                  value={newAction.payment_date}
                  onChange={(e) => setNewAction({...newAction, payment_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={newAction.notes}
                  onChange={(e) => setNewAction({...newAction, notes: e.target.value})}
                />
              </div>
              <div className="modal-buttons">
                <button onClick={handleAddAction} className="save-button">Save</button>
                <button onClick={() => setShowAddModal(false)} className="cancel-button">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CorporateAction;