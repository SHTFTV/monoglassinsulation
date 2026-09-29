"""Run before deployment: cards must belong to explicit city assignments."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]/'public'
config=json.loads((root/'city-contractor-assignments.json').read_text())
for page in root.rglob('index.html'):
 route='/'+str(page.relative_to(root)).replace('index.html','')
 text=page.read_text();assigned=config['cityAssignments'].get(route)
 assert ('<aside class="business-floater"' in text)==bool(assigned),f'Incorrect card scope: {route}'
 if assigned:
  provider=config['providers'][assigned]
  assert 'mailto:'+provider['email'] in text and 'tel:'+provider['phone'] in text,route
print('Contact cards match explicit city assignments; general pages have no contractor floater.')

for page in root.rglob('index.html'):
    text=page.read_text()
    route='/'+str(page.relative_to(root)).replace('index.html','')
    if route not in config['cityAssignments']:
        assert 'Independent insulation planning information for the Lower Mainland.' not in text, f'Regional site identity: {page}'
        assert 'Discuss your project with Performance' not in text, f'Client CTA on general page: {route}'
home=(root/'index.html').read_text()
for phrase in ['From Metro Vancouver to the Fraser Valley', 'Planning | Lower Mainland', '27 local planning pages']:
    assert phrase not in home, f'Regional homepage scope: {phrase}'
assert 'Industry Army Marketing (IAM)' in home
print('IAM-wide identity and local-client separation pass.')
