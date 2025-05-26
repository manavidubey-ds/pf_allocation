import React, { useEffect, useState, useReducer, useCallback } from 'react';
import './Dashboard.css';
import userIcon from '../assets/usericon.png';
import { Link, useLocation } from 'react-router-dom';
import LoadingIndicator from '../components/LoadingIndicator';

const CACHE_DURATION = 1 * 60 * 1000;

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
  const [outperformance, setOutperformance] = useState(0);

  useEffect(() => {
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
    const analystValue = calculatePortfolioValue();
    const indexValue = totalIndexPriceNew;
    const outperformanceValue = ((analystValue - indexValue) / indexValue) * 100;
    setOutperformance(outperformanceValue);
  }, [dashboardStocks, stockPrices, totalIndexPriceNew]);

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
      const [portfolioData, pricesData, modifyData] = await Promise.all([
        fetchWithCache(`http://localhost:5000/api/portfolio?fundAmount=${fundAmount}`, `portfolio_${fundAmount}`),
        fetchWithCache('http://localhost:5000/api/portfolio-prices', 'prices'),
        fetchWithCache('http://localhost:5000/api/latest-modify-data', 'modify_data')
      ]);

      const pricesObj = {};
      pricesData.forEach(item => {
        if (item.current_price !== undefined && item.current_price !== null) {
          pricesObj[item.stock_name] = {
            current_price: parseFloat(item.current_price)
          };
        }
      });

      const historicalPrices = {};
      modifyData.forEach(item => {
        historicalPrices[item.security_name] = {
          price: parseFloat(item.current_price) || null,
          analyst_shares: parseInt(item.analyst_shares) || 0,
          analyst_weight: parseFloat(item.analyst_weight) || 0,
          index_shares: parseInt(item.index_shares) || 0
        };
      });

      // Filter for active stocks and merge with latest modify data
      const activeStocks = portfolioData.portfolio.filter(stock => stock.is_active === 1);
      const mergedStocks = activeStocks.map(stock => {
        const latestModify = modifyData.find(m => m.security_name === stock.security_name);
        const historicalPrice = historicalPrices[stock.security_name];
        const currentPrice = pricesObj[stock.security_name]?.current_price;
        const indexShares = latestModify?.index_shares || 0;
        const oldPrice = historicalPrice?.price || currentPrice;

        return {
          ...stock,
          analyst_weight: latestModify?.analyst_weight || 0,
          analyst_shares: latestModify?.analyst_shares || 0,
          price_at_addition: oldPrice || 0,
          index_shares: indexShares,
          index_price_old: (oldPrice || 0) * indexShares,
          index_price_new: (currentPrice || 0) * indexShares,
        };
      });

      setDashboardStocks(mergedStocks);
      setStockPrices(pricesObj);
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

  const filteredStocks = dashboardStocks.filter(stock =>
    stock.sector.toLowerCase().includes(selectedSector.toLowerCase()) &&
    stock.security_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculatePortfolioValue = () => {
    return filteredStocks.reduce((total, stock) => {
      const priceInfo = stockPrices[stock.security_name];
      const currentPrice = priceInfo?.current_price;
      const analystShares = stock.analyst_shares || 0;

      if (currentPrice && currentPrice !== "N/A" && !isNaN(currentPrice)) {
        return total + (currentPrice * analystShares); // Corrected formula
      }
      return total;
    }, 0);
  };

  // Calculate total index weight updated
  const totalIndexWeightUpdated = filteredStocks.reduce((total, stock) => {
    const currentPrice = stockPrices[stock.security_name]?.current_price || 0;
    const indexShares = stock.index_shares || 0;
    const indexPriceUpdated = currentPrice * indexShares;
    return total + indexPriceUpdated;
  }, 0);

  const portfolioValue = calculatePortfolioValue();
  const fundAmount = Number(localStorage.getItem('fundAmount') || 100000000000);
  const gainPercentage = fundAmount > 0 ? ((portfolioValue - fundAmount) / fundAmount) * 100 : 0;
  const indexGainPercentage = fundAmount > 0 ? ((totalIndexWeightUpdated - fundAmount) / fundAmount) * 100 : 0;

  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' },
  ];

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
      <aside className="sidebar">
        <h2 className="sidebar-title">Model Portfolio Tracker</h2>

        <div className="dashboard-user-info sidebar-user-info">
          <div className="dashboard-user">
            <img src={userIcon} alt="User Icon" className="dashboard-user-icon" />
            <div className="user-text">
              <div className="user-name">DZ</div>
              <div className="user-email">help@dataeaze.com</div>
              <div className="user-email">Power Sector Analyst</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navPages.map((page) => (
            <Link
              key={page.name}
              to={page.route}
              className={location.pathname === page.route ? 'active' : ''}
            >
              {page.name}
            </Link>
          ))}
        </nav>
      </aside>

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
                const priceInfo = stockPrices[stock.security_name];
                const currentPrice = priceInfo?.current_price;
                const indexShares = stock.index_shares || 0;
                const analystShares = stock.analyst_shares || 0;
                const indexPriceNew = currentPrice && currentPrice !== "N/A" && !isNaN(currentPrice) ? (currentPrice * indexShares) : 0;
                const analystValueCurrent = currentPrice && currentPrice !== "N/A" && !isNaN(currentPrice) ? (currentPrice * analystShares) : 0;
                const indexWeight = parseFloat(stock.index_weight) || 0;
                
                const totalIndexPriceUpdated = filteredStocks.reduce((sum, s) => {
                  const price = stockPrices[s.security_name]?.current_price;
                  const shares = s.index_shares || 0;
                  return sum + (price && price !== "N/A" && !isNaN(price) ? (price * shares) : 0);
                }, 0);

                const updatedIndexWeight = totalIndexPriceUpdated > 0 ? 
                  (indexPriceNew / totalIndexPriceUpdated) * totals.indexWeight : 0;

                // Calculate total analyst price updated
                const totalAnalystPriceUpdated = filteredStocks.reduce((sum, s) => {
                  const price = stockPrices[s.security_name]?.current_price;
                  const shares = s.analyst_shares || 0;
                  return sum + (price && price !== "N/A" && !isNaN(price) ? (price * shares) : 0);
                }, 0);

                // Calculate analyst weight using the formula
                const analystWeight = totalAnalystPriceUpdated > 0 ? 
                  ((analystValueCurrent / totalAnalystPriceUpdated) * totals.indexWeight).toFixed(4) : '0.0000';

                return (
                  <tr key={stock.security_name}>
                    <td>{stock.security_name}</td>
                    <td>₹{currentPrice ? currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : 'N/A'}</td>
                    <td>{updatedIndexWeight.toFixed(2)}%</td>
                    <td>{analystWeight}%</td>
                    <td>{calculateStance(stock.analyst_weight, indexWeight)}</td>
                    <td>{Math.round(analystShares).toLocaleString('en-IN')}</td>
                    <td>₹{analystValueCurrent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td>Total</td>
                <td></td>
                <td>{filteredStocks.reduce((sum, stock) => {
                  const priceInfo = stockPrices[stock.security_name];
                  const currentPrice = priceInfo?.current_price;
                  const indexShares = stock.index_shares || 0;
                  const indexPriceNew = currentPrice && currentPrice !== "N/A" && !isNaN(currentPrice) ? (currentPrice * indexShares) : 0;
                  const totalIndexPriceUpdated = filteredStocks.reduce((total, s) => {
                    const price = stockPrices[s.security_name]?.current_price;
                    const shares = s.index_shares || 0;
                    return total + (price && price !== "N/A" && !isNaN(price) ? (price * shares) : 0);
                  }, 0);
                  const updatedIndexWeight = totalIndexPriceUpdated > 0 ? 
                    (indexPriceNew / totalIndexPriceUpdated) * totals.indexWeight : 0;
                  return sum + updatedIndexWeight;
                }, 0).toFixed(2)}%</td>
                <td>{totals.indexWeight.toFixed(4)}%</td>
                <td></td>
                <td></td>
                <td>₹{formatNumberWithCommas(filteredStocks.reduce((sum, stock) => {
                  const priceInfo = stockPrices[stock.security_name];
                  const currentPrice = priceInfo?.current_price;
                  const analystShares = stock.analyst_shares || 0;
                  return sum + (currentPrice && currentPrice !== "N/A" && !isNaN(currentPrice) ? (currentPrice * analystShares) : 0);
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