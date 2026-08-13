import json, sys
sys.path.insert(0, '/app/test_reports')
from fixtures import get, post, delete

def create():
    sc, c = post('clients', {'name': 'PMT-TEST Client', 'account_manager': 'QA', 'status': 'Active'})
    print('client', sc, c)
    cid = c[0]['id']
    sc, p = post('projects', {'project_name': 'PMT-TEST Phase5 QA', 'client_name': 'PMT-TEST Client',
                              'client_id': cid, 'deliverables': 1, 'content_format': 'Infographic',
                              'status': 'New', 'priority': 'Medium'})
    print('project', sc, p)
    pid = p[0]['id']
    sc, d = post('deliverables', {'project_id': pid, 'sequence_id': 1, 'name': 'PMT-TEST Deliverable',
                                  'content_format': 'Infographic'})
    print('deliv', sc, d)
    did = d[0]['id']
    sc, s = post('deliverable_stages', [
        {'deliverable_id': did, 'stage_name': 'Content', 'status': 'complete', 'stage_order': 1, 'department': 'Content'},
        {'deliverable_id': did, 'stage_name': 'Design', 'status': 'pending', 'stage_order': 2, 'department': 'Design'},
    ])
    print('stages', sc, s)
    ids = {'client_id': cid, 'project_id': pid, 'deliverable_id': did,
           'stages': {r['stage_name']: r['id'] for r in s}}
    json.dump(ids, open('/app/test_reports/fixture_ids.json', 'w'), indent=1)
    print(ids)

def cleanup():
    ids = json.load(open('/app/test_reports/fixture_ids.json'))
    print(delete('deliverable_stages', {'deliverable_id': f"eq.{ids['deliverable_id']}"}))
    print(delete('deliverables', {'id': f"eq.{ids['deliverable_id']}"}))
    print(delete('projects', {'id': f"eq.{ids['project_id']}"}))
    print(delete('clients', {'id': f"eq.{ids['client_id']}"}))

def show():
    ids = json.load(open('/app/test_reports/fixture_ids.json'))
    print(json.dumps(get('deliverable_stages', {'select': '*', 'deliverable_id': f"eq.{ids['deliverable_id']}", 'order': 'stage_order'})[1], indent=1))

if __name__ == '__main__':
    {'create': create, 'cleanup': cleanup, 'show': show}[sys.argv[1]]()
