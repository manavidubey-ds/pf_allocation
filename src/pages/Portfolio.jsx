import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import userIcon from '../assets/usericon.png';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import LoadingIndicator from '../components/LoadingIndicator';

const Portfolio = () => {
  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' },
  ];

  const [portfolioStocks, setPortfolioStocks] = useState([]);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [fundAmount, setFundAmount] = useState(() => {
    const stored = localStorage.getItem('fundAmount');
    return stored ? Number(stored) : 100000000000;
  });

  const [newStock, setNewStock] = useState({
    stock_id: '',
    sector: '',
    is_active: true,
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchPortfolioData = async () => {
    try {
      const portfolioResponse = await fetch('http://localhost:5000/api/portfolio');
      if (!portfolioResponse.ok) {
        throw new Error('Failed to fetch portfolio');
      }
      const portfolioData = await portfolioResponse.json();
      setPortfolioStocks(portfolioData.portfolio || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading portfolio data:', err);
    }
  };

  const fetchAvailableStocks = async () => {
    try {
      const availableStocksResponse = await fetch('http://localhost:5000/api/securities');
      if (!availableStocksResponse.ok) {
        throw new Error('Failed to fetch available stocks');
      }
      const availableStocksData = await availableStocksResponse.json();
      setAvailableStocks(availableStocksData);
    } catch (err) {
      setError(err.message);
      console.error('Error loading available stocks:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchPortfolioData(), fetchAvailableStocks()]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleFundSave = async () => {
    try {
      localStorage.setItem('fundAmount', fundAmount.toString());
      setShowAddFundsModal(false);
      // Trigger a refresh of the portfolio data
      await fetchPortfolioData();
    } catch (error) {
      console.error('Error saving funds', error);
      setError('Failed to save funds. Please check your network and backend.');
    }
  };

  const handleAddStock = async () => {
    if (!newStock.stock_id || !newStock.sector) {
      setError('Please select a stock and a sector.');
      return;
    }

    const selectedStock = availableStocks.find((stock) => stock.id === parseInt(newStock.stock_id, 10));
    if (!selectedStock) {
      setError('Please select a valid stock from the available list.');
      return;
    }

    const isDuplicate = portfolioStocks.some(stock => stock.security_name === selectedStock.security_name);
    if (isDuplicate) {
      setError('This stock already exists in the portfolio.');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('http://localhost:5000/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock_id: parseInt(newStock.stock_id, 10),
          notes: newStock.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add stock');
      }

      const data = await response.json();
      if (data.message === 'Stock added to portfolio') {
        setNewStock({ stock_id: '', sector: '', is_active: true, notes: '' });
        setShowAddStockModal(false);
        await fetchPortfolioData();
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      setError('Failed to add stock. Please check your network and backend.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (stockId, newStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`http://localhost:5000/api/stocks/${stockId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newStatus ? 1 : 0 }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stock status');
      }

      setPortfolioStocks(prevStocks =>
        prevStocks.map(stock =>
          stock.portfolio_item_id === stockId
            ? { ...stock, is_active: newStatus }
            : stock
        )
      );
    } catch (error) {
      console.error('Error updating stock status:', error);
      setError('Failed to update stock status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <Sidebar />
        <main className="dashboard-container">
          <div className="loading-container">
            <LoadingIndicator />
            <p>Loading portfolio data...</p>
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
        <div className="portfolio-section">
          <div className="portfolio-header">
            <h2 className="dashboard-title">Stocks in Portfolio</h2>
            <div>
              <button 
                className="portfolio-btn add-funds" 
                onClick={() => setShowAddFundsModal(true)}
                disabled={isUpdating}
              >
                Add Funds
              </button>
              <button 
                className="portfolio-btn add-stock" 
                onClick={() => setShowAddStockModal(true)}
                disabled={isUpdating}
              >
                Add Stock
              </button>
            </div>
          </div>

          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Sector</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {portfolioStocks && portfolioStocks.map((stock) => (
                  <tr key={stock.portfolio_item_id}>
                    <td>{stock.security_name}</td>
                    <td>{stock.sector}</td>
                    <td>
                      <label className="status-toggle">
                        <input
                          type="checkbox"
                          checked={stock.is_active}
                          onChange={(e) => handleStatusChange(stock.portfolio_item_id, e.target.checked)}
                          disabled={isUpdating}
                        />
                        <span className={`status-indicator ${stock.is_active ? 'active' : 'inactive'}`}>
                          {stock.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </td>
                    <td>{stock.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showAddFundsModal && (
        <div className="modal-overlay" onClick={() => setShowAddFundsModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Add Funds</h3>
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Amount (₹)</span>
                <input
                  type="number"
                  className="form-input"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  disabled={isUpdating}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn primary" 
                onClick={handleFundSave}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="modal-btn secondary" 
                onClick={() => setShowAddFundsModal(false)}
                disabled={isUpdating}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddStockModal && (
        <div className="modal-overlay" onClick={() => setShowAddStockModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Stock</h3>
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Sector</span>
                <select
                  className="form-select"
                  value={newStock.sector}
                  onChange={(e) => setNewStock({ ...newStock, sector: e.target.value })}
                  disabled={isUpdating}
                >
                  <option value="">Select Sector</option>
                  <option value="Power">Power</option>
                  <option value="Banks">Banks</option>
                  <option value="IT">IT</option>
                </select>
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Stock Name</span>
                <select
                  className="form-select"
                  value={newStock.stock_id}
                  onChange={(e) => setNewStock({ ...newStock, stock_id: e.target.value })}
                  disabled={isUpdating}
                >
                  <option value="">Select Stock</option>
                  {availableStocks.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.security_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Notes</span>
                <input
                  type="text"
                  className="form-input"
                  value={newStock.notes}
                  onChange={(e) => setNewStock({ ...newStock, notes: e.target.value })}
                  placeholder="Enter notes"
                  disabled={isUpdating}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn primary" 
                onClick={handleAddStock}
                disabled={isUpdating}
              >
                {isUpdating ? 'Adding...' : 'Save'}
              </button>
              <button 
                className="modal-btn secondary" 
                onClick={() => setShowAddStockModal(false)}
                disabled={isUpdating}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;