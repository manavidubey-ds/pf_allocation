import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Sidebar from '../components/Sidebar';
import LoadingIndicator from '../components/LoadingIndicator';
// ... other imports ...

const CorporateActions = () => {
  const [open, setOpen] = useState(false);
  const [corporateActions, setCorporateActions] = useState([]);
  const [newAction, setNewAction] = useState({
    security_name: '',
    action_type: 'dividend',
    value: '',
    ex_date: '',
    record_date: '',
    payment_date: '',
    notes: '',
  });
  const [availableStocks, setAvailableStocks] = useState([]);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState(null);
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  useEffect(() => {
    fetchCorporateActions();
    fetchAvailableStocks();
    fetchPortfolioData();
  }, []);

  const fetchCorporateActions = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/corporate-actions');
      if (!response.ok) {
        throw new Error('Failed to fetch corporate actions');
      }
      const data = await response.json();
      console.log('Received corporate actions:', data);
      setCorporateActions(data);
    } catch (error) {
      console.error('Error fetching corporate actions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStocks = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/securities');
      if (!response.ok) {
        throw new Error('Failed to fetch available stocks');
      }
      const data = await response.json();
      setAvailableStocks(data);
    } catch (error) {
      console.error('Error fetching available stocks:', error);
      setError(error.message);
    }
  };

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/portfolio');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      const data = await response.json();
      setPortfolioData(data);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      setError(error.message);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5002/api/upload-corporate-actions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload corporate actions');
      }

      const result = await response.json();
      console.log('Upload result:', result);
      fetchCorporateActions(); // Refresh the table
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.message);
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
        notes: '',
      });
      fetchCorporateActions();
    } catch (error) {
      console.error('Error adding corporate action:', error);
      setError(error.message);
    }
  };

  const handleEditAction = async () => {
    try {
      const response = await fetch(`http://localhost:5002/api/corporate-actions/${selectedAction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedAction),
      });

      if (!response.ok) {
        throw new Error('Failed to update corporate action');
      }

      setShowEditModal(false);
      setSelectedAction(null);
      fetchCorporateActions();
    } catch (error) {
      console.error('Error updating corporate action:', error);
      setError(error.message);
    }
  };

  const handleDeleteAction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this corporate action?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5002/api/corporate-actions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete corporate action');
      }

      fetchCorporateActions();
    } catch (error) {
      console.error('Error deleting corporate action:', error);
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
    
    // Remove ₹ symbol and clean the value
    const cleanValue = value.replace('₹', '').trim();
    
    switch (actionType) {
      case 'dividend':
        const dividendValue = parseFloat(cleanValue);
        return isNaN(dividendValue) ? value : `₹${dividendValue.toFixed(2)}`;
      case 'Face Value Split':
        return value; // Keep as is for face value splits
      case 'Bonus Issue':
        return value; // Keep as is for bonus issues
      default:
        return value;
    }
  };

  const calculateImpact = (action) => {
    if (!action.analyst_shares || !action.analyst_shares > 0) return 'N/A';

    const shares = parseFloat(action.analyst_shares);
    const currentPrice = parseFloat(action.current_price) || 0;

    switch (action.action_type) {
      case 'dividend':
        // Extract numeric value from dividend string (e.g., "₹5.50 per share" -> 5.50)
        const dividendMatch = action.value.match(/₹?(\d+\.?\d*)/);
        if (!dividendMatch) return 'N/A';
        const dividendValue = parseFloat(dividendMatch[1]);
        if (isNaN(dividendValue)) return 'N/A';
        return `₹${(dividendValue * shares).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

      case 'Face Value Split':
        // Extract split ratio from string (e.g., "From ₹10 to ₹2" -> 2/10 = 0.2)
        const splitMatch = action.value.match(/From ₹(\d+) to ₹(\d+)/);
        if (!splitMatch) return 'N/A';
        const oldValue = parseFloat(splitMatch[1]);
        const newValue = parseFloat(splitMatch[2]);
        if (isNaN(oldValue) || isNaN(newValue) || oldValue === 0) return 'N/A';
        const splitRatio = newValue / oldValue;
        const newShares = Math.floor(shares * splitRatio);
        const newPrice = (currentPrice * oldValue) / newValue;
        return `${newShares.toLocaleString()} shares (₹${oldValue} → ₹${newValue}, Price: ₹${newPrice.toFixed(2)})`;

      case 'Bonus Issue':
        // Extract bonus ratio from string (e.g., "2:1" -> 2/1 = 2)
        const bonusMatch = action.value.match(/(\d+):(\d+)/);
        if (!bonusMatch) return 'N/A';
        const bonus = parseFloat(bonusMatch[1]);
        const base = parseFloat(bonusMatch[2]);
        if (isNaN(bonus) || isNaN(base) || base === 0) return 'N/A';
        const bonusRatio = bonus / base;
        const totalShares = shares + Math.floor(shares * bonusRatio);
        const adjustedPrice = (currentPrice * shares) / totalShares;
        return `+${Math.floor(shares * bonusRatio).toLocaleString()} shares (${bonus}:${base} bonus, Price: ₹${adjustedPrice.toFixed(2)})`;

      default:
        return 'N/A';
    }
  };

  // Calculate total cash from dividends
  const calculateTotalCash = () => {
    return corporateActions
      .filter(action => action.action_type === 'dividend')
      .reduce((total, action) => {
        // Extract numeric value from dividend string
        const dividendMatch = action.value.match(/₹?(\d+\.?\d*)/);
        if (!dividendMatch) return total;
        const dividendValue = parseFloat(dividendMatch[1]);
        if (isNaN(dividendValue)) return total;
        const shares = parseFloat(action.analyst_shares) || 0;
        return total + (dividendValue * shares);
      }, 0);
  };

  const totalCash = calculateTotalCash();

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
            <button onClick={fetchCorporateActions} className="retry-button">
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
          <div className="header-actions">
            <div className="file-upload">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                id="file-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload" className="upload-button">
                Upload Excel
              </label>
            </div>
            <button 
              className="add-button"
              onClick={() => setShowAddModal(true)}
            >
              Add Corporate Action
            </button>
          </div>
        </div>

        {/* Total Cash Card */}
        <div className="dashboard-card big-card" style={{ marginBottom: '20px' }}>
          <div className="big-card-row">
            <div className="big-card-label">Total Cash from Dividends (2025)</div>
            <div className="big-card-value">₹{totalCash.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          </div>
          <div className="big-card-row">
            <div className="big-card-label">Total Corporate Actions</div>
            <div className="big-card-value">{corporateActions.length}</div>
          </div>
          <div className="big-card-row">
            <div className="big-card-label">Dividend Actions</div>
            <div className="big-card-value">{corporateActions.filter(action => action.action_type === 'dividend').length}</div>
          </div>
        </div>

        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="actionTypeFilter">Filter by Action Type:</label>
            <select
              id="actionTypeFilter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Actions</option>
              <option value="dividend">Dividend</option>
              <option value="Face Value Split">Face Value Split</option>
              <option value="Bonus Issue">Bonus Issue</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table corporate-actions-table">
            <thead>
              <tr>
                <th>Security Name</th>
                <th>Action Type</th>
                <th>Amount/Value</th>
                <th>Ex-Date</th>
                <th>Record Date</th>
                <th>Payment Date</th>
                <th>Shares</th>
                <th>Impact</th>
              </tr>
            </thead>
            <tbody>
              {corporateActions
                .filter(action => filterType === 'all' || action.action_type === filterType)
                .map((action) => (
                <tr key={action.id}>
                  <td className="security-name">{action.security_name}</td>
                  <td className="action-type">{action.action_type}</td>
                  <td className="value">
                    {formatValue(action.action_type, action.value)}
                  </td>
                  <td className="date">{formatDate(action.ex_date)}</td>
                  <td className="date">{formatDate(action.record_date)}</td>
                  <td className="date">{formatDate(action.payment_date)}</td>
                  <td className="shares">{parseInt(action.analyst_shares || 0).toLocaleString()}</td>
                  <td className="impact">{calculateImpact(action)}</td>
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
                <select
                  value={newAction.security_name}
                  onChange={(e) => setNewAction({...newAction, security_name: e.target.value})}
                >
                  <option value="">Select a security</option>
                  {availableStocks.map((stock) => (
                    <option key={stock.security_name} value={stock.security_name}>
                      {stock.security_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Action Type:</label>
                <select
                  value={newAction.action_type}
                  onChange={(e) => setNewAction({...newAction, action_type: e.target.value})}
                >
                  <option value="dividend">Dividend</option>
                  <option value="Face Value Split">Face Value Split</option>
                  <option value="Bonus Issue">Bonus Issue</option>
                </select>
              </div>
              <div className="form-group">
                <label>Value:</label>
                <input
                  type="text"
                  value={newAction.value}
                  onChange={(e) => setNewAction({...newAction, value: e.target.value})}
                  placeholder={
                    newAction.action_type === 'Bonus Issue' ? 'e.g., 2:1' : 
                    newAction.action_type === 'Face Value Split' ? 'e.g., From ₹10 to ₹2' : 
                    'e.g., ₹5.50 per share'
                  }
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
              <div className="modal-buttons">
                <button onClick={handleAddAction} className="save-button">Save</button>
                <button onClick={() => setShowAddModal(false)} className="cancel-button">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedAction && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Edit Corporate Action</h3>
              <div className="form-group">
                <label>Security Name:</label>
                <select
                  value={selectedAction.security_name}
                  onChange={(e) => setSelectedAction({...selectedAction, security_name: e.target.value})}
                >
                  <option value="">Select a security</option>
                  {availableStocks.map((stock) => (
                    <option key={stock.security_name} value={stock.security_name}>
                      {stock.security_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Action Type:</label>
                <select
                  value={selectedAction.action_type}
                  onChange={(e) => setSelectedAction({...selectedAction, action_type: e.target.value})}
                >
                  <option value="dividend">Dividend</option>
                  <option value="Face Value Split">Face Value Split</option>
                  <option value="Bonus Issue">Bonus Issue</option>
                </select>
              </div>
              <div className="form-group">
                <label>Value:</label>
                <input
                  type="text"
                  value={selectedAction.value}
                  onChange={(e) => setSelectedAction({...selectedAction, value: e.target.value})}
                  placeholder={
                    selectedAction.action_type === 'Bonus Issue' ? 'e.g., 2:1' : 
                    selectedAction.action_type === 'Face Value Split' ? 'e.g., From ₹10 to ₹2' : 
                    'e.g., ₹5.50 per share'
                  }
                />
              </div>
              <div className="form-group">
                <label>Ex-Date:</label>
                <input
                  type="date"
                  value={selectedAction.ex_date}
                  onChange={(e) => setSelectedAction({...selectedAction, ex_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Record Date:</label>
                <input
                  type="date"
                  value={selectedAction.record_date}
                  onChange={(e) => setSelectedAction({...selectedAction, record_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Payment Date:</label>
                <input
                  type="date"
                  value={selectedAction.payment_date}
                  onChange={(e) => setSelectedAction({...selectedAction, payment_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={selectedAction.notes}
                  onChange={(e) => setSelectedAction({...selectedAction, notes: e.target.value})}
                />
              </div>
              <div className="modal-buttons">
                <button onClick={handleEditAction} className="save-button">Save</button>
                <button onClick={() => setShowEditModal(false)} className="cancel-button">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CorporateActions;

// Update the styles
const styles = `
  .corporate-actions-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
  }

  .corporate-actions-table th {
    background-color: #f8f9fa;
    color: #495057;
    font-weight: 600;
    text-align: left;
    padding: 1rem;
    border-bottom: 2px solid #dee2e6;
    white-space: nowrap;
  }

  .corporate-actions-table td {
    padding: 1rem;
    border-bottom: 1px solid #dee2e6;
    color: #212529;
  }

  .corporate-actions-table tr:hover {
    background-color: #f8f9fa;
  }

  .corporate-actions-table .security-name {
    font-weight: 500;
    color: #2c3e50;
  }

  .corporate-actions-table .action-type {
    text-transform: capitalize;
    color: #6c757d;
  }

  .corporate-actions-table .value {
    font-weight: 500;
    color: #28a745;
  }

  .corporate-actions-table .date {
    color: #6c757d;
    white-space: nowrap;
  }

  .corporate-actions-table .price {
    font-weight: 500;
    color: #2c3e50;
  }

  .corporate-actions-table .shares {
    text-align: right;
    font-family: monospace;
  }

  .corporate-actions-table .impact {
    color: #2c3e50;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .filters-container {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .filter-group label {
    font-weight: 500;
    color: #495057;
  }

  .filter-select {
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    background-color: white;
    color: #495057;
    font-size: 0.875rem;
    min-width: 200px;
    cursor: pointer;
  }

  .filter-select:focus {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .upload-button {
    background-color: #6c757d;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;
  }

  .upload-button:hover {
    background-color: #5a6268;
  }

  .add-button {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;
  }

  .add-button:hover {
    background-color: #218838;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    width: 100%;
    max-width: 500px;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #495057;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .modal-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .save-button,
  .cancel-button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  .save-button {
    background-color: #28a745;
    color: white;
  }

  .save-button:hover {
    background-color: #218838;
  }

  .cancel-button {
    background-color: #6c757d;
    color: white;
  }

  .cancel-button:hover {
    background-color: #5a6268;
  }
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);