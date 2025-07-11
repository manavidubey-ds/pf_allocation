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

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `server.js`
   - Ensure database `pf_allocation` exists

2. **Python Script Errors**
   - Verify Python 3 is installed: `python3 --version`
   - Install required packages: `pip install requests beautifulsoup4`
   - Check Python path in `server.js`

3. **Port Already in Use**
   - Change port in `server.js` (line 18)
   - Kill existing processes using the port

4. **Stock Price Fetching Issues**
   - Check internet connection
   - Verify stock symbols in `fetch_stocks.py`
   - Check for rate limiting from Google Finance

### Logs

The application provides detailed logging:
- Backend logs in the terminal running `npm run dev`
- Frontend logs in the browser console
- Python script logs in the backend terminal

## Development

### Adding New Stocks

1. Update the symbol mapping in `backend/fetch_stocks.py`
2. Add the stock to the database via the web interface
3. Test price fetching for the new stock

### Customizing the UI

The frontend uses:
- **React 19** with hooks
- **Material-UI** for components
- **React Router** for navigation
- **Axios** for API calls

### Environment Variables

Create a `.env` file for environment-specific configuration:

```env
PORT=5002
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pf_allocation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Create an issue in the repository

---

**Note**: This application is designed for educational and personal portfolio management purposes. Always verify data accuracy and consult with financial advisors for investment decisions.
