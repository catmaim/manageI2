import requests
import json

url = 'https://omnvpmltbrfjhgoahqtk.supabase.co'
key = 'sb_publishable_I14K2PDCHTZXoLJbe0FrPg_lDkm5t7n'
headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def audit():
    print('--- 🛡️ Supabase Security Audit Report ---')
    
    # 1. Test Read Access
    tables = ['officers', 'tasks']
    for table in tables:
        try:
            r = requests.get(f'{url}/rest/v1/{table}?select=*', headers=headers)
            if r.status_code == 200:
                data = r.json()
                print(f'[!] ALERT: Table "{table}" is PUBLICLY READABLE.')
                print(f'    - Found {len(data)} records.')
                if len(data) > 0:
                    print(f'    - Metadata keys: {list(data[0].keys())}')
            else:
                print(f'[✓] SECURE: Table "{table}" is protected (Status {r.status_code}).')
        except Exception as e:
            print(f'[-] Error checking {table}: {e}')

    # 2. Test Write Access
    try:
        payload = {'nick_name': 'SECURITY_TEST_BOT'}
        r = requests.post(f'{url}/rest/v1/officers', headers=headers, json=payload)
        if r.status_code in [200, 201, 204]:
            print('[!!!] CRITICAL: Write access allowed without Authentication!')
            # Clean up test data if possible
            requests.delete(f'{url}/rest/v1/officers?nick_name=eq.SECURITY_TEST_BOT', headers=headers)
        else:
            print(f'[✓] SECURE: Unauthorized write access denied (Status {r.status_code}).')
    except Exception as e:
        print(f'[-] Error checking write: {e}')

if __name__ == "__main__":
    audit()
