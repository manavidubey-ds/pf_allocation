import express from 'express';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import cors from 'cors';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import NodeCache from 'node-cache';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 5000;

app.use(cors({
  origin: 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,POST,DELETE',
  credentials: true,
}));
app.use(bodyParser.json());

// Create a connection pool instead of a single connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Manavi@2809',
  database: 'pf_allocation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Convert pool to use promises
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
  try {
    const [rows] = await promisePool.query('SELECT 1');
    console.log('Connected to database');
  } catch (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
};

// Initialize test data if database is empty
const initializeTestData = async () => {
  try {
    // Check if we have any securities
    const [securities] = await promisePool.query('SELECT COUNT(*) as count FROM security');
    if (securities[0].count === 0) {
      console.log('Initializing test data...');
      
      // Insert test securities
      const securities = [
        ['NTPC Ltd', 'Power'],
        ['Power Grid Corporation of India Ltd', 'Power'],
        ['Tata Power Co Ltd', 'Power']
      ];
      
      await promisePool.query(
        'INSERT INTO security (security_name, sector) VALUES ?',
        [securities]
      );

      // Get the inserted security IDs
      const [insertedSecurities] = await promisePool.query('SELECT id FROM security');
      
      // Add them to portfolio
      const portfolioEntries = insertedSecurities.map(sec => [sec.id, 'Test entry', 1]);
      await promisePool.query(
        'INSERT INTO portfolio_table (stock_id, notes, is_active) VALUES ?',
        [portfolioEntries]
      );

      // Add some index weights
      const indexEntries = insertedSecurities.map(sec => [
        new Date().toISOString().split('T')[0],
        33.33,
        sec.id,
        securities[insertedSecurities.indexOf(sec)][0]
      ]);
      
      await promisePool.query(
        'INSERT INTO indexes (date, weight, security_id, security_name) VALUES ?',
        [indexEntries]
      );

      console.log('Test data initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing test data:', error);
  }
};

// Call initializeTestData after database connection
testConnection().then(() => {
  initializeTestData();
});

// Initialize cache with a TTL of 5 minutes (300 seconds)
const stockCache = new NodeCache({ stdTTL: 300 });

// Helper function to execute queries with error handling
const executeQuery = async (query, params = []) => {
  try {
    const [rows] = await promisePool.query(query, params);
    return rows;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};

app.get('/api/stocks', (req, res) => {
  const query = 'SELECT id, security_name, sector, is_active FROM security';
  executeQuery(query, [])
    .then(results => {
      res.json({ portfolio: results });
    })
    .catch(err => {
      console.error(`Error executing query: ${query}`, err);
      res.status(500).json({ message: 'Error fetching stocks', error: err });
    });
});

app.get('/api/securities', (req, res) => {
  const query = 'SELECT id, security_name FROM security';
  executeQuery(query, [])
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error(`Error executing query: ${query}`, err);
      res.status(500).json({ message: 'Error fetching securities', error: err });
    });
});

app.post('/add-stock', (req, res) => {
  const { security_name, sector, is_active } = req.body;

  if (!security_name || !sector) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  const query = 'INSERT INTO security (security_name, sector, is_active) VALUES (?, ?, ?)';
  executeQuery(query, [security_name, sector, is_active ?? 1])
    .then(result => {
      res.status(200).json({ message: 'Stock saved successfully', result });
    })
    .catch(err => {
      console.error('Insert error:', err);
      res.status(500).json({ message: 'Database error', error: err });
    });
});

app.put('/api/stocks/:id', (req, res) => {
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

  const query = 'UPDATE portfolio_table SET is_active = ? WHERE id = ?';
  executeQuery(query, [is_active, portfolioItemId])
    .then(result => {
      console.log("Result of update:", result);
      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'Portfolio item not found' });
      } else {
        res.json({ message: 'Stock updated successfully', result });
      }
    })
    .catch(err => {
      console.error('Update error:', err);
      res.status(500).json({ message: 'Failed to update stock status', error: err });
    });
});

app.post('/api/portfolio', (req, res) => {
  const { stock_id, notes } = req.body;
  if (!stock_id) {
    return res.status(400).json({ message: 'Stock ID is required' });
  }

  // First check if the stock already exists in portfolio
  const checkQuery = 'SELECT id FROM portfolio_table WHERE stock_id = ?';
  executeQuery(checkQuery, [stock_id])
    .then(results => {
      if (results.length > 0) {
        return res.status(400).json({ message: 'Stock already exists in portfolio' });
      }

      // If stock doesn't exist, add it
      const insertQuery = `INSERT INTO portfolio_table (stock_id, notes, date_added, is_active) 
                          VALUES (?, ?, NOW(), 1)`;
      executeQuery(insertQuery, [stock_id, notes])
        .then(result => {
          const getInsertedQuery = `
            SELECT pt.id as portfolio_item_id, pt.stock_id, s.security_name, pt.date_added, pt.notes, s.sector, pt.is_active
            FROM portfolio_table pt
            JOIN security s ON pt.stock_id = s.id
            WHERE pt.id = ?
          `;
          return executeQuery(getInsertedQuery, [result.insertId]);
        })
        .then(insertedResult => {
          res.status(201).json({ message: 'Stock added to portfolio', portfolio: insertedResult[0] });
        })
        .catch(err => {
          console.error('Error retrieving inserted stock:', err);
          res.status(500).json({ message: 'Failed to retrieve inserted stock', error: err });
        });
    })
    .catch(err => {
      console.error('Check error:', err);
      res.status(500).json({ message: 'Failed to check stock in portfolio', error: err });
    });
});

app.get('/api/portfolio', async (req, res) => {
  console.log('HIT /api/portfolio with fundAmount:', req.query.fundAmount);
  try {
    // First check if we have any active stocks
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM portfolio_table pt
      JOIN security s ON pt.stock_id = s.id
      WHERE pt.is_active = 1
    `;
    const countResult = await executeQuery(checkQuery);
    
    if (!countResult || !countResult[0] || countResult[0].count === 0) {
      console.log('No active stocks found, returning empty array');
      return res.json({ portfolio: [] });
    }

    const query = `
      WITH total_weight AS (
        SELECT COALESCE(SUM(i.weight), 0) as total_index_weight
        FROM portfolio_table pt
        JOIN security s ON pt.stock_id = s.id
        LEFT JOIN indexes i ON s.security_name = i.security_name
        WHERE pt.is_active = 1
      ),
      latest_modify AS (
        SELECT 
          security_name,
          analyst_weight,
          analyst_shares,
          current_price
        FROM modify_history
        WHERE (security_name, date_added) IN (
          SELECT security_name, MAX(date_added)
          FROM modify_history
          GROUP BY security_name
        )
      )
      SELECT DISTINCT
        pt.id as portfolio_item_id,
        pt.stock_id,
        s.security_name,  
        pt.date_added,
        pt.notes,
        s.sector,
        pt.is_active,
        COALESCE(i.weight, 0) as index_weight,
        CASE 
          WHEN (SELECT total_index_weight FROM total_weight) > 0 
          THEN ROUND((COALESCE(i.weight, 0) / (SELECT total_index_weight FROM total_weight)) * ?, 2)
          ELSE 0 
        END as index_price,
        COALESCE(mh.analyst_weight, 0) as analyst_weight,
        COALESCE(mh.analyst_shares, 0) as analyst_shares,
        COALESCE(op.price, 0) as price_at_addition,
        COALESCE(op.recorded_at, pt.date_added) as price_recorded_at
      FROM security s
      LEFT JOIN portfolio_table pt ON s.id = pt.stock_id
      LEFT JOIN indexes i ON s.security_name = i.security_name
      LEFT JOIN latest_modify mh ON s.security_name = mh.security_name
      LEFT JOIN old_prices op ON s.id = op.security_id
      WHERE s.is_active = 1
      ORDER BY s.security_name ASC`;

    const fundAmount = parseFloat(req.query.fundAmount) || 0;
    console.log('Executing query with fundAmount:', fundAmount);
    const results = await executeQuery(query, [fundAmount]);
    console.log('Query results:', results);

    if (!results || results.length === 0) {
      console.log('No results found, returning empty array');
      return res.json({ portfolio: [] });
    }

    res.json({ portfolio: results });
  } catch (error) {
    console.error('Error in /api/portfolio:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve portfolio', 
      details: error.message,
      stack: error.stack 
    });
  }
});

app.get('/api/all-portfolio', (req, res) => {
  const query = `SELECT DISTINCT
                MIN(pt.id) as portfolio_item_id,
                MIN(pt.stock_id) as stock_id,
                s.security_name,  
                MAX(pt.date_added) as date_added,
                MAX(pt.notes) as notes,
                s.sector,
                MAX(pt.is_active) as is_active,
                i.weight as index_weight
            FROM pf_allocation.portfolio_table pt
            JOIN pf_allocation.security s ON pt.stock_id = s.id
            LEFT JOIN pf_allocation.indexes i ON s.security_name = i.security_name
            GROUP BY s.security_name, s.sector, i.weight
            ORDER BY s.security_name ASC`;
  executeQuery(query, [])
    .then(results => {
      res.json({ portfolio: results });
    })
    .catch(err => {
      console.error(`Error executing query: ${query}`, err);
      res.status(500).json({ message: 'Failed to retrieve portfolio', error: err });
    });
});

app.get('/api/yfinance-stocks', async (req, res) => {
  console.log('Hit /api/yfinance-stocks');
  
  // Check cache first
  const cachedData = stockCache.get('yfinance_stocks');
  if (cachedData) {
    console.log('Returning cached yfinance data');
    return res.json(cachedData);
  }

  const python = spawn('python', ['fetch_stocks.py']);
  let data = '';
  let error = '';

  python.stdout.on('data', (chunk) => {
    data += chunk.toString();
  });

  python.stderr.on('data', (chunk) => {
    error += chunk.toString();
  });

  python.on('close', (code) => {
    if (code !== 0) {
      console.error('Python error:', error);
      return res.status(500).json({ message: 'Python script error', error });
    }

    try {
      const parsed = JSON.parse(data);
      // Store in cache
      stockCache.set('yfinance_stocks', parsed);
      res.json(parsed);
    } catch (err) {
      console.error('JSON parse error', err);
      res.status(500).json({ message: 'JSON parse error', error: err.message });
    }
  });
});

app.post('/api/upload-index-weights', (req, res) => {
  const indexWeights = req.body;
  
  if (!Array.isArray(indexWeights)) {
    return res.status(400).json({ error: 'Invalid data format. Expected an array of index weights.' });
  }

  // First, get all security IDs
  const getSecurityIdsQuery = 'SELECT id, security_name FROM security';
  executeQuery(getSecurityIdsQuery)
    .then(securities => {
      // Create a map of security names to IDs
      const securityMap = {};
      securities.forEach(security => {
        securityMap[security.security_name] = security.id;
      });

      // Process the index weights
      const values = indexWeights.map(weight => {
        const securityId = securityMap[weight.security_name];
        return [
          weight.date || new Date().toISOString().split('T')[0],
          weight.weight,
          securityId,
          weight.security_name
        ];
      });

      const query = 'INSERT INTO indexes (date, weight, security_id, security_name) VALUES ?';
      
      executeQuery(query, [values])
        .then(result => {
          res.json({ message: 'Index weights uploaded successfully', result });
        })
        .catch(err => {
          console.error('Error inserting index weights:', err);
          res.status(500).json({ error: 'Failed to insert index weights' });
        });
    })
    .catch(err => {
      console.error('Error fetching security IDs:', err);
      res.status(500).json({ error: 'Failed to fetch security IDs' });
    });
});

app.get('/api/portfolio-prices', async (req, res) => {
  console.log('HIT /api/portfolio-prices');
  try {
    // First check if Python script exists
    const pythonScriptPath = path.join(__dirname, 'fetch_stocks.py');
    if (!existsSync(pythonScriptPath)) {
      console.error('Python script not found at:', pythonScriptPath);
      return res.status(500).json({ error: 'Python script not found' });
    }

    const query = `
      SELECT DISTINCT s.security_name
      FROM portfolio_table pt
      JOIN security s ON pt.stock_id = s.id
      WHERE pt.is_active = 1
    `;

    console.log('Executing query:', query);
    const results = await executeQuery(query);
    console.log('Query results:', results);

    // Map stock names to their Google Finance symbols
    const symbolMap = {
      'NTPC Ltd': 'NTPC',
      'Power Grid Corporation of India Ltd': 'POWERGRID',
      'Tata Power Co Ltd': 'TATAPOWER',
      'Adani Power Ltd': 'ADANIPOWER',
      'Adani Energy Solutions Ltd': 'ADANIENSOL',
      'Adani Green Energy Ltd': 'ADANIGREEN',
      'JSW Energy Ltd': 'JSWENERGY',
      'Torrent Power Ltd': 'TORNTPOWER',
      'NHPC Ltd': 'NHPC',
      'CESC Ltd': 'CESC',
      'Jaiprakash Power Ventures Ltd': 'JPPOWER',
      'NLC India Ltd': 'NLCINDIA',
      'SJVN Ltd': 'SJVN'
    };

    // Create reverse mapping for lookup
    const reverseSymbolMap = Object.entries(symbolMap).reduce((acc, [key, value]) => {
      acc[value] = key;
      return acc;
    }, {});

    const stockNames = results.map(row => {
      const mappedSymbol = symbolMap[row.security_name] || row.security_name;
      return mappedSymbol;
    });

    console.log('Stock names to fetch:', stockNames);
    
    if (stockNames.length === 0) {
      console.log('No active stocks found in portfolio');
      return res.json([]);
    }

    // Use Python script to fetch stock prices
    console.log('Spawning Python process...');
    const pythonProcess = spawn('python', ['fetch_stocks.py'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let outputData = '';
    let errorData = '';

    // Handle stdout
    pythonProcess.stdout.on('data', (data) => {
      console.log('Python stdout:', data.toString());
      outputData += data.toString();
    });

    // Handle stderr
    pythonProcess.stderr.on('data', (data) => {
      console.log('Python stderr:', data.toString());
      errorData += data.toString();
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      console.log('Python process closed with code:', code);
      if (code !== 0) {
        console.error('Python process failed with code:', code);
        console.error('Python error output:', errorData);
        return res.status(500).json({ 
          error: 'Python process failed', 
          details: errorData 
        });
      }

      try {
        // Parse the output data
        const prices = JSON.parse(outputData);
        console.log('Parsed prices:', prices);

        // Map the prices back to the original stock names and ensure current_price is a number
        const mappedPrices = prices.map(priceData => {
          // Get the original security name from the reverse mapping
          const originalName = reverseSymbolMap[priceData.security_name] || priceData.security_name;
          
          // Ensure current_price is a number and round to 2 decimal places
          const currentPrice = parseFloat(priceData.current_price);
          
          return {
            stock_name: originalName,
            current_price: isNaN(currentPrice) ? 0 : Number(currentPrice.toFixed(2))
          };
        });

        console.log('Mapped prices:', mappedPrices);
        res.json(mappedPrices);
      } catch (error) {
        console.error('Error parsing Python output:', error);
        console.error('Raw output:', outputData);
        res.status(500).json({ 
          error: 'Failed to parse Python output', 
          details: error.message,
          raw_output: outputData
        });
      }
    });

    // Handle process errors
    pythonProcess.on('error', (error) => {
      console.error('Error spawning Python process:', error);
      res.status(500).json({ 
        error: 'Failed to spawn Python process', 
        details: error.message 
      });
    });

    // Send stock names to Python script
    pythonProcess.stdin.write(JSON.stringify(stockNames));
    pythonProcess.stdin.end();

  } catch (error) {
    console.error('Error in /api/portfolio-prices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch portfolio prices', 
      details: error.message,
      stack: error.stack 
    });
  }
});

app.get('/api/index-weights', (req, res) => {
  const query = `
    SELECT i.id, i.security_name, i.weight, s.sector
    FROM indexes i
    LEFT JOIN security s ON i.security_id = s.id
    ORDER BY i.weight DESC
  `;
  
  executeQuery(query, [])
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error('Error fetching index weights:', err);
      res.status(500).json({ error: 'Failed to fetch index weights' });
    });
});

app.post('/api/save-modify-data', async (req, res) => {
  try {
    const stocks = req.body;

    // Begin transaction
    await new Promise((resolve, reject) => {
      executeQuery('START TRANSACTION');
      resolve();
    });

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

      // Ensure analyst_shares is passed as is without any conversion
      const values = [
        stock.security_name,
        stock.sector,
        stock.currentPrice,
        stock.index_weight,
        stock.index_shares,
        stock.index_price_per_share,
        stock.index_price,
        stock.analyst_weight,
        stock.analyst_shares, // Pass the raw value
        stock.analyst_price_per_share,
        stock.analyst_price,
        stock.stance,
        stock.notes
      ];

      await executeQuery(query, values);
    }

    // Commit transaction
    await new Promise((resolve, reject) => {
      executeQuery('COMMIT');
      resolve();
    });

    res.json({ message: 'Data saved successfully' });
  } catch (error) {
    // Rollback transaction if there was an error
    await new Promise((resolve, reject) => {
      executeQuery('ROLLBACK');
      console.error('Transaction rolled back due to error:', error);
      resolve();
    });
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Add endpoint to get latest modify history data
app.get('/api/modify-history', (req, res) => {
  const query = `
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
      date_added
    FROM modify_history
    WHERE (security_name, date_added) IN (
      SELECT security_name, MAX(date_added)
      FROM modify_history
      GROUP BY security_name
    )
    ORDER BY security_name ASC
  `;

  executeQuery(query, [])
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error('Error fetching modify history:', err);
      res.status(500).json({ error: 'Failed to fetch modify history' });
    });
});

app.put('/api/modify-stocks', (req, res) => {
  const stocks = req.body;
  if (!Array.isArray(stocks)) {
    return res.status(400).json({ error: 'Invalid data format. Expected an array of stocks.' });
  }

  const updatePromises = stocks.map(stock => {
    const query = `
      UPDATE modify_history
      SET analyst_weight = ?, analyst_shares = ?
      WHERE id = ?
    `;
    return new Promise((resolve, reject) => {
      executeQuery(query, [
        stock.analyst_weight || 0,
        stock.analyst_shares || 0,
        stock.portfolio_item_id
      ])
        .then(() => {
          resolve();
        })
        .catch(err => {
          console.error('Error updating stock:', err);
          reject(err);
        });
    });
  });

  Promise.all(updatePromises)
    .then(() => {
      res.json({ message: 'Stocks updated successfully' });
    })
    .catch(error => {
      console.error('Error updating stocks:', error);
      res.status(500).json({ error: 'Failed to update stocks' });
    });
});

// Add new endpoint for fetching most recent modify data
app.get('/api/latest-modify-data', async (req, res) => {
  console.log('HIT /api/latest-modify-data');
  try {
    // First check if we have any data in modify_history
    const checkQuery = 'SELECT COUNT(*) as count FROM modify_history';
    const countResult = await executeQuery(checkQuery);
    
    if (!countResult || !countResult[0] || countResult[0].count === 0) {
      console.log('No modify history data found, returning empty array');
      return res.json([]);
    }

    const query = `
      SELECT 
        m1.*,
        COALESCE(m1.analyst_weight, 0) as analyst_weight,
        COALESCE(m1.analyst_shares, 0) as analyst_shares,
        COALESCE(m1.current_price, 0) as current_price,
        COALESCE(m1.index_weight, 0) as index_weight,
        COALESCE(m1.index_shares, 0) as index_shares,
        COALESCE(m1.index_price_per_share, 0) as index_price_per_share,
        COALESCE(m1.index_price, 0) as index_price,
        COALESCE(m1.analyst_price_per_share, 0) as analyst_price_per_share,
        COALESCE(m1.analyst_price, 0) as analyst_price
      FROM modify_history m1
      INNER JOIN (
        SELECT security_name, MAX(date_added) as latest_date
        FROM modify_history
        GROUP BY security_name
      ) m2
      ON m1.security_name = m2.security_name
      AND m1.date_added = m2.latest_date
      ORDER BY m1.security_name`;

    console.log('Executing query:', query);
    const results = await executeQuery(query);
    console.log('Query results:', results);

    if (!results || results.length === 0) {
      console.log('No results found, returning empty array');
      return res.json([]);
    }

    res.json(results);
  } catch (error) {
    console.error('Error in /api/latest-modify-data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch latest modify data', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// Add endpoint to get modify history list with timestamps
app.get('/api/modify-history-list', (req, res) => {
  const query = `
    SELECT 
      DATE_FORMAT(date_added, '%Y-%m-%d %H:%i:%s') as timestamp,
      GROUP_CONCAT(DISTINCT security_name) as stock_names,
      GROUP_CONCAT(DISTINCT notes) as notes,
      MIN(id) as id,
      SUM(analyst_price) as new_value,
      (
        SELECT SUM(analyst_price)
        FROM modify_history m2
        WHERE m2.date_added < m1.date_added
        AND m2.security_name IN (SELECT DISTINCT security_name FROM modify_history WHERE date_added = m1.date_added)
        AND m2.date_added = (
          SELECT MAX(date_added)
          FROM modify_history m3
          WHERE m3.date_added < m1.date_added
          AND m3.security_name = m2.security_name
        )
      ) as old_value
    FROM modify_history m1
    GROUP BY date_added
    ORDER BY date_added DESC
  `;

  executeQuery(query, [])
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.error('Error fetching modify history list:', err);
      res.status(500).json({ error: 'Failed to fetch modify history list' });
    });
});

// Add endpoint to get modify history details for a specific timestamp
app.get('/api/modify-history-details/:timestamp', (req, res) => {
  const timestamp = req.params.timestamp;
  const query = `
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
  `;

  executeQuery(query, [timestamp])
    .then(results => {
      res.json({
        timestamp: timestamp,
        details: results
      });
    })
    .catch(err => {
      console.error('Error fetching modify history details:', err);
      res.status(500).json({ error: 'Failed to fetch modify history details' });
    });
});

// Debug endpoint to check database state
app.get('/api/debug/db-state', async (req, res) => {
  try {
    const queries = {
      security: 'SELECT * FROM security',
      portfolio: 'SELECT * FROM portfolio_table',
      indexes: 'SELECT * FROM indexes',
      modify_history: 'SELECT * FROM modify_history',
      old_prices: 'SELECT * FROM old_prices'
    };

    const results = {};
    for (const [table, query] of Object.entries(queries)) {
      try {
        results[table] = await executeQuery(query);
      } catch (err) {
        results[table] = { error: err.message };
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: 'Debug endpoint failed', details: error.message });
  }
});

// Add error handler for Express
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Database config:', {
    host: pool.config.connectionConfig.host,
    user: pool.config.connectionConfig.user,
    database: pool.config.connectionConfig.database
  });
});