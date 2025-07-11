import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import userIcon from '../assets/usericon.png';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function List() {
  const [historyData, setHistoryData] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' },
    { name: 'Corporate Actions', route: '/corporate-actions' }
  ];

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/modify-history-list');
      if (!response.ok) {
        throw new Error('Failed to fetch history data');
      }
      const data = await response.json();
      setHistoryData(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleViewDetails = async (timestamp) => {
    try {
      const response = await fetch(`http://localhost:5002/api/modify-history-details/${timestamp}`);
      if (!response.ok) {
        throw new Error('Failed to fetch history details');
      }
      const data = await response.json();
      
      // Calculate total current value and old value for all stocks
      const totalCurrentValue = data.details.reduce((sum, detail) => {
        const currentPrice = parseFloat(detail.current_price) || 0;
        const shares = parseInt(detail.analyst_shares) || 0;
        return sum + (currentPrice * shares);
      }, 0);

      const totalOldValue = data.details.reduce((sum, detail) => {
        const oldPrice = parseFloat(detail.price_at_addition) || 0;
        const shares = parseInt(detail.analyst_shares) || 0;
        return sum + (oldPrice * shares);
      }, 0);

      // Calculate gain/loss percentage
      const gain = totalOldValue > 0 ? 
        ((totalCurrentValue - totalOldValue) / totalOldValue) * 100 : 0;

      // Update the history data with the calculated gain
      setHistoryData(prevData => 
        prevData.map(item => 
          item.timestamp === timestamp 
            ? { ...item, gain: gain.toFixed(2) }
            : item
        )
      );

      setSelectedHistory(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching history details:', error);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calculateGain = (oldValue, newValue) => {
    if (!oldValue || !newValue || oldValue === 0) return 'No change';
    const gain = ((newValue - oldValue) / oldValue) * 100;
    return gain.toFixed(2) + '%';
  };

  const formatNumber = (value) => {
    if (value === undefined || value === null || value === "N/A") {
      return "N/A";
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return "N/A";
    }
    return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || value === "N/A") {
      return "N/A";
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return "N/A";
    }
    return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <main className="dashboard-container">
        <div className="dashboard-header">
          <h1>Modify History</h1>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Securities</th>
                <th>Total Value</th>
                <th>Number of Securities</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((item, index) => (
                <tr key={index}>
                  <td>{formatDateTime(item.timestamp)}</td>
                  <td>{item.securities}</td>
                  <td>₹{formatNumber(item.total_value)}</td>
                  <td>{item.num_securities}</td>
                  <td>{item.notes || '-'}</td>
                  <td>
                    <button 
                      className="view-details-btn"
                      onClick={() => handleViewDetails(item.timestamp)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && selectedHistory && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content history-detail" onClick={e => e.stopPropagation()}>
              <h2>Modify Details - {formatDateTime(selectedHistory.timestamp)}</h2>
              <div className="history-detail-table-container">
                <table className="history-detail-table">
                  <thead>
                    <tr>
                      <th>Security Name</th>
                      <th>Sector</th>
                      <th>Current Price</th>
                      <th>Index Weight</th>
                      <th>Index Shares</th>
                      <th>Index Price</th>
                      <th>Analyst Weight</th>
                      <th>Analyst Shares</th>
                      <th>Analyst Price</th>
                      <th>Stance</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedHistory.details.map((detail, index) => (
                      <tr key={index}>
                        <td>{detail.security_name}</td>
                        <td>{detail.sector}</td>
                        <td>₹{formatNumber(detail.current_price)}</td>
                        <td>{formatNumber(detail.index_weight)}%</td>
                        <td>{formatNumber(detail.index_shares)}</td>
                        <td>₹{formatNumber(detail.index_price)}</td>
                        <td>{formatNumber(detail.analyst_weight)}%</td>
                        <td>{formatNumber(detail.analyst_shares)}</td>
                        <td>₹{formatNumber(detail.analyst_price)}</td>
                        <td>{detail.analyst_stance}</td>
                        <td>{detail.notes || '-'}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan="3"><strong>Total</strong></td>
                      <td>
                        {formatNumber(selectedHistory.details.reduce((sum, detail) => 
                          sum + (parseFloat(detail.index_weight) || 0), 0))}%
                      </td>
                      <td>
                        {formatNumber(selectedHistory.details.reduce((sum, detail) => 
                          sum + (parseInt(detail.index_shares) || 0), 0))}
                      </td>
                      <td>
                        {formatCurrency(selectedHistory.details.reduce((sum, detail) => 
                          sum + (parseFloat(detail.index_price) || 0), 0))}
                      </td>
                      <td>
                        {formatNumber(selectedHistory.details.reduce((sum, detail) => 
                          sum + (parseFloat(detail.analyst_weight) || 0), 0))}%
                      </td>
                      <td>
                        {formatNumber(selectedHistory.details.reduce((sum, detail) => 
                          sum + (parseInt(detail.analyst_shares) || 0), 0))}
                      </td>
                      <td>
                        {formatCurrency(selectedHistory.details.reduce((sum, detail) => 
                          sum + (parseFloat(detail.analyst_price) || 0), 0))}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default List;
