# Portfolio Allocation Tool

A comprehensive web application for managing and analyzing portfolio allocations with real-time stock price fetching, corporate actions tracking, and portfolio optimization features.

## Features

- 📊 **Portfolio Management**: Track and manage your investment portfolio
- 📈 **Real-time Stock Prices**: Automatic price fetching from Google Finance
- 🏢 **Corporate Actions**: Import and track corporate actions (splits, dividends, etc.)
- 📋 **Index Weight Analysis**: Compare portfolio weights against index weights
- 📊 **Analyst Recommendations**: Track analyst stances and recommendations
- 📁 **Data Import/Export**: Excel file upload and data export capabilities
- 🔄 **Historical Tracking**: Maintain history of portfolio modifications
- 📱 **Responsive UI**: Modern React-based interface with Material-UI

## Prerequisites

Before running this application, ensure you have the following installed:

### Required Software
- **Node.js** (version 14.0.0 or higher)
- **Python 3** (version 3.7 or higher)
- **MySQL** (version 8.0 or higher)
- **npm** (comes with Node.js)

### Python Dependencies
The application uses Python scripts for stock price fetching. Install the required Python packages:

```bash
pip install requests beautifulsoup4
```

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pf_allocation
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Set Up MySQL Database

#### Option A: Using the provided SQL script
```bash
mysql -u root -p < backend/setup_database.sql
```

#### Option B: Manual setup
1. Create a MySQL database named `pf_allocation`
2. Run the SQL commands from `backend/setup_database.sql`

### 4. Configure Database Connection

Update the database connection settings in `server.js` (lines 25-31):

```javascript
const db = mysql.createPool({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'pf_allocation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

## Running the Application

### Development Mode (Recommended)

Run both the backend server and frontend development server simultaneously:

```bash
npm run dev-full
```

This command will:
- Start the Express.js backend server on port 5002
- Start the Vite development server for the React frontend
- Enable hot reloading for both frontend and backend

### Alternative Commands

#### Backend Only
```bash
npm run dev
```

#### Frontend Only
```bash
npm run client
```

#### Production Build
```bash
npm run build
npm start
```

## Application Structure

```
pf_allocation/
├── backend/                 # Backend Python scripts
│   ├── fetch_stocks.py     # Stock price fetching script
│   ├── setup_database.sql  # Database schema
│   └── ...
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/             # Application pages
│   └── ...
├── uploads/               # File upload directory
├── server.js              # Express.js backend server
├── package.json           # Node.js dependencies
└── vite.config.js         # Vite configuration
```

## API Endpoints

The application provides the following API endpoints:

- `GET /api/portfolio` - Fetch portfolio data with current prices
- `GET /api/dashboard` - Get dashboard statistics
- `POST /api/upload` - Upload Excel files
- `GET /api/corporate-actions` - Fetch corporate actions data
- `POST /api/modify-portfolio` - Modify portfolio allocations

## Database Schema

The application uses the following main tables:

- `security` - Stock/security information
- `portfolio_table` - Portfolio holdings
- `indexes` - Index weight data
- `modify_history` - Portfolio modification history
- `old_prices` - Historical price data

## Stock Price Fetching

The application automatically fetches real-time stock prices using:
- **Google Finance API** via web scraping
- **NSE (National Stock Exchange)** symbols
- **Automatic retry** and **fallback mechanisms**

Supported stocks include major Indian power sector companies like:
- Adani Energy Solutions, Adani Green Energy, Adani Power
- CESC, JSW Energy, NHPC, NTPC
- Power Grid Corporation, Tata Power, Torrent Power
- And more...

## File Upload

The application supports Excel file uploads for:
- Portfolio data import
- Corporate actions data
- Index weight updates

Supported formats: `.xlsx`, `.xls`

