import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import userIcon from '../assets/usericon.png';
import { Link, useNavigate } from 'react-router-dom';
import LoadingIndicator from '../components/LoadingIndicator';
import Sidebar from '../components/Sidebar';

const Modify = () => {
  const navigate = useNavigate();
  const totalValue = 10000 * 1e7; // ₹10,000 Cr
  const [portfolioStocks, setPortfolioStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notesData, setNotesData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [noteModal, setNoteModal] = useState({ visible: false, index: null, value: "" });
  const [stockPrices, setStockPrices] = useState({});
  const [allStocks, setAllStocks] = useState([]);
  const [editingStock, setEditingStock] = useState(null);
  const [totals, setTotals] = useState({
    indexWeight: 0,
    analystWeight: 0,
    shares: 0,
    indexPrice: 0,
  });
  const [totalAnalystPrice, setTotalAnalystPrice] = useState(0);
  const [lastModified, setLastModified] = useState(null);

  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' },
    { name: 'Corporate Actions', route: '/corporate-actions' }
  ];

  const calculateStance = (analystWeight, indexWeight) => {
    const aw = parseFloat(analystWeight);
    const iw = parseFloat(indexWeight);
    if (aw > iw) return "Over Weight";
    else if (aw < iw) return "Under Weight";
    else return "Equal Weight";
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fundAmount = localStorage.getItem('fundAmount') || 100000000000;

      // Fetch fresh data directly
      const [portfolioRes, pricesRes, modifyHistoryRes] = await Promise.all([
        fetch(`http://localhost:5002/api/portfolio?fundAmount=${fundAmount}`),
        fetch('http://localhost:5002/api/portfolio-prices'),
        fetch('http://localhost:5002/api/latest-modify-data')
      ]);

      if (!portfolioRes.ok) throw new Error('Failed to fetch portfolio');
      if (!pricesRes.ok) throw new Error('Failed to fetch prices');
      if (!modifyHistoryRes.ok) throw new Error('Failed to fetch modify data');

      const portfolioData = await portfolioRes.json();
      const pricesData = await pricesRes.json();
      const modifyHistoryData = await modifyHistoryRes.json();

      const pricesObj = {};
      const latestModifyData = {};
      const activeStocks = [];
      let totalIndexWeight = 0;

      // Process portfolio data
      portfolioData.forEach(stock => {
        if (stock.is_active) {
          totalIndexWeight += parseFloat(stock.index_weight) || 0;
        }
      });

      // Process prices data
      pricesData.forEach(item => {
        pricesObj[item.security_name] = item;
      });

      // Process modify history data
      modifyHistoryData.forEach(item => {
        if (!latestModifyData[item.security_name] || 
            new Date(item.date_added) > new Date(latestModifyData[item.security_name].date_added)) {
          latestModifyData[item.security_name] = item;
        }
      });

      // Process active stocks
      portfolioData
        .filter(stock => stock.is_active)
        .forEach(stock => {
          const indexWeight = parseFloat(stock.index_weight) || 0;
          const indexPrice = totalIndexWeight > 0 ? (indexWeight / totalIndexWeight) * fundAmount : 0;
          const currentPrice = pricesObj[stock.security_name]?.current_price || 0;
          const indexShares = currentPrice > 0 ? Math.floor(indexPrice / currentPrice) : 0;
          const latestData = latestModifyData[stock.security_name];

          const analystShares = latestData?.analyst_shares || 0;
          const analystPriceUpdated = currentPrice * analystShares;

          activeStocks.push({
            ...stock,
            analyst_weight: latestData?.analyst_weight || 0,
            shares: latestData?.analyst_shares || 0,
            index_price: indexPrice,
            index_shares: indexShares,
            last_saved_analyst_weight: latestData?.analyst_weight || 0,
            last_saved_analyst_shares: latestData?.analyst_shares || 0,
            stance: calculateStance(
              latestData?.analyst_weight || 0, 
              stock.index_weight
            ),
            notes: latestData?.notes || ".....",
            analyst_price: analystPriceUpdated,
            analyst_price_per_share: analystPriceUpdated
          });
        });

      setStockPrices(pricesObj);
      setPortfolioStocks(activeStocks);
      setAllStocks(pricesData);
      setNotesData(activeStocks.map(row => row.notes || "....."));
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for portfolio changes
  const checkPortfolioChanges = useCallback(async () => {
    try {
      const fundAmount = localStorage.getItem('fundAmount') || 100000000000;
      const response = await fetch(`http://localhost:5002/api/portfolio?fundAmount=${fundAmount}`);
      
      if (!response.ok) throw new Error('Failed to check portfolio changes');
      
      const data = await response.json();
      const currentActiveStocks = data.portfolio.filter(stock => stock.is_active).map(stock => stock.portfolio_item_id);
      const displayedActiveStocks = portfolioStocks.map(stock => stock.portfolio_item_id);
      
      // If there's a difference in active stocks, refresh the data
      if (JSON.stringify(currentActiveStocks.sort()) !== JSON.stringify(displayedActiveStocks.sort())) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error checking portfolio changes:', error);
    }
  }, [portfolioStocks, fetchData]);

  // Check for changes every 1 second
  useEffect(() => {
    const interval = setInterval(checkPortfolioChanges, 20000); // Changed from 5000 to 1000
    return () => clearInterval(interval);
  }, [checkPortfolioChanges]);

  // Add event listener for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'portfolioUpdated') {
        fetchData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchData]);

  // Add event listener for custom event
  useEffect(() => {
    const handlePortfolioUpdate = () => {
      fetchData();
    };

    window.addEventListener('portfolioUpdated', handlePortfolioUpdate);
    return () => window.removeEventListener('portfolioUpdated', handlePortfolioUpdate);
  }, [fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recalculate totals whenever portfolioStocks changes
  useEffect(() => {
    // Step 1: Calculate intermediate totals
    const newTotals = {
      indexWeight: portfolioStocks.reduce((sum, stock) =>
        sum + (parseFloat(stock.index_weight) || 0), 0),
      analystWeight: portfolioStocks.reduce((sum, stock) =>
        sum + (parseFloat(stock.analyst_weight) || 0), 0),
      shares: portfolioStocks.reduce((sum, stock) =>
        // Ensure stock.shares is parsed as a number
        sum + (parseInt(stock.shares || 0, 10) || 0), 0),
      indexPrice: portfolioStocks.reduce((sum, stock) =>
        sum + (parseFloat(stock.index_price) || 0), 0),
    };

    setTotals(newTotals);

    // Step 2: Calculate newTotalAnalystPrice based on weights and totalValue
    const newTotalAnalystPrice = portfolioStocks.reduce((sum, stock) => {
      const currentPrice = parseFloat(stockPrices[stock.security_name]?.current_price) || 0;
      return sum + (currentPrice * (parseInt(stock.shares || 0, 10) || 0));
    }, 0);

    setTotalAnalystPrice(newTotalAnalystPrice);
  }, [portfolioStocks, totalValue, stockPrices]);

  const handleEdit = (stock) => {
    setEditingStock(stock);
  };

  const handleInputChange = (stockId, field, value) => {
    setPortfolioStocks(prevStocks =>
      prevStocks.map(stock =>
        stock.portfolio_item_id === stockId
          ? { ...stock, [field]: parseFloat(value) || 0 }
          : stock
      )
    );
  };

  const handleSaveChanges = async (stock) => {
    try {
      const response = await fetch(`http://localhost:5002/api/stocks/${stock.portfolio_item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analyst_weight: stock.analyst_weight,
          shares: stock.shares
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stock');
      }

      // Fetch fresh data immediately after changes
      await fetchData();
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock. Please try again.');
    }
  };

  const handleWeightChange = (index, value) => {
    const updatedPortfolio = [...portfolioStocks];
    const newWeight = parseFloat(value) || 0;
    
    // Calculate total index weight
    const totalIndexWeight = updatedPortfolio.reduce((sum, stock) =>
      sum + (parseFloat(stock.index_weight) || 0), 0);
  
    // Calculate current total analyst weight excluding the stock being updated
    const currentTotalAnalystWeight = updatedPortfolio.reduce((sum, stock, idx) => {
      if (idx === index) return sum;
      return sum + (parseFloat(stock.analyst_weight) || 0);
    }, 0);

    // Check if new total would exceed index weight
    if (currentTotalAnalystWeight + newWeight > totalIndexWeight) {
      alert('Total analyst weight cannot exceed total index weight');
      return;
    }
    
    // Get current price for the stock
    const currentPrice = stockPrices[updatedPortfolio[index].security_name]?.current_price || 0;
  
    // Calculate analyst price based on weight
    // Formula: (newWeight / 100) * totalInvestmentValue
    const totalInvestmentValue = 100000000000; // ₹10,000 Cr
    const analystPrice = (newWeight / 100) * totalInvestmentValue;
    
    // Calculate shares based on analyst price and current price
    const analystShares = currentPrice > 0 ? Math.floor(analystPrice / currentPrice) : 0;
    
    // Update all related fields
    updatedPortfolio[index] = {
      ...updatedPortfolio[index],
      analyst_weight: newWeight,
      shares: analystShares,
      analyst_price: analystPrice,
      analyst_price_per_share: currentPrice,
      stance: calculateStance(newWeight, updatedPortfolio[index].index_weight)
    };
    
    setPortfolioStocks(updatedPortfolio);
  };
  
  const handleCalculatedWeightChange = (index, value) => {
    const updatedPortfolio = [...portfolioStocks];
    const newWeight = parseFloat(value) || 0;
    
    // Calculate total index weight
    const totalIndexWeight = updatedPortfolio.reduce((sum, stock) =>
      sum + (parseFloat(stock.index_weight) || 0), 0);
  
    // Calculate current total analyst weight excluding the stock being updated
    const currentTotalAnalystWeight = updatedPortfolio.reduce((sum, stock, idx) => {
      if (idx === index) return sum;
      return sum + (parseFloat(stock.analyst_weight) || 0);
    }, 0);

    // Check if new total would exceed index weight
    if (currentTotalAnalystWeight + newWeight > totalIndexWeight) {
      alert('Total analyst weight cannot exceed total index weight');
      return;
    }
  
    // Get current price for the stock
    const currentPrice = stockPrices[updatedPortfolio[index].security_name]?.current_price || 0;
  
    // Calculate analyst price based on weight
    // Formula: (newWeight / 100) * totalInvestmentValue
    const totalInvestmentValue = 100000000000; // ₹10,000 Cr
    const analystPrice = (newWeight / 100) * totalInvestmentValue;
    
    // Calculate shares based on analyst price and current price
    const newShares = currentPrice > 0 ? Math.floor(analystPrice / currentPrice) : 0;

    // Update the stock with new values
    updatedPortfolio[index] = {
      ...updatedPortfolio[index],
      analyst_weight: newWeight,
      shares: newShares,
      analyst_price: analystPrice,
      analyst_price_per_share: currentPrice,
      stance: calculateStance(newWeight, updatedPortfolio[index].index_weight)
    };
  
    setPortfolioStocks(updatedPortfolio);
  };
  
  const handleSharesChange = (index, value) => {
    const updatedPortfolio = [...portfolioStocks];
    const newShares = value === '' ? 0 : Number(value);
  
    if (!isNaN(newShares)) {
      // Get current price for the stock
      const currentPrice = stockPrices[updatedPortfolio[index].security_name]?.current_price || 0;
      
      // Calculate analyst price (shares * current price)
      const analystPrice = currentPrice * newShares;

      // Calculate analyst weight ((analyst price / total investment value) * 100)
      const totalInvestmentValue = 100000000000; // ₹10,000 Cr
      const analystWeight = (analystPrice / totalInvestmentValue) * 100;

      // Calculate total index weight
      const totalIndexWeight = updatedPortfolio.reduce((sum, stock) => 
        sum + (parseFloat(stock.index_weight) || 0), 0);

      // Calculate current total analyst weight excluding the stock being updated
      const currentTotalAnalystWeight = updatedPortfolio.reduce((sum, stock, idx) => {
        if (idx === index) return sum;
        return sum + (parseFloat(stock.analyst_weight) || 0);
        }, 0);

      // Check if new total would exceed index weight
      if (currentTotalAnalystWeight + analystWeight > totalIndexWeight) {
        alert('Total analyst weight cannot exceed total index weight');
        return;
      }

      // Update the stock with new values
      updatedPortfolio[index] = {
        ...updatedPortfolio[index],
        shares: newShares,
        analyst_price: analystPrice,
        analyst_weight: analystWeight,
        stance: calculateStance(analystWeight, updatedPortfolio[index].index_weight)
      };

      setPortfolioStocks(updatedPortfolio);
    } else {
      // Handle invalid numeric input
      const resetPortfolio = updatedPortfolio.map((stock, idx) => {
        if (idx === index) {
          return {
            ...stock,
            shares: value,
            analyst_price: 0,
            analyst_weight: 0,
            stance: calculateStance(0, stock.index_weight),
          };
        }
        return stock;
      });
  
      setPortfolioStocks(resetPortfolio);
    }
  };
  

  const handleSaveWeights = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/modify-stocks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portfolioStocks.map(stock => ({
          portfolio_item_id: stock.portfolio_item_id,
          analyst_weight: stock.analyst_weight,
          analyst_shares: stock.shares
        }))),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update stock');
      }

      // Fetch fresh data immediately after changes
      await fetchData();
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error updating weights:', error);
      alert('Failed to update weights: ' + error.message);
    }
  };

  const handleDone = () => {
    if (Math.abs(totals.indexWeight - totals.analystWeight) > 0.01) { // Allow a small tolerance
      setModalType("invalid");
      setShowModal(true);
    } else {
      alert("Index Weights are equla to Analyst Weights");
    }
  };

  const handleSave = async () => {
    // Calculate total index weight and total analyst weight
    const totalIndexWeight = portfolioStocks.reduce((sum, stock) =>
      sum + (parseFloat(stock.index_weight) || 0), 0);
    
    const totalAnalystWeight = portfolioStocks.reduce((sum, stock) =>
      sum + (parseFloat(stock.analyst_weight) || 0), 0);

    // Check if weights are equal (with a small tolerance for floating point arithmetic)
    if (Math.abs(totalIndexWeight - totalAnalystWeight) > 0.01) {
      alert('Total analyst weight must equal total index weight before saving');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5002/api/save-modify-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(portfolioStocks.map(stock => {
          const currentPrice = stockPrices[stock.security_name]?.current_price || 0;
          const shares = parseInt(stock.shares) || 0;
          const analystPrice = currentPrice * shares;

          return {
            security_name: stock.security_name,
            sector: stock.sector,
            currentPrice: parseFloat(currentPrice) || 0,
            index_weight: parseFloat(stock.index_weight) || 0,
            index_shares: parseInt(stock.index_shares) || 0,
            index_price_per_share: parseFloat(stock.index_price) || 0,
            index_price: parseFloat(stock.index_price) || 0,
            analyst_weight: parseFloat(stock.analyst_weight) || 0,
            analyst_shares: shares,
            analyst_price_per_share: parseFloat(currentPrice) || 0,
            analyst_price: parseFloat(analystPrice) || 0,
            stance: calculateStance(stock.analyst_weight, stock.index_weight),
            notes: stock.notes || "....."
          };
        })),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save changes';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.message === 'Data saved successfully') {
        // Fetch fresh data immediately after changes
        await fetchData();
        alert('Changes saved successfully!');
        navigate('/dashboard');
      } else {
        throw new Error(data.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalType("");
  };

  const handleConfirmSave = () => {
    console.log("Saving portfolio:", portfolioStocks);
    setShowModal(false);
    alert("Changes saved! ✅");
  };

  const handleAddRow = () => {
    setModalType("addStock");
    setShowModal(true);
  };

  const handleAddStock = (newStockName) => {
    if (!newStockName) {
      alert("Please enter a valid stock name from the available list.");
      return;
    }

    const selectedStock = allStocks.find(stock => stock.stock_name === newStockName);

    if (selectedStock) {
      const newRow = {
        ...selectedStock, //spread the selected stock
        analyst_weight: 0,
        shares: 0,
        stance: 'Equal Weight',
        notes: '.....',
      };
      const isDuplicate = portfolioStocks.some((stock) => stock.stock_name === newRow.stock_name);
      if (!isDuplicate) {
        setPortfolioStocks([...portfolioStocks, newRow]);
        setNotesData([...notesData, '.....']);
        setShowModal(false);
      } else {
        alert("Stock already exists in the table");
        setShowModal(false);
      }
    } else {
      alert("Stock doesn't exist");
      setShowModal(false);
    }
  };

  const handleNoteChange = (index, value) => {
    const updatedNotes = [...notesData];
    updatedNotes[index] = value;
    setNotesData(updatedNotes);

    const updatedPortfolio = [...portfolioStocks];
    updatedPortfolio[index].notes = value;
    setPortfolioStocks(updatedPortfolio);
  };

  const calculateInvestmentAmounts = () => {
    const totalInvested = portfolioStocks.reduce((total, stock) => {
      const currentPrice = stockPrices[stock.security_name]?.current_price || 0;
      return total + (currentPrice * (stock.shares || 0));
    }, 0);

    const fundAmount = 100000000000; // ₹10,000 Cr
    const remainingAmount = totalInvested - fundAmount ;

    return {
      totalInvested,
      remainingAmount
    };
  };

  useEffect(() => {
    const newTotals = {
      indexWeight: portfolioStocks.reduce((sum, stock) =>
        sum + (parseFloat(stock.index_weight) || 0), 0),
      analystWeight: portfolioStocks.reduce((sum, stock) =>
        sum + (parseFloat(stock.analyst_weight) || 0), 0),
      shares: portfolioStocks.reduce((sum, stock) =>
        sum + (parseInt(stock.shares || 0, 10) || 0), 0),
      indexPrice: portfolioStocks.reduce((sum, stock) =>
        sum + (parseFloat(stock.index_price) || 0), 0),
    };

    setTotals(newTotals);

  }, [portfolioStocks]);

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
            <button onClick={fetchData} className="retry-button">
              Retry Loading
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { totalInvested, remainingAmount } = calculateInvestmentAmounts();

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <main className="dashboard-container">
        <div className="modify-section">
          <div className="dashboard-header">
            <h2 className="dashboard-title">Modify Portfolio</h2>
          </div>

          {/* Total Investment Card */}
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <div className="card-label">Total Investment Amount</div>
              <div className="card-value blue">
                ₹{Number(localStorage.getItem('fundAmount')/10000000|| 100000000000).toLocaleString('en-IN')} Cr
              </div>
            </div>
            <div className="dashboard-card">
              <div className="card-label">Current Portfolio Amount</div>
              <div className="card-value green">
                ₹{(totalInvested/10000000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
              </div>
            </div>
            <div className="dashboard-card">
              <div className="card-label">Remaining Amount</div>
              <div className={`card-value ${remainingAmount >= 0 ? 'green' : 'red'}`}>
                ₹{(remainingAmount/10000000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
              </div>
            </div>
          </div>

          <div className="modify-table-container">
            <table className="modify-table">
              <thead>
                <tr>
                  <th><span>Company<br />Name<br /><span className="tableline"> </span></span></th>
                  {/* <th><span>Sector<br /><span className="tableline"> </span></span></th> */}
                  <th><span>Current<br />Price<br /><span className="tableline"> </span></span></th>
                  <th><span>Index Weight<br />(Current)<br /><span className="tableline"> </span></span></th>
                  <th><span>Index<br />Shares<br /><span className="tableline"> </span></span></th>
                  <th><span>Analyst Weight<br />(Current)<br /><span className="tableline"> </span></span></th>
                  <th><span>Analyst Shares<br />(Current)<br /><span className="tableline"> </span></span></th>
                  <th><span>Analyst Weight<br />(Current)<br /><span className="tableline">*Please Insert values</span></span></th>
                  <th><span>Analyst<br />Shares<br /><span className="tableline">*Please Insert values</span></span></th>
                  <th><span>Analyst<br />Price</span></th>
                  <th><span>Analyst<br />Stance</span></th>
                  <th><span>Notes</span></th>
                  <th><span>Upload<br />Docs</span></th>
                </tr>
              </thead>
              <tbody>
                {portfolioStocks.map((stock, index) => {
                  const currentPrice = stockPrices[stock.security_name]?.current_price || 0;
                  const indexShares = currentPrice > 0 ? Math.floor(stock.index_price / currentPrice) : 0;
                  const analystShares = parseInt(stock.shares) || 0;
                  const analystPrice = currentPrice * analystShares;
                  
                  const totalAnalystPriceUpdated = portfolioStocks.reduce((sum, s) => {
                    const shares = parseInt(s.shares) || 0;
                    const price = stockPrices[s.security_name]?.current_price || 0;
                    return sum + (price * shares);
                  }, 0);

                  const totalIndexWeight = portfolioStocks.reduce((sum, s) =>
                    sum + (parseFloat(s.index_weight) || 0), 0);

                  const currentAnalystWeight = totalAnalystPriceUpdated > 0 
                    ? ((analystPrice / totalAnalystPriceUpdated) * totalIndexWeight).toFixed(4)
                    : '0.0000';

                  const calculatedAnalystWeight = totalAnalystPriceUpdated > 0 
                    ? ((analystPrice / totalAnalystPriceUpdated) * totalIndexWeight).toFixed(4)
                    : '0.0000';

                  return (
                    <tr key={stock.portfolio_item_id}>
                      <td title={stock.security_name}>{stock.security_name}</td>
                      {/* <td title={stock.sector}>{stock.sector}</td> */}
                      <td>₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td>{(() => {
                        const totalIndexPricePerShare = portfolioStocks.reduce((sum, s) => {
                          const currentPrice = stockPrices[s.security_name]?.current_price || 0;
                          const shares = currentPrice > 0 ? Math.floor(s.index_price / currentPrice) : 0;
                          return sum + (shares * currentPrice);
                        }, 0);
                        const currentIndexPricePerShare = indexShares * currentPrice;
                        return totalIndexPricePerShare > 0 ? 
                          ((currentIndexPricePerShare / totalIndexPricePerShare) * totals.indexWeight).toFixed(4) + '%' : 
                          '0.0000%';
                      })()}</td>
                      <td>{indexShares.toLocaleString('en-IN')}</td>
                      <td>{currentAnalystWeight}%</td>
                      <td>{stock.last_saved_analyst_shares ? Math.round(stock.last_saved_analyst_shares).toLocaleString('en-IN') : "N/A"}</td>
                      <td>
                        <input
                          type="number"
                          className="modify-input"
                          value={stock.analyst_weight || ''}
                          onChange={(e) => handleCalculatedWeightChange(index, e.target.value)}
                          min="0"
                          max="100"
                          step="0.0001"
                          placeholder="0.0000"
                          style={{ width: '120px' }}
                        />
                        <span style={{ marginLeft: '4px' }}>%</span>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="modify-input"
                          value={stock.shares || ''}
                          onChange={(e) => handleSharesChange(index, e.target.value)}
                          placeholder="0"
                          style={{ width: '120px' }}
                          min="0"
                          step="1"
                          onKeyPress={(e) => {
                            if (!/^\d*$/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                      </td>
                      <td>₹{analystPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td>{calculateStance(stock.analyst_weight, stock.index_weight)}</td>
                      <td>
                        <input
                          type="text"
                          className="modify-input"
                          value={stock.notes || ''}
                          onChange={(e) => handleNoteChange(index, e.target.value)}
                          style={{ width: '200px' }}
                        />
                      </td>
                      <td>
                        <button className="save-btn" onClick={() => handleSaveChanges(stock)}>
                          Upload
                        </button>
                      </td>
                    </tr>
                  );
                })}

                <tr className="total-row">
                  <td colSpan="1"><strong>Total</strong></td>
                  <td> </td>
                  <td>{totals.indexWeight.toFixed(4)}%</td>
                  <td> </td>
                  <td> </td>
                  <td> </td>
                  <td>{totals.analystWeight.toFixed(4)}%</td>
                  <td> </td>
                  <td>₹{totalAnalystPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  <td colSpan="3"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="button-container">
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
            <button className="done-btn" onClick={handleDone}>
              Done
            </button>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              {modalType === "invalid" && (
                <div className="modal-section">
                  <h2>Invalid Weights</h2>
                  <p>Your stock weights do not add up to 100%.</p>
                  <div className="modal-actions">
                    <button className="modal-btn primary" onClick={handleModalClose}>Try Again</button>
                  </div>
                </div>
              )}
              {modalType === "confirmSave" && (
                <div className="modal-section">
                  <h2>Confirm Save</h2>
                  <p>Are you sure you want to save the changes?</p>
                  <div className="modal-actions">
                    <button className="modal-btn primary" onClick={handleConfirmSave}>Yes</button>
                    <button className="modal-btn secondary" onClick={handleModalClose}>No</button>
                  </div>
                </div>
              )}
              {modalType === "addStock" && (
                <div className="modal-section">
                  <h2>Add New Stock</h2>
                  <div className="stock-selector">
                    <select
                      className="stock-select"
                      onChange={(e) => handleAddStock(e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Select a stock</option>
                      {allStocks
                        .filter((stock) => stock.is_active === 1)
                        .map((stock) => (
                          <option key={stock.id} value={stock.stock_name}>
                            {stock.stock_name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button className="modal-btn secondary" onClick={handleModalClose}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {noteModal.visible && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-section">
                <h2>Note for {portfolioStocks[noteModal.index]?.security_name}</h2>
                <div className="note-container">
                  <p className="note-label">Previous Note:</p>
                  <div className="prev-note-box">{noteModal.value || "No previous note"}</div>
                  <textarea
                    className="note-textarea"
                    value={noteModal.value}
                    onChange={(e) => handleNoteChange(noteModal.index, e.target.value)}
                    placeholder="Enter your note here..."
                  />
                </div>
                <div className="modal-actions">
                  <button
                    className="modal-btn primary"
                    onClick={() => {
                      const updatedNotes = [...notesData];
                      updatedNotes[noteModal.index] = noteModal.value;
                      setNotesData(updatedNotes);

                      const updatedPortfolio = [...portfolioStocks];
                      updatedPortfolio[noteModal.index].notes = noteModal.value;
                      setPortfolioStocks(updatedPortfolio);
                      setNoteModal({ visible: false, index: null, value: "" });
                    }}
                  >
                    Save Note
                  </button>
                  <button
                    className="modal-btn secondary"
                    onClick={() => setNoteModal({ visible: false, index: null, value: "" })}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Modify;