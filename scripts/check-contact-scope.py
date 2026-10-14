"""Run before deployment: cards must belong to explicit city or article assignments."""
from pathlib import Path
import json
root = Path(__file__).resolve().parents[1] / 'public'
config = json.loads((root / 'city-contractor-assignments.json').read_text())
assignments = {**config['cityAssignments'], **config.get('articleAssignments', {})}
html_pages = list(root.rglob('*.html'))

def route_for(page):
 relative = str(page.relative_to(root))
 return '/' + relative.replace('index.html', '')

for page in html_pages:
 route = route_for(page)
 text = page.read_text()
 assigned = assignments.get(route)
 if assigned:
  provider=config['providers'][assigned]
  assert 'class="business-floater"' in text,f'Missing assigned card: {route}'
  assert 'mailto:'+provider['email'] in text and 'tel:'+provider['phone'] in text,route
 else:
  assert 'class="business-floater"' not in text,f'Unassigned business card: {route}'
  assert '<details class="contact"' not in text,f'Unassigned contact card: {route}'
print('Contact cards and provider details match explicit city and project-article assignments across all HTML pages.')

for page in html_pages:
    text=page.read_text()
    route=route_for(page)
    if route not in assignments:
        assert 'Independent insulation planning information for the Lower Mainland.' not in text, f'Regional site identity: {page}'
        assert 'Discuss your project with Performance' not in text, f'Client CTA on general page: {route}'
home=(root/'index.html').read_text()
for phrase in ['From Metro Vancouver to the Fraser Valley', 'Planning | Lower Mainland', '27 local planning pages']:
    assert phrase not in home, f'Regional homepage scope: {phrase}'
assert 'Industry Army Marketing (IAM)' in home
print('IAM-wide identity and local-client separation pass.')
