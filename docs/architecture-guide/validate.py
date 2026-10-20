"""Static checks for the generated documentation; no production requests."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import json
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]


class GuideParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.anchors = []
        self.external_resources = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if 'id' in values:
            self.ids.append(values['id'])
        if tag == 'a' and values.get('href', '').startswith('#'):
            self.anchors.append(values['href'][1:])
        resource = values.get('src') if tag in ('script', 'img', 'iframe') else values.get('href') if tag == 'link' else None
        if resource and resource.startswith(('http:', 'https:', '//')):
            self.external_resources.append(resource)


page = (HERE / 'index.html').read_text(encoding='utf-8')
script = (HERE / 'guide.js').read_text(encoding='utf-8')
parser = GuideParser()
parser.feed(page)
duplicates = [name for name, count in Counter(parser.ids).items() if count > 1]
missing_anchors = [name for name in parser.anchors if name and name not in parser.ids]
paths = re.findall(r"path:'([^']+)'", script)
missing_paths = [path for path in paths if not (ROOT / path).exists()]
secret_like_tokens = re.findall(r'\b(?:sbp_|vcp_|re_)[A-Za-z0-9_\-]{20,}', page)
assert not duplicates, duplicates
assert not missing_anchors, missing_anchors
assert not missing_paths, missing_paths
assert not parser.external_resources, parser.external_resources
assert not secret_like_tokens, 'Secret-like token found'
assert '/storage/v1/object/sign/' not in page, 'Signed URL found'
assert not re.search(r'__[A-Z_]+__', page), 'Unresolved template marker'
print(json.dumps({
    'html_bytes': len(page.encode()),
    'unique_ids': len(parser.ids),
    'internal_anchors': len(parser.anchors),
    'source_references': len(paths),
    'missing_references': len(missing_paths),
    'external_runtime_resources': len(parser.external_resources),
    'static_checks': 'passed',
}, indent=2))
