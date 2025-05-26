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
        # Format the symbol for Google Finance URL
        formatted_symbol = symbol.replace(' ', '').upper()
        url = f"https://www.google.com/finance/quote/{formatted_symbol}:NSE"
        
        print(f"Fetching data for {formatted_symbol} from {url}", file=sys.stderr)
        
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
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract price data - try multiple selectors
        price_selectors = [
            ('div', {'class': 'YMlKec fxKbKc'}),
            ('div', {'class': 'YMlKec'}),
            ('div', {'class': 'kf1m0'}),
            ('div', {'class': 'kf1m0', 'data-field': 'regularMarketPrice'})
        ]
        
        current_price = 0
        for tag, selector in price_selectors:
            price_element = soup.find(tag, selector)
            if price_element:
                current_price = clean_price(price_element.text)
                if current_price > 0:
                    print(f"Found current price using selector {selector}: {current_price}", file=sys.stderr)
                    break
        
        if current_price == 0:
            print(f"No price found for {symbol} using any selector", file=sys.stderr)
            return {
                "security_name": symbol,
                "current_price": 0,
                "error": "No price found"
            }
            
        print(f"Found current price: {current_price}", file=sys.stderr)
        
        return {
            "security_name": symbol,
            "current_price": round(current_price, 2)
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