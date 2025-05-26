import yahooFinance from 'yahoo-finance2';

app.get('/api/yfinance-stocks', async (req, res) => {
  try {
    const symbols = [
      'NTPC.NS',
      'POWERGRID.NS',
      'TATAPOWER.NS',
      'ADANIPOWER.NS',
      'ADANIENSOL.NS',
      'ADANIGREEN.NS',
      'JSWENERGY.NS',
      'TORNTPOWER.NS',
      'NHPC.NS',
      'CESC.NS',
      'JPPOWER.NS',
      'NLCINDIA.NS',
      'SJVN.NS',
    ];

    const stockData = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const quote = await yahooFinance.quote(symbol);
          return {
            symbol,
            name: quote.shortName,
            price: quote.regularMarketPrice,
          };
        } catch (e) {
          console.error(`Error fetching ${symbol}:`, e.message);
          return null;
        }
      })
    );

    res.json(stockData.filter(Boolean));
  } catch (err) {
    console.error('YFinance error:', err.message);
    res.status(500).json({ error: 'Failed to fetch YFinance data' });
  }
});
