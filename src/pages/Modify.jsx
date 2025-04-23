import React, { useState } from 'react';
import './Dashboard.css';
import userIcon from '../assets/usericon.png';
import { Link, useNavigate } from 'react-router-dom';

const Modify = () => {
  const navigate = useNavigate();
  const totalValue = 10000 * 1e7; // ₹10,000 Cr = 10000 * 10^7

  const stockPrices = {
    TCS: 3500,
    HDFC: 1600,
    INFY: 1500,
    PVR: 1400,
  };

  const navPages = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'List', route: '/list' },
    { name: 'Modify', route: '/modify' },
    { name: 'Portfolio', route: '/portfolio' },
    { name: 'Import History', route: '/import' },
    { name: 'Index Weights', route: '/weights' }
  ];

  const initialData = [
    { stock: 'TCS', analystWeight: 30, indexWeight: 18, notes: '.....' },
    { stock: 'HDFC', analystWeight: 20, indexWeight: 15, notes: '.....' },
    { stock: 'INFY', analystWeight: 25, indexWeight: 20, notes: '.....' },
    { stock: 'PVR', analystWeight: 25, indexWeight: 16, notes: '.....' }
  ];

  const calculateStance = (analystWeight, indexWeight) => {
    const aw = parseFloat(analystWeight);
    const iw = parseFloat(indexWeight);
    if (aw > iw) return "Overweight";
    else if (aw < iw) return "Underweight";
    else return "Equal Weight";
  };

  const [portfolio, setPortfolio] = useState(
    initialData.map((item) => {
      const shares = Math.floor((item.analystWeight / 100) * totalValue / stockPrices[item.stock]);
      const stance = calculateStance(item.analystWeight, item.indexWeight);
      return { ...item, shares, stance };
    })
  );

  const [notesData, setNotesData] = useState(initialData.map(row => row.notes));
  const [newStockName, setNewStockName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [noteModal, setNoteModal] = useState({ visible: false, index: null, value: "" });

  const handleWeightChange = (index, value) => {
    const newWeight = parseFloat(value);
    if (isNaN(newWeight)) return;

    const updatedPortfolio = [...portfolio];
    updatedPortfolio[index].analystWeight = newWeight;
    updatedPortfolio[index].shares = Math.floor((newWeight / 100) * totalValue / stockPrices[updatedPortfolio[index].stock]);
    updatedPortfolio[index].stance = calculateStance(newWeight, updatedPortfolio[index].indexWeight);

    setPortfolio(updatedPortfolio);
  };

  const handleSharesChange = (index, value) => {
    const newShares = parseInt(value);
    if (isNaN(newShares)) return;

    const updatedPortfolio = [...portfolio];
    updatedPortfolio[index].shares = newShares;
    const newAW = ((newShares * stockPrices[updatedPortfolio[index].stock]) / totalValue * 100).toFixed(2);
    updatedPortfolio[index].analystWeight = newAW;
    updatedPortfolio[index].stance = calculateStance(newAW, updatedPortfolio[index].indexWeight);

    setPortfolio(updatedPortfolio);
  };

  const handleDone = () => {
    const total = portfolio.reduce((acc, curr) => acc + parseFloat(curr.analystWeight), 0);
    if (Math.round(total) !== 100) {
      setModalType("invalid");
      setShowModal(true);
    } else {
      alert("Weights are valid and sum to 100%");
    }
  };

  const handleSave = () => {
    localStorage.setItem("savedPortfolio", JSON.stringify(portfolio));
    setModalType("confirmSave");
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalType("");
  };

  const handleConfirmSave = () => {
    console.log("Saving portfolio:", portfolio);
    setShowModal(false);
    alert("Changes saved! ✅");
  };

  const handleAddRow = () => {
    const newRow = {
      stock: '',
      analystWeight: 0,
      indexWeight: 0,
      notes: '.....',
      shares: 0,
      stance: 'Equal Weight'
    };
    setPortfolio([...portfolio, newRow]);
  };

  const handleAddStock = () => {
    if (!newStockName || !stockPrices[newStockName]) {
      alert("Please enter a valid stock name from the available list.");
      return;
    }

    const newStock = {
      stock: newStockName,
      analystWeight: 0,
      indexWeight: 0,
      notes: '.....',
      shares: 0,
      stance: 'Equal Weight'
    };

    setPortfolio([...portfolio, newStock]);
    setNewStockName('');
  };

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <h2 className="sidebar-title">PF Allocation Tool</h2>
        <nav className="sidebar-nav">
          {navPages.map((page) => (
            <Link
              key={page.name}
              to={page.route}
              className={window.location.pathname === page.route ? 'active' : ''}
            >
              {page.name}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="dashboard-container">
        <div className="dashboard-topbar">
          <input type="text" className="dashboard-search" placeholder="Search.." />
          <div className="dashboard-user-info">
            <div className="dashboard-user">
              <img src={userIcon} alt="User Icon" className="dashboard-user-icon" />
              <div className="user-text">
                <div className="user-name">John Doe</div>
                <div className="user-email">john@example.com</div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-header">
          <div className="header-title-container">
            <h1 className="dashboard-title">Modify Portfolio Weights</h1>
            <button className="add-row-btn" onClick={handleAddRow}>Add New Stock</button>
          </div>
        </div>

        <div className="modify-table-container">
          <table className="modify-table">
            <thead>
              <tr className="modify-table-header-row">
                <th>Stock Name</th>
                <th>Analyst Weight (%)</th>
                <th>Number of Stocks</th>
                <th>Index Weight (%)</th>
                <th>Analyst Stance</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={row.stock}
                      onChange={(e) => {
                        const updated = [...portfolio];
                        updated[index].stock = e.target.value;
                        setPortfolio(updated);
                      }}
                      className="modify-input"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.analystWeight}
                      onChange={(e) => handleWeightChange(index, e.target.value)}
                      className="modify-input"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={row.shares}
                      onChange={(e) => handleSharesChange(index, e.target.value)}
                      className="modify-input"
                    />
                  </td>
                  <td>
                   {row.indexWeight}                      
                  </td>
                  <td>{row.stance}</td>
                  <td>
                    <button
                      className="note-btn"
                      onClick={() =>
                        setNoteModal({ visible: true, index, value: notesData[index] })
                      }
                      title={notesData[index] || 'No note'}
                    >
                      Add Note
                    </button>
                  </td>
                  <td>
                    <button className="modify-btn">Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="button-container">
            <button className="done-btn" onClick={handleDone}>Done</button>
            <button className="save-btn" onClick={handleSave}>Save</button>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              {modalType === "invalid" && (
                <>
                  <h2>Invalid Weights</h2>
                  <p>Your stock weights do not add up to 100%.</p>
                  <button className="modal-btn" onClick={handleModalClose}>Try Again</button>
                </>
              )}
              {modalType === "confirmSave" && (
                <>
                  <h2>Confirm Save</h2>
                  <p>Are you sure you want to save the changes?</p>
                  <div className="modal-actions">
                    <button className="modal-btn yes" onClick={handleConfirmSave}>Yes</button>
                    <button className="modal-btn no" onClick={handleModalClose}>No</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {noteModal.visible && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Note for {portfolio[noteModal.index].stock}</h2>
              <p>Previous Note:</p>
              <div className="prev-note-box">{noteModal.value || "No previous note"}</div>
              <textarea
                className="note-textarea"
                value={noteModal.value}
                onChange={(e) =>
                  setNoteModal({ ...noteModal, value: e.target.value })
                }
              />
              <div className="modal-actions">
                <button
                  className="modal-btn yes"
                  onClick={() => {
                    const updatedNotes = [...notesData];
                    updatedNotes[noteModal.index] = noteModal.value;
                    setNotesData(updatedNotes);
                    setNoteModal({ visible: false, index: null, value: "" });
                  }}
                >
                  Save Note
                </button>
                <button
                  className="modal-btn no"
                  onClick={() =>
                    setNoteModal({ visible: false, index: null, value: "" })
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Modify;