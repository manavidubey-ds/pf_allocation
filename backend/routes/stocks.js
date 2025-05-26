const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// MySQL Connection Setup
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Manavi@2809', // 🔁 Replace this with your actual password
  database: 'stock_portfolio' // ✅ Updated DB name
});

connection.connect(err => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to MySQL DB');
});

// Upsert: Upload (Insert or Update Stock Data)
router.post('/upsert', (req, res) => {
  const { id, user_id, stock_name, analyst_weight, number_of_shares, index_weight, stance, note, last_closing_price, gain } = req.body;

  const query = `
    INSERT INTO stocks (id, user_id, stock_name, analyst_weight, number_of_shares, index_weight, stance, note, last_closing_price, gain)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      user_id = VALUES(user_id),
      stock_name = VALUES(stock_name),
      analyst_weight = VALUES(analyst_weight),
      number_of_shares = VALUES(number_of_shares),
      index_weight = VALUES(index_weight),
      stance = VALUES(stance),
      note = VALUES(note),
      last_closing_price = VALUES(last_closing_price),
      gain = VALUES(gain)
  `;

  connection.query(query, [id, user_id, stock_name, analyst_weight, number_of_shares, index_weight, stance, note, last_closing_price, gain], (err, results) => {
    if (err) {
      console.error('❌ Error inserting/updating stock data:', err);
      return res.status(500).json({ error: 'Database query error' });
    }
    res.status(200).json({ message: 'Stock data uploaded successfully', results });
  });
});

// Get Index: Fetch Index from Database
router.get('/:id', (req, res) => {
  const stockId = req.params.id;

  const query = 'SELECT * FROM banks WHERE id = ?';
  connection.query(query, [stockId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching stock data:', err);
      return res.status(500).json({ error: 'Database query error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    res.json(results[0]); // Sends a single stock object
  });
});

// List Index: List All Stocks
router.get('/list', (req, res) => {
  const limit = parseInt(req.query.limit) || 10; // You can use a query parameter to limit the number of records (default is 10)

  const query = 'SELECT * FROM banksLIMIT ?';
  connection.query(query, [limit], (err, results) => {
    if (err) {
      console.error('❌ Error fetching stock data:', err);
      return res.status(500).json({ error: 'Database query error' });
    }
    res.json(results); // Sends an array of stock objects
  });
});

// Get Index (Limited Showcase)
router.get('/showcase', (req, res) => {
  const limit = parseInt(req.query.limit) || 5; // Show 5 records by default

  const query = 'SELECT * FROM stocks ORDER BY updated_at DESC LIMIT ?';
  connection.query(query, [limit], (err, results) => {
    if (err) {
      console.error('❌ Error fetching stock data for showcase:', err);
      return res.status(500).json({ error: 'Database query error' });
    }
    res.json(results); // Sends the limited set of stocks
  });
});

module.exports = router;
