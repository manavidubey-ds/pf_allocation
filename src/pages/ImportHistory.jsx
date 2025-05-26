import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const ImportHistory = () => {
  const navigate = useNavigate();
  const [importHistory, setImportHistory] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchImportHistory();
  }, []);

  const fetchImportHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/import-history');
      const data = await response.json();
      setImportHistory(data);
    } catch (error) {
      console.error('Error fetching import history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadStatus('Processing file...');
    setIsLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const response = await fetch('http://localhost:5000/api/upload-import-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        throw new Error('Failed to upload import history');
      }

      setUploadStatus('Import history uploaded successfully');
      fetchImportHistory();
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="main-content">
        <h1>Import History</h1>

        <div className="upload-section">
          <h2>Upload New Import History</h2>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
          {uploadStatus && <p className={`status ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>{uploadStatus}</p>}
        </div>

        <div className="current-history">
          <h2>Current Import History</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : importHistory.length === 0 ? (
            <p>No import history available</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>File Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {importHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>{item.file_name}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportHistory;
