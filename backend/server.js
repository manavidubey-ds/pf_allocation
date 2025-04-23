import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

// Create an Express app
const app = express();

// Middleware to handle CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// MySQL Connection Setup
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Manavi@2809', // 🔁 Replace with your actual MySQL password
  database: 'stock_portfolio', // The database you're using
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to MySQL DB');
});

// Route to fetch all stocks
app.get('/api/stocks', (req, res) => {
  const query = 'SELECT * FROM stocks';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching stocks:', err);
      return res.status(500).json({ error: 'Database query error' });
    }
    res.json(results); // Return the list of stocks as JSON
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
