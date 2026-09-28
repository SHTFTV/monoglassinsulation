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
