import requests
import json

url = "https://omnvpmltbrfjhgoahqtk.supabase.co/rest/v1/system_logs?select=*&order=created_at.desc&limit=5"
headers = {
    "apikey": "sb_publishable_I14K2PDCHTZXoLJbe0FrPg_lDkm5t7n",
    "Authorization": "Bearer sb_publishable_I14K2PDCHTZXoLJbe0FrPg_lDkm5t7n"
}

response = requests.get(url, headers=headers)
if response.status_code == 200:
    logs = response.json()
    for log in logs:
        print(f"Time: {log.get('created_at')}")
        print(f"Message: {log.get('message')}")
        print(f"Details: {json.dumps(log.get('details'), indent=2, ensure_ascii=False)}")
        print("-" * 30)
else:
    print(f"Error: {response.status_code}")
    print(response.text)
