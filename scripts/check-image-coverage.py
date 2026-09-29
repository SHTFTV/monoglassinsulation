"""Reject missing, uncredited or broken material imagery before publication."""
from pathlib import Path
from html.parser import HTMLParser
import json

root = Path(__file__).resolve().parents[1] / 'public'
sources = json.loads((root / 'images/material-photo-sources.json').read_text())
known = {photo['path'] for photo in sources.values()}
expected = json.loads((Path(__file__).parent / 'image-coverage.json').read_text())

class Images(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []
    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            self.images.append(dict(attrs))

pages = list(root.rglob('*.html'))
for page in pages:
    route = '/' + page.relative_to(root).as_posix().replace('index.html', '')
    count = expected.get(route, 1)
    text = page.read_text()
    parser = Images()
    parser.feed(text)
    assert len(parser.images) >= count > 0, f'{route}: missing imagery'
    assert 'class="page-photo-explanation"' in text, f'{route}: missing contextual caption'
    for image in parser.images:
        assert all(image.get(k) for k in ['src', 'alt', 'width', 'height']), route
        assert (root / image['src'].lstrip('/')).is_file(), image['src']
        if image['src'] in known:
            assert 'WeSprayIt.ca' in text or 'manufacturer' in text, route
    if route.startswith('/cities/'):
        assert 'pictured project’s location is not recorded' in text, route
print(f'Image and contextual caption checks pass for all {len(pages)} HTML pages, including 27 city pages.')
