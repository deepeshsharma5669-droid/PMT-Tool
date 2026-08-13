import os, json, sys, requests
from dotenv import dotenv_values

env = dotenv_values('/app/.env.local')
URL = env['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
KEY = env['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json',
     'Prefer': 'return=representation'}

def get(path, params=None):
    r = requests.get(f'{URL}/rest/v1/{path}', headers=H, params=params)
    return r.status_code, (r.json() if r.text else None)

def post(path, body):
    r = requests.post(f'{URL}/rest/v1/{path}', headers=H, json=body)
    return r.status_code, (r.json() if r.text else None)

def delete(path, params):
    r = requests.delete(f'{URL}/rest/v1/{path}', headers=H, params=params)
    return r.status_code, (r.text[:300])

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'inspect':
        for t in ['clients', 'projects', 'deliverables', 'deliverable_stages', 'managers']:
            sc, d = get(t, {'limit': '2'})
            print('===', t, sc)
            print(json.dumps(d, indent=1, default=str)[:1500])
    elif cmd == 'create':
        print(post('clients', {'name': 'PMT-TEST Client'}))
    elif cmd == 'cleanup':
        print(delete('deliverable_stages', {'stage_name': 'like.PMT-TEST*'}))
