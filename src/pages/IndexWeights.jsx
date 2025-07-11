import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const IndexWeights = () => {
  const navigate = useNavigate();
  const [indexWeights, setIndexWeights] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [excelData, setExcelData] = useState(null);

  useEffect(() => {
    fetchIndexWeights();
  }, []);

  const fetchIndexWeights = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/index-weights');
      if (!response.ok) {
        throw new Error('Failed to fetch index weights');
      }
      const data = await response.json();
      console.log('Received index weights:', data);
      setIndexWeights(data);
    } catch (error) {
      console.error('Error fetching index weights:', error);
      setUploadStatus(`Error: ${error.message}`);
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
      
      setExcelData(jsonData);
      setUploadStatus('File processed successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="main-content">
        <h1>Index Weights</h1>

        <div className="upload-section">
          <h2>Upload Index Weights</h2>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
          {uploadStatus && <p className={`status ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>{uploadStatus}</p>}
        </div>

        <div className="current-weights">
          <h2>Current Index Weights</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : excelData ? (
            <table className="weights-table">
              <thead>
                <tr>
                  {Object.keys(excelData[0] || {}).map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelData.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : indexWeights.length === 0 ? (
            <p>No index weights available</p>
          ) : (
            <table className="weights-table">
              <thead>
                <tr>
                  <th>Stock Name</th>
                  <th>Index Weight</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {indexWeights.map((item) => (
                  <tr key={item.security_name}>
                    <td>{item.security_name}</td>
                    <td>{parseFloat(item.index_weight).toFixed(2)}%</td>
                    <td>{new Date(item.last_updated).toLocaleString()}</td>
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

export default IndexWeights;
