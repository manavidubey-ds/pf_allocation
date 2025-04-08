import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import List from './pages/List';
import PortfolioDetails from './pages/PortfolioDetails'; // Import existing component
import Modify from './pages/Modify'; // ✅ Import new Modify component

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/list" element={<List />} />
        <Route path="/portfolio-details" element={<PortfolioDetails />} />
        <Route path="/modify" element={<Modify />} /> {/* ✅ New Modify Route */}
      </Routes>
    </Router>
  );
};

export default App;
