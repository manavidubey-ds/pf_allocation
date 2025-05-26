import yfinance as yf
import json
import sys
from datetime import datetime, timedelta

def get_stock_info_with_history(stock_names, target_date_str):
    symbol_map = {
        "NTPC Ltd": "NTPC.NS",
        "Power Grid Corporation of India Ltd": "POWERGRID.NS",
        "Tata Power Co Ltd": "TATAPOWER.NS",
        "Adani Power Ltd": "ADANIPOWER.NS",
        "Adani Energy Solutions Ltd": "ADANIENSOL.NS",
        "Adani Green Energy Ltd": "ADANIGREEN.NS",
        "JSW Energy Ltd": "JSWENERGY.NS",
        "Torrent Power Ltd": "TORNTPOWER.NS",
        "NHPC Ltd": "NHPC.NS",
        "CESC Ltd": "CESC.NS",
        "Jaiprakash Power Ventures Ltd": "JPPOWER.NS",
        "NLC India Ltd": "NLCINDIA.NS",
        "SJVN Ltd": "SJVN.NS"
    }

    results = []

    for stock_name in stock_names:
        symbol = symbol_map.get(stock_name)
        if not symbol:
            results.append({
                "stock_name": stock_name,
                "error": "Symbol not found"
            })
            continue

        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            # Historical data
            data = ticker.history(start=target_date_str, end=target_date_str)

            historical_price = "N/A"
            historical_date = "N/A"
            if not data.empty:
                historical_price = data['Close'].iloc[0]
                historical_date = target_date_str
            else:
                # If market was closed on the given date, try the next day
                date_obj = datetime.strptime(target_date_str, "%Y-%m-%d")
                next_day_obj = date_obj + timedelta(days=1)
                next_day_str = next_day_obj.strftime("%Y-%m-%d")
                data_next_day = ticker.history(start=next_day_str, end=next_day_str)
                if not data_next_day.empty:
                    historical_price = data_next_day['Close'].iloc[0]
                    historical_date = next_day_str
                else:
                    # If next day also has no data, try the previous day
                    prev_day_obj = date_obj - timedelta(days=1)
                    prev_day_str = prev_day_obj.strftime("%Y-%m-%d")
                    data_prev_day = ticker.history(start=prev_day_str, end=prev_day_str)
                    if not data_prev_day.empty:
                        historical_price = data_prev_day['Close'].iloc[0]
                        historical_date = prev_day_str
                    else:
                        print(f"Warning: No price data found for {symbol} around {target_date_str}")

            results.append({
                "stock_name": stock_name,
                "stock_symbol": symbol,
                "current_price": info.get("currentPrice", "N/A"),
                "previous_close": info.get("previousClose", "N/A"),
                "day_high": info.get("dayHigh", "N/A"),
                "day_low": info.get("dayLow", "N/A"),
                "volume": info.get("volume", "N/A"),
                "historical_price": historical_price,
                "historical_date": historical_date
            })

        except Exception as e:
            results.append({
                "stock_name": stock_name,
                "stock_symbol": symbol,
                "error": str(e)
            })

    return results

if __name__ == "__main__":
    # Read stock names from stdin (JSON array input)
    stock_names_str = sys.stdin.readline().strip()
    stock_names = json.loads(stock_names_str) if stock_names_str else []

    # Read target date from stdin (JSON object input)
    target_date_data_str = sys.stdin.readline().strip()
    target_date_data = json.loads(target_date_data_str) if target_date_data_str else {}
    target_date = target_date_data.get("target_date")

    if not target_date:
        print(json.dumps({"error": "Target date not provided"}, indent=2))
        sys.exit(1)

    result = get_stock_info_with_history(stock_names, target_date)
    print(json.dumps(result, indent=2))