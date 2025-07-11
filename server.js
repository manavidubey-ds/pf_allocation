import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// API Routes
app.get('/api/portfolio', async (req, res) => {
  try {
    console.log('Fetching portfolio data...');
    
    // Get the latest data from modify_history table
    const query = `
      SELECT 
        mh.id,
        mh.security_name,
        mh.sector,
        mh.current_price,
        mh.index_weight,
        mh.analyst_weight,
        mh.analyst_stance,
        mh.index_price,
        mh.index_shares,
        mh.index_price_per_share,
        mh.analyst_price,
        mh.analyst_shares,
        mh.analyst_price_per_share,
        mh.notes,
        mh.date_added,
        mh.is_active
      FROM modify_history mh
      INNER JOIN (
        SELECT security_name, MAX(date_added) as latest_date
        FROM modify_history
        GROUP BY security_name
      ) latest ON mh.security_name = latest.security_name 
      AND mh.date_added = latest.latest_date
      ORDER BY mh.security_name ASC
    `;

    const [rows] = await db.promise().query(query);
    console.log(`Found ${rows.length} securities in modify_history table`);

    // Get stock names for price fetching
    const stockNames = rows.map(row => row.security_name);
    console.log('Fetching prices for stocks:', stockNames);

    // Fetch current prices using Python script
    const py = spawn('python3', ['backend/fetch_stocks.py']);
    let data = '';
    let error = '';

    py.stdout.on('data', (chunk) => {
      data += chunk;
    });

    py.stderr.on('data', (chunk) => {
      error += chunk;
    });

    py.on('close', async (code) => {
      if (code !== 0) {
        console.error('Python script error:', error);
        // Continue with existing prices if Python script fails
        const portfolioData = rows.map(row => ({
          ...row,
          current_price: parseFloat(row.current_price) || 0,
          value: (parseFloat(row.current_price) || 0) * (parseInt(row.analyst_shares) || 0),
          portfolio_percentage: 0
        }));

        const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);
        portfolioData.forEach(item => {
          item.portfolio_percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
        });

        console.log('Sending portfolio data with existing prices');
        res.json(portfolioData);
        return;
      }

      try {
        const pricesData = JSON.parse(data);
        console.log('Received prices from Python script:', pricesData);

        // Create a map of security names to current prices
        const priceMap = {};
        pricesData.forEach(item => {
          priceMap[item.security_name] = parseFloat(item.current_price) || 0;
        });

        // Update portfolio data with current prices
        const portfolioData = rows.map(row => {
          const currentPrice = priceMap[row.security_name] || parseFloat(row.current_price) || 0;
          const shares = parseInt(row.analyst_shares) || 0;
          const value = currentPrice * shares;
          
          return {
            ...row,
            current_price: currentPrice,
            value: value,
            portfolio_percentage: 0
          };
        });

        // Calculate total portfolio value and percentages
        const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);
        portfolioData.forEach(item => {
          item.portfolio_percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
        });

        console.log('Total portfolio value:', totalValue);
        console.log('Sending portfolio data with updated prices');
        res.json(portfolioData);

      } catch (error) {
        console.error('Error processing prices:', error);
        // Fallback to existing prices
        const portfolioData = rows.map(row => ({
          ...row,
          current_price: parseFloat(row.current_price) || 0,
          value: (parseFloat(row.current_price) || 0) * (parseInt(row.analyst_shares) || 0),
          portfolio_percentage: 0
        }));

        const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);
        portfolioData.forEach(item => {
          item.portfolio_percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
        });

        console.log('Sending portfolio data with fallback prices');
        res.json(portfolioData);
      }
    });

    // Send stock names to Python script
    py.stdin.write(JSON.stringify(stockNames));
    py.stdin.end();

  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio data' });
  }
});

app.get('/api/dashboard', (req, res) => {
  const query = `
    SELECT d.*, 
           mh.analyst_shares,
           mh.analyst_price_per_share,
           mh.analyst_stance,
           mh.index_shares,
           mh.index_price_per_share,
           mh.index_price,
           mh.analyst_price,
           mh.date_added
    FROM dashboard d
    LEFT JOIN modify_history mh ON d.security_name = mh.security_name
    WHERE d.is_active = 1
    AND mh.date_added = (
      SELECT MAX(date_added)
      FROM modify_history
      WHERE security_name = d.security_name
    )
    ORDER BY d.security_name
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching dashboard:', err);
      res.status(500).json({ error: 'Error fetching dashboard data' });
      return;
    }
    res.json(results);
  });
});

app.get('/api/modify-history', (req, res) => {
  const query = `
    SELECT mh.*, d.current_price, d.index_weight, d.analyst_weight
    FROM modify_history mh
    LEFT JOIN dashboard d ON mh.security_name = d.security_name
    WHERE mh.is_active = 1
    ORDER BY mh.date_added DESC, mh.security_name
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching modify history:', err);
      res.status(500).json({ error: 'Error fetching modify history' });
      return;
    }
    res.json(results);
  });
});

app.get('/api/corporate-actions', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        ca.*,
        d.current_price,
        latest_mh.analyst_shares
      FROM corporate_actions ca
      LEFT JOIN dashboard d ON ca.security_name = d.security_name
      LEFT JOIN (
        SELECT mh.security_name, mh.analyst_shares
        FROM modify_history mh
        INNER JOIN (
          SELECT security_name, MAX(date_added) as latest_date
          FROM modify_history
          GROUP BY security_name
        ) latest ON mh.security_name = latest.security_name AND mh.date_added = latest.latest_date
      ) latest_mh ON ca.security_name = latest_mh.security_name
      ORDER BY ca.ex_date DESC
    `);
    console.log('Fetched corporate actions:', rows);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching corporate actions:', error);
    res.status(500).json({ error: 'Failed to fetch corporate actions' });
  }
});

app.post('/api/corporate-actions', async (req, res) => {
  try {
    const { security_name, action_type, value, ex_date, record_date, payment_date, notes } = req.body;
    
    const [result] = await db.promise().query(
      `INSERT INTO corporate_actions 
       (security_name, action_type, value, ex_date, record_date, payment_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [security_name, action_type, value, ex_date, record_date, payment_date, notes]
    );
    
    console.log('Added corporate action:', result);
    res.json({ message: 'Corporate action added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding corporate action:', error);
    res.status(500).json({ error: 'Failed to add corporate action' });
  }
});

app.put('/api/corporate-actions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { security_name, action_type, value, ex_date, record_date, payment_date, notes } = req.body;
    
    const [result] = await db.promise().query(
      `UPDATE corporate_actions 
       SET security_name = ?, action_type = ?, value = ?, ex_date = ?, 
           record_date = ?, payment_date = ?, notes = ?
       WHERE id = ?`,
      [security_name, action_type, value, ex_date, record_date, payment_date, notes, id]
    );
    
    console.log('Updated corporate action:', result);
    res.json({ message: 'Corporate action updated successfully' });
  } catch (error) {
    console.error('Error updating corporate action:', error);
    res.status(500).json({ error: 'Failed to update corporate action' });
  }
});

app.delete('/api/corporate-actions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.promise().query(
      'DELETE FROM corporate_actions WHERE id = ?',
      [id]
    );
    
    console.log('Deleted corporate action:', result);
    res.json({ message: 'Corporate action deleted successfully' });
  } catch (error) {
    console.error('Error deleting corporate action:', error);
    res.status(500).json({ error: 'Failed to delete corporate action' });
  }
});

app.get('/api/securities', (req, res) => {
  const query = `
    SELECT DISTINCT d.security_name, d.sector, d.is_active
    FROM dashboard d
    WHERE d.is_active = 1
    ORDER BY d.security_name
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching securities:', err);
      res.status(500).json({ error: 'Error fetching securities' });
      return;
    }
    res.json(results);
  });
});

// Add missing /api/stocks endpoint
app.get('/api/stocks', (req, res) => {
  const query = `
    SELECT DISTINCT d.security_name, d.sector, d.is_active
    FROM dashboard d
    WHERE d.is_active = 1
    ORDER BY d.security_name
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching stocks:', err);
      res.status(500).json({ error: 'Error fetching stocks' });
      return;
    }
    res.json({ portfolio: results });
  });
});

app.get('/api/latest-modify-data', (req, res) => {
  const query = `
    SELECT mh.*, d.current_price
    FROM modify_history mh
    LEFT JOIN dashboard d ON mh.security_name = d.security_name
    WHERE mh.date_added = (
      SELECT MAX(date_added)
      FROM modify_history
      WHERE security_name = mh.security_name
    )
    AND mh.is_active = 1
    ORDER BY mh.date_added DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching latest modify data:', err);
      res.status(500).json({ error: 'Error fetching latest modify data' });
      return;
    }
    res.json(results);
  });
});

app.get('/api/portfolio-prices', async (req, res) => {
  try {
    console.log('Fetching portfolio prices...');
    
    // Get active stocks from modify_history table
    const [rows] = await db.promise().query(`
      SELECT DISTINCT mh.security_name
      FROM modify_history mh
      INNER JOIN (
        SELECT security_name, MAX(date_added) as latest_date
        FROM modify_history
        GROUP BY security_name
      ) latest ON mh.security_name = latest.security_name AND mh.date_added = latest.latest_date
      WHERE mh.is_active = 1
      ORDER BY mh.security_name ASC
    `);
    
    console.log(`Found ${rows.length} active stocks`);
    
    // Use fetch_stocks.py to get current prices
    const stockNames = rows.map(row => row.security_name);
    console.log('Fetching prices for stocks:', stockNames);
    
    const prices = await new Promise((resolve, reject) => {
      const py = spawn('python3', ['backend/fetch_stocks.py'], { cwd: __dirname });
      let data = '';
      let error = '';
      
      py.stdout.on('data', chunk => { 
        console.log('Python stdout:', chunk.toString());
        data += chunk; 
      });
      
      py.stderr.on('data', chunk => { 
        console.log('Python stderr:', chunk.toString());
        error += chunk; 
      });
      
      py.on('close', code => {
        if (code !== 0) {
          console.error('fetch_stocks.py error:', error);
          return reject(new Error('fetch_stocks.py failed'));
        }
        try {
          console.log('Python output:', data);
          const parsed = JSON.parse(data);
          console.log('Parsed prices:', parsed);
          resolve(parsed);
        } catch (e) {
          console.error('Error parsing fetch_stocks.py output:', e, data);
          reject(e);
        }
      });
      
      console.log('Sending stock names to Python:', JSON.stringify(stockNames));
      py.stdin.write(JSON.stringify(stockNames));
      py.stdin.end();
    });

    console.log('Sending response...');
    res.json(prices);
  } catch (error) {
    console.error('Error in /api/portfolio-prices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch portfolio prices', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// Endpoint: Get index weights for all securities
app.get('/api/index-weights', async (req, res) => {
  try {
    // Get the latest index weights for each security
    const [rows] = await db.promise().query(`
      WITH latest_weights AS (
        SELECT 
          security_name,
          index_weight,
          date_added,
          ROW_NUMBER() OVER (PARTITION BY security_name ORDER BY date_added DESC) as rn
        FROM dashboard
        WHERE index_weight IS NOT NULL
      )
      SELECT 
        security_name,
        index_weight,
        date_added as last_updated
      FROM latest_weights
      WHERE rn = 1
      ORDER BY index_weight DESC
    `);
    
    console.log('Fetched index weights:', rows);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching index weights:', error);
    res.status(500).json({ error: 'Failed to fetch index weights' });
  }
});

// Endpoint: Get modify history list (grouped by date_added)
app.get('/api/modify-history-list', async (req, res) => {
  try {
    console.log('Fetching modify history list...');
    const [rows] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(date_added, '%Y-%m-%d %H:%i:%s') as timestamp,
        GROUP_CONCAT(DISTINCT security_name ORDER BY security_name) as securities,
        GROUP_CONCAT(DISTINCT notes) as notes,
        SUM(analyst_price) as total_value,
        COUNT(DISTINCT security_name) as num_securities
      FROM modify_history
      GROUP BY date_added
      ORDER BY date_added DESC
    `);

    console.log(`Found ${rows.length} history entries`);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching modify history list:', error);
    res.status(500).json({ error: 'Failed to fetch modify history list' });
  }
});

app.get('/api/modify-history-details/:timestamp', async (req, res) => {
  try {
    console.log('Fetching modify history details for timestamp:', req.params.timestamp);
    const [rows] = await db.promise().query(`
      SELECT 
        security_name,
        sector,
        current_price,
        index_weight,
        index_shares,
        index_price_per_share,
        index_price,
        analyst_weight,
        analyst_shares,
        analyst_price_per_share,
        analyst_price,
        analyst_stance,
        notes,
        DATE_FORMAT(date_added, '%Y-%m-%d %H:%i:%s') as timestamp
      FROM modify_history
      WHERE date_added = ?
      ORDER BY security_name ASC
    `, [req.params.timestamp]);

    console.log(`Found ${rows.length} securities for timestamp ${req.params.timestamp}`);
    res.json({
      timestamp: req.params.timestamp,
      details: rows
    });
  } catch (error) {
    console.error('Error fetching modify history details:', error);
    res.status(500).json({ error: 'Failed to fetch modify history details' });
  }
});

// Endpoint: Upload corporate actions from Excel
app.post('/api/upload-corporate-actions', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    console.log('Processing file:', filePath);

    // Use Python script to process Excel file
    const py = spawn('python3', ['backend/process_corporate_actions.py', filePath]);
    let data = '';
    let error = '';

    py.stdout.on('data', (chunk) => {
      console.log('Python stdout:', chunk.toString());
      data += chunk;
    });

    py.stderr.on('data', (chunk) => {
      console.log('Python stderr:', chunk.toString());
      error += chunk;
    });

    py.on('close', async (code) => {
      // Clean up the uploaded file
      fs.unlinkSync(filePath);

      if (code !== 0) {
        console.error('Python script error:', error);
        return res.status(500).json({ error: 'Failed to process Excel file' });
      }

      try {
        const actions = JSON.parse(data);
        console.log('Parsed actions:', actions);

        // Insert actions into database
        for (const action of actions) {
          await db.promise().query(
            `INSERT INTO corporate_actions 
             (security_name, action_type, value, ex_date, record_date, payment_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              action.security_name,
              action.action_type,
              action.value,
              action.ex_date,
              action.record_date,
              action.payment_date
            ]
          );
        }

        res.json({ message: 'Corporate actions uploaded successfully', count: actions.length });
      } catch (error) {
        console.error('Error processing actions:', error);
        res.status(500).json({ error: 'Failed to process corporate actions' });
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Endpoint: Save modify data to modify_history table
app.post('/api/save-modify-data', async (req, res) => {
  try {
    console.log('Saving modify data:', req.body);
    const stocks = req.body;

    if (!Array.isArray(stocks)) {
      return res.status(400).json({ error: 'Invalid data format. Expected an array of stocks.' });
    }

    // Begin transaction
    await db.promise().query('START TRANSACTION');

    try {
      // Insert each stock's data
      for (const stock of stocks) {
        const query = `
          INSERT INTO modify_history (
            security_name,
            sector,
            current_price,
            index_weight,
            index_shares,
            index_price_per_share,
            index_price,
            analyst_weight,
            analyst_shares,
            analyst_price_per_share,
            analyst_price,
            analyst_stance,
            notes,
            date_added
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const values = [
          stock.security_name,
          stock.sector,
          stock.currentPrice,
          stock.index_weight,
          stock.index_shares,
          stock.index_price_per_share,
          stock.index_price,
          stock.analyst_weight,
          stock.analyst_shares,
          stock.analyst_price_per_share,
          stock.analyst_price,
          stock.stance,
          stock.notes
        ];

        await db.promise().query(query, values);
      }

      // Commit transaction
      await db.promise().query('COMMIT');
      console.log('Successfully saved modify data for', stocks.length, 'stocks');
      res.json({ message: 'Data saved successfully' });
    } catch (error) {
      // Rollback transaction if there was an error
      await db.promise().query('ROLLBACK');
      console.error('Transaction rolled back due to error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving modify data:', error);
    res.status(500).json({ error: 'Failed to save data', details: error.message });
  }
});

// Add missing /api/modify-stocks endpoint
app.put('/api/modify-stocks', async (req, res) => {
  try {
    console.log('Updating modify stocks:', req.body);
    const stocks = req.body;
    
    if (!Array.isArray(stocks)) {
      return res.status(400).json({ error: 'Invalid data format. Expected an array of stocks.' });
    }

    // Update each stock's data in the latest modify_history entry
    for (const stock of stocks) {
      const query = `
        UPDATE modify_history 
        SET analyst_weight = ?, analyst_shares = ?
        WHERE security_name = ? 
        AND date_added = (
          SELECT MAX(date_added) 
          FROM modify_history 
          WHERE security_name = ?
        )
      `;
      
      await db.promise().query(query, [
        stock.analyst_weight || 0,
        stock.analyst_shares || 0,
        stock.security_name,
        stock.security_name
      ]);
    }

    console.log('Successfully updated modify stocks');
    res.json({ message: 'Stocks updated successfully' });
  } catch (error) {
    console.error('Error updating modify stocks:', error);
    res.status(500).json({ error: 'Failed to update stocks', details: error.message });
  }
});

// Endpoint: Update stock status in portfolio
app.put('/api/stocks/:id', async (req, res) => {
  try {
    const portfolioItemId = req.params.id;
    const { is_active } = req.body;

    console.log("Updating portfolio item ID:", portfolioItemId);
    console.log("Setting is_active to:", is_active);

    if (!Number.isInteger(Number(portfolioItemId))) {
      return res.status(400).json({ message: 'Invalid portfolio item ID' });
    }

    if (is_active === undefined) {
      return res.status(400).json({ message: 'Please provide is_active value' });
    }

    // First get the latest date_added for this security
    const getLatestDateQuery = `
      SELECT MAX(date_added) as latest_date 
      FROM modify_history 
      WHERE id = ?
    `;
    
    const [dateResult] = await db.promise().query(getLatestDateQuery, [portfolioItemId]);
    
    if (!dateResult || !dateResult[0] || !dateResult[0].latest_date) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    // Update the is_active status in modify_history table
    const updateQuery = `
      UPDATE modify_history 
      SET is_active = ? 
      WHERE id = ? AND date_added = ?
    `;
    
    const [result] = await db.promise().query(updateQuery, [
      is_active ? 1 : 0, 
      portfolioItemId, 
      dateResult[0].latest_date
    ]);
    
    console.log("Result of update:", result);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Portfolio item not found' });
    } else {
      res.json({ message: 'Stock status updated successfully', result });
    }
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Failed to update stock status', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 