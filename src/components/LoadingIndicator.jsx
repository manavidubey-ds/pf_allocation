import React from 'react';
import './LoadingIndicator.css';

function LoadingIndicator() {
  return (
    <div className="loading-container">
      <div className="loading-wrapper">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading...</div>
      </div>
    </div>
  );
}

export default LoadingIndicator;