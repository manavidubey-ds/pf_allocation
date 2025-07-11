import sys
import json
import requests
from bs4 import BeautifulSoup
import time
import re

def clean_price(price_str):
    """Clean price string by removing currency symbols and commas"""
    if not price_str:
        return 0
    # Remove currency symbols (₹, $, etc.), commas, and any whitespace
    cleaned = re.sub(r'[₹$,\s]', '', price_str)
    try:
        return float(cleaned)
    except ValueError:
        print(f"Could not convert price string to float: {price_str}", file=sys.stderr)
        return 0

def get_stock_price(symbol):
    """Get current price for a symbol from Google Finance"""
    try:
        # Map company names to NSE symbols
        symbol_map = {
            'Adani Energy Solutions Ltd': 'ADANIENSOL',
            'Adani Green Energy Ltd': 'ADANIGREEN',
            'Adani Power Ltd': 'ADANIPOWER',
            'CESC Ltd': 'CESC',
            'Jaiprakash Power Ventures Ltd': 'JPPOWER',
            'JSW Energy Ltd': 'JSWENERGY',
            'NHPC Ltd': 'NHPC',
            'NLC India Ltd': 'NLCINDIA',
            'NTPC Ltd': 'NTPC',
            'Power Grid Corporation of India Ltd': 'POWERGRID',
            'SJVN Ltd': 'SJVN',
            'Tata Power Co Ltd': 'TATAPOWER',
            'Torrent Power Ltd': 'TORNTPOWER'
        }

        # Get the NSE symbol
        nse_symbol = symbol_map.get(symbol)
        if not nse_symbol:
            print(f"No NSE symbol mapping found for {symbol}", file=sys.stderr)
            return {
                "security_name": symbol,
                "current_price": 0,
                "error": "No NSE symbol mapping"
            }

        # Format the URL for Google Finance
        url = f"https://www.google.com/finance/quote/{nse_symbol}:NSE"
        print(f"Fetching data for {symbol} ({nse_symbol}) from {url}", file=sys.stderr)
        
        # Add headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Try to find the price in the response text
        price_match = re.search(r'"regularMarketPrice":([\d.]+)', response.text)
        if price_match:
            current_price = float(price_match.group(1))
            print(f"Found price for {symbol}: {current_price}", file=sys.stderr)
            return {
                "security_name": symbol,
                "current_price": round(current_price, 2)
            }
        
        # If regex match fails, try BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')
        price_element = soup.find('div', {'class': 'YMlKec fxKbKc'})
        if price_element:
            current_price = clean_price(price_element.text)
            if current_price > 0:
                print(f"Found price using BeautifulSoup for {symbol}: {current_price}", file=sys.stderr)
                return {
                    "security_name": symbol,
                    "current_price": round(current_price, 2)
                }
        
        print(f"No price found for {symbol}", file=sys.stderr)
        return {
            "security_name": symbol,
            "current_price": 0,
            "error": "No price found"
        }
            
    except requests.exceptions.RequestException as e:
        print(f"Network error fetching {symbol}: {str(e)}", file=sys.stderr)
        return {
            "security_name": symbol,
            "current_price": 0,
            "error": f"Network error: {str(e)}"
        }
    except Exception as e:
        print(f"Error fetching {symbol}: {str(e)}", file=sys.stderr)
        return {
            "security_name": symbol,
            "current_price": 0,
            "error": str(e)
        }

def main():
    try:
        # Read stock names from stdin
        input_data = sys.stdin.read()
        print(f"Received input: {input_data}", file=sys.stderr)
        
        stock_names = json.loads(input_data)
        print(f"Parsed stock names: {stock_names}", file=sys.stderr)
        
        if not isinstance(stock_names, list):
            print(f"Error: Expected list of stock names, got {type(stock_names)}", file=sys.stderr)
            sys.exit(1)
        
        results = []
        for stock in stock_names:
            result = get_stock_price(stock)
            results.append(result)
            # Add a small delay to avoid rate limiting
            time.sleep(1)
        
        # Print results as JSON
        output = json.dumps(results)
        print(f"Sending output: {output}", file=sys.stderr)
        print(output)
    except json.JSONDecodeError as e:
        print(f"Error parsing input JSON: {str(e)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error in main: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 