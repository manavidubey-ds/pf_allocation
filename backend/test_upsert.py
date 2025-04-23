import requests

url = "http://localhost:5000/api/stocks/upsert"
data = {
    "id": 22,
    "user_id": 1,
    "stock_name": "YES Bank",
    "analyst_weight": 11.00,
    "number_of_shares": 90,
    "index_weight": 6.00,
    "stance": "Hold",
    "note": "Volatile but improving financials",
    "last_closing_price": 19.75,
    "gain": 2.50
}

response = requests.post(url, json=data)
print(response.status_code)
print(response.json())
