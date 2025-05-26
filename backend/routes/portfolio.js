// routes/portfolio.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

// Route to update the fund amount (total_investment_amount)
router.put('/funds', (req, res) => {
  const { total_invested } = req.body;

  // Ensure the fund amount is provided in the request body
  if (total_invested == null) {
    return res.status(400).json({ success: false, message: 'Missing fund amount' });
  }

  // Get the current date
  const currentDate = new Date().toISOString().split('T')[0]; // Format to YYYY-MM-DD

  // SQL query to update the 'total_investment_amount' for the portfolio
  const query = 'UPDATE portfolio_details SET total_investment_amount = ? WHERE aID = 1 AND date = ?';

  db.query(query, [total_invested, currentDate], (err, result) => {
    if (err) {
      console.error('MySQL error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    // Check if the update was successful
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Portfolio not found or date mismatch' });
    }

    // Return success response if everything is okay
    return res.json({ success: true, message: 'Fund amount updated successfully' });
  });
});

export default router;
