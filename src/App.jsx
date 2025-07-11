import React from 'react';
import '@fontsource/roboto';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import List from './pages/List';
import PortfolioDetails from './pages/PortfolioDetails';
import Modify from './pages/Modify';
import Portfolio from './pages/Portfolio';
import ImportHistory from './pages/ImportHistory';
import IndexWeights from './pages/IndexWeights';
import CorporateActions from './pages/CorporateActions';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/list" element={<List />} />
        <Route path="/portfolio-details" element={<PortfolioDetails />} />
        <Route path="/modify" element={<Modify />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/import" element={<ImportHistory />} />
        <Route path="/weights" element={<IndexWeights />} />
        <Route path="/corporate-actions" element={<CorporateActions />} />
      </Routes>
    </Router>
  );
};

export default App;
