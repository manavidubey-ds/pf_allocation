import React, { useEffect, useState, useReducer, useCallback } from 'react';
import './Dashboard.css';
import userIcon from '../assets/usericon.png';
import { Link, useLocation } from 'react-router-dom';
import LoadingIndicator from '../components/LoadingIndicator';
import Sidebar from '../components/Sidebar';

const CACHE_DURATION = 10 * 1000;

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const username = 'DZ';
  const [selectedSector, setSelectedSector] = useState('Power');
  const [dashboardStocks, setDashboardStocks] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [totalIndexPriceNew, setTotalIndexPriceNew] = useState(0);
  const [totalIndexPriceOld, setTotalIndexPriceOld] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const location = useLocation();
  const [totals, setTotals] = useState({
    indexWeight: 0,
    analystWeight: 0,
    indexPrice: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear cache and refresh data when component mounts or when data might have changed
  useEffect(() => {
    // Clear any cached data to ensure fresh data is fetched
    const fundAmount = localStorage.getItem('fundAmount') || 100000000000;
    sessionStorage.removeItem(`portfolio_${fundAmount}`);
    sessionStorage.removeItem('prices');
    
    // Force fresh data fetch
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const total = dashboardStocks.reduce((sum, stock) => {
      const priceInfo = stockPrices[stock.security_name];
      const currentPrice = priceInfo?.current_price;
      const indexShares = stock.index_shares || 0;

      if (currentPrice && !isNaN(currentPrice)) {
        return sum + currentPrice * indexShares;
      }
      return sum;
    }, 0);

    setTotalIndexPriceNew(total);
  }, [dashboardStocks, stockPrices]);

  useEffect(() => {
    const newTotals = {
      indexWeight: dashboardStocks.reduce((sum, stock) =>
        sum + (parseFloat(stock.index_weight) || 0), 0),
      analystWeight: dashboardStocks.reduce((sum, stock) =>
        sum + (parseFloat(stock.analyst_weight) || 0), 0),
      indexPrice: dashboardStocks.reduce((sum, stock) =>
        sum + (parseFloat(stock.index_price) || 0), 0)
    };
    setTotals(newTotals);
  }, [dashboardStocks]);

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const fundAmount = localStorage.getItem('fundAmount') || 100000000000;

      // Helper function to fetch with cache
      const fetchWithCache = async (url, cacheKey) => {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          const { timestamp, data } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            return data;
          }
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        sessionStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data
        }));
        
        return data;
      };

      // Fetch all data in parallel with caching
      const [portfolioData, pricesData] = await Promise.all([
        fetchWithCache(`http://localhost:5002/api/portfolio?fundAmount=${fundAmount}`, `portfolio_${fundAmount}`),
        fetchWithCache('http://localhost:5002/api/portfolio-prices', 'prices')
      ]);

      // Use portfolio data directly since it already contains all the information with current prices
      const activeStocks = (portfolioData || []).filter(stock => stock.is_active === 1);
      
      // Process the stocks to ensure all values are properly parsed
      const processedStocks = activeStocks.map(stock => {
        const currentPrice = parseFloat(stock.current_price) || 0;
        const analystShares = parseInt(stock.analyst_shares) || 0;
        const indexShares = parseInt(stock.index_shares) || 0;
        
        return {
          ...stock,
          current_price: currentPrice,
          index_weight: parseFloat(stock.index_weight) || 0,
          analyst_weight: parseFloat(stock.analyst_weight) || 0,
          index_shares: indexShares,
          analyst_shares: analystShares,
          index_price: parseFloat(stock.index_price) || 0,
          analyst_price: parseFloat(stock.analyst_price) || 0,
          value: currentPrice * analystShares
        };
      });

      console.log('Portfolio data with current prices:', processedStocks);
      console.log('Sample stock with current price:', processedStocks[0]);

      setDashboardStocks(processedStocks);
      setStockPrices({}); // Not needed since we're using portfolio data directly
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumberWithCommas = (num) =>
    new Intl.NumberFormat().format(Number(num).toFixed(2));

  const filteredStocks = (dashboardStocks || []).filter(stock =>
    (stock.sector?.toLowerCase() || 'Power').includes(selectedSector.toLowerCase()) &&
    stock.security_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculatePortfolioValue = () => {
    return filteredStocks.reduce((total, stock) => {
      const currentPrice = stock.current_price || 0;
      const analystShares = stock.analyst_shares || 0;

      if (currentPrice && currentPrice !== "N/A" && !isNaN(currentPrice)) {
        return total + (currentPrice * analystShares);
      }
      return total;
    }, 0);
  };

  // Calculate total index weight updated
  const totalIndexWeightUpdated = filteredStocks.reduce((total, stock) => {
    const currentPrice = stock.current_price || 0;
    const indexShares = stock.index_shares || 0;
    const indexPriceUpdated = currentPrice * indexShares;
    return total + indexPriceUpdated;
  }, 0);

  const portfolioValue = calculatePortfolioValue();
  const fundAmount = Number(localStorage.getItem('fundAmount') || 100000000000);
  const gainPercentage = fundAmount > 0 ? ((portfolioValue - fundAmount) / fundAmount) * 100 : 0;
  const indexGainPercentage = fundAmount > 0 ? ((totalIndexWeightUpdated - fundAmount) / fundAmount) * 100 : 0;
  
  // Outperformance = Analyst Gain - Index Gain
  const outperformance = gainPercentage - indexGainPercentage;

  const formatCurrency = (value) => {
    if (value === undefined || value === null || value === "N/A") {
      return "N/A";
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return "N/A";
    }
    return `₹${num.toFixed(2)}`;
  };

  const formatAnalystShares = (shares) => {
    if (shares === null || shares === undefined) {
      return 'N/A';
    }
    return Math.round(shares).toLocaleString('en-IN');
  };

  const calculateStance = (analystWeight, indexWeight) => {
    if (analystWeight === undefined || analystWeight === null ||
      indexWeight === undefined || indexWeight === null ||
      indexWeight === 0) {
      return "N/A";
    }
    const ratio = analystWeight / indexWeight;
    if (ratio <= 0.8) {
      return "UW";
    } else if (ratio >= 1.5) {
      return "OW";
    } else {
      return "EW";
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <main className="dashboard-container">

        <div className="dashboard-header-wrapper">
          <div className="dashboard-header-left">
            <div className="welcome-message">
              <p className="dashboard-subtitle-1">{getGreeting()}, {username}!</p>
              <p className="dashboard-subtitle-2"> Welcome to your Portfolio Dashboard</p>
              <div className="performance-summary">
                <p className="dashboard-gain">
                  Your portfolio is <span className={outperformance >= 0 ? 'text-green' : 'text-red'}>
                    {outperformance >= 0 ? 'outperforming' : 'underperforming'} by {Math.abs(outperformance).toFixed(2)}%
                  </span> compared to the index
                </p>
              </div>
            </div>
          </div>

          <div className="dashboard-card big-card">
            <div className="big-card-row">
              <div className="big-card-label">Analyst Portfolio Amount</div>
              <div className="big-card-value">₹{formatNumberWithCommas(portfolioValue/10000000)}Cr</div>
            </div>
            <div className="big-card-row">
              <div className="big-card-label">Index Portfolio Amount</div>
              <div className="big-card-value">₹{formatNumberWithCommas(totalIndexWeightUpdated/10000000)}Cr</div>
            </div>
            <div className="big-card-row">
              <div className="big-card-label">Analyst Gain %</div>
              <div className={gainPercentage >= 0 ? 'big-card-value text-green' : 'big-card-value text-red'}>
                {gainPercentage.toFixed(2)}%
              </div>
            </div>
            <div className="big-card-row">
              <div className="big-card-label">Index Gain %</div>
              <div className={indexGainPercentage >= 0 ? 'big-card-value text-green' : 'big-card-value text-red'}>
                {indexGainPercentage.toFixed(2)}%
              </div>
            </div>
            <div className="big-card-row pndl-date-row">
              <div className="pnl-info">
                {lastUpdated && <div className="last-updated">Last updated: {lastUpdated.toLocaleString()}</div>}
                <div className="big-card-value">
                </div>
              </div>
              <div className="date-info">
                <div className="big-card-label">As of</div>
                <input
                  type="date"
                  className="dashboard-date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
            <div className="big-card-row">
              <div className="big-card-label">Outperformance vs Index</div>
              <div className={outperformance >= 0 ? 'big-card-value text-green' : 'big-card-value text-red'}>
                {outperformance.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Current Price</th>
                <th>Index Weight (Updated)</th>
                <th>Analyst Weight (Updated)</th>
                <th>Stance</th>
                <th>Analyst Shares</th>
                <th>Analyst Price (Updated)</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => {
                const currentPrice = stock.current_price || 0;
                const indexShares = stock.index_shares || 0;
                const analystShares = stock.analyst_shares || 0;
                const indexPriceNew = currentPrice * indexShares;
                const analystValueCurrent = currentPrice * analystShares;
                const indexWeight = stock.index_weight || 0;
                const analystWeight = stock.analyst_weight || 0;
                
                const totalIndexPriceUpdated = filteredStocks.reduce((sum, s) => {
                  const price = s.current_price || 0;
                  const shares = s.index_shares || 0;
                  return sum + (price * shares);
                }, 0);

                const updatedIndexWeight = totalIndexPriceUpdated > 0 ? 
                  (indexPriceNew / totalIndexPriceUpdated) * totals.indexWeight : 0;

                // Calculate total analyst price updated
                const totalAnalystPriceUpdated = filteredStocks.reduce((sum, s) => {
                  const price = s.current_price || 0;
                  const shares = s.analyst_shares || 0;
                  return sum + (price * shares);
                }, 0);

                // Calculate analyst weight using the formula
                const updatedAnalystWeight = totalAnalystPriceUpdated > 0 ? 
                  ((analystValueCurrent / totalAnalystPriceUpdated) * totals.indexWeight).toFixed(4) : '0.0000';

                return (
                  <tr key={stock.security_name}>
                    <td>{stock.security_name}</td>
                    <td>₹{currentPrice ? currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : 'N/A'}</td>
                    <td>{updatedIndexWeight.toFixed(2)}%</td>
                    <td>{updatedAnalystWeight}%</td>
                    <td>{calculateStance(analystWeight, indexWeight)}</td>
                    <td>{Math.round(analystShares).toLocaleString('en-IN')}</td>
                    <td>₹{analystValueCurrent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td>Total</td>
                <td></td>
                <td>{filteredStocks.reduce((sum, stock) => {
                  const currentPrice = stock.current_price || 0;
                  const indexShares = stock.index_shares || 0;
                  const indexPriceNew = currentPrice * indexShares;
                  const totalIndexPriceUpdated = filteredStocks.reduce((total, s) => {
                    const price = s.current_price || 0;
                    const shares = s.index_shares || 0;
                    return total + (price * shares);
                  }, 0);
                  const updatedIndexWeight = totalIndexPriceUpdated > 0 ? 
                    (indexPriceNew / totalIndexPriceUpdated) * totals.indexWeight : 0;
                  return sum + updatedIndexWeight;
                }, 0).toFixed(2)}%</td>
                <td>{totals.indexWeight.toFixed(4)}%</td>
                <td></td>
                <td></td>
                <td>₹{formatNumberWithCommas(filteredStocks.reduce((sum, stock) => {
                  const currentPrice = stock.current_price || 0;
                  const analystShares = stock.analyst_shares || 0;
                  return sum + (currentPrice * analystShares);
                }, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;