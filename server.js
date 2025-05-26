import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database configuration
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Manavi@2809',
  database: 'pf_allocation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Successfully connected to database');
  connection.release();
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
app.get('/api/portfolio', async (req, res) => {
  try {
    const fundAmount = req.query.fundAmount || 0;
    const [rows] = await db.promise().query(`
      SELECT * FROM dashboard 
      WHERE is_active = 1
      ORDER BY security_name
    `);
    res.json({ portfolio: rows });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio data' });
  }
});

app.get('/api/portfolio-prices', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT security_name as stock_name, current_price 
      FROM dashboard 
      WHERE is_active = 1
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching portfolio prices:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio prices' });
  }
});

app.get('/api/latest-modify-data', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT * FROM modify_update_portfolio 
      WHERE date = (SELECT MAX(date) FROM modify_update_portfolio)
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching latest modify data:', error);
    res.status(500).json({ error: 'Failed to fetch latest modify data' });
  }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 