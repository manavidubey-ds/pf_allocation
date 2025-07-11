import sys
import pandas as pd
import json
from datetime import datetime

def process_excel(file_path):
    try:
        # Read Excel file
        df = pd.read_excel(file_path)
        
        # Validate required columns
        required_columns = ['Security Name', 'Action Type', 'Value', 'Ex Date', 'Record Date', 'Payment Date']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            print(f"Error: Missing required columns: {', '.join(missing_columns)}", file=sys.stderr)
            sys.exit(1)
        
        # Convert date columns to proper format
        date_columns = ['Ex Date', 'Record Date', 'Payment Date']
        for col in date_columns:
            df[col] = pd.to_datetime(df[col]).dt.strftime('%Y-%m-%d')
        
        # Convert DataFrame to list of dictionaries
        actions = df.to_dict('records')
        
        # Convert column names to match database schema
        for action in actions:
            action['security_name'] = action.pop('Security Name')
            action['action_type'] = action.pop('Action Type')
            action['value'] = float(action.pop('Value'))
            action['ex_date'] = action.pop('Ex Date')
            action['record_date'] = action.pop('Record Date')
            action['payment_date'] = action.pop('Payment Date')
        
        # Output JSON to stdout
        print(json.dumps(actions))
        
    except Exception as e:
        print(f"Error processing Excel file: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python process_corporate_actions.py <excel_file_path>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    process_excel(file_path) 