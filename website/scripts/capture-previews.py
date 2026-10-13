#!/usr/bin/env python3
"""Capture local historical previews with the agent-browser CLI."""
import argparse, json, re, shutil, subprocess
from pathlib import Path
root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:8047')
args = parser.parse_args()
catalog = json.loads((root/'assets/catalog.js').read_text().removeprefix('window.DESIGN_CATALOG = ').removesuffix(';\n'))
out = root/'assets/previews'
out.mkdir(exist_ok=True)
def browser(*commands, input=None):
    result = subprocess.run(['agent-browser','--session','design-thumbnails',*commands],capture_output=True,text=True,check=True,input=input)
    return result.stdout
browser('open', args.url)
browser('set','viewport','1200','760')
items = [e for e in catalog['entries'] if e['previews']]
for i, entry in enumerate(items,1):
    mode = 'dark' if re.search(r'\bdark\b|black canvas|void-black|near-black', entry['description'], re.I) else 'light'
    path = entry['previews'].get(mode,entry['previews']['light'])
    # Render the exact local HTML in the browser without waiting for navigation.
    html = (root/path).read_text()
    browser('eval','--stdin',input='document.open(); document.write(' + json.dumps(html) + '); document.close(); document.documentElement.style.overflow = \"hidden\"; window.scrollTo(0, 0);')
    screenshot = browser('screenshot','--screenshot-dir',str(root/'.context'))
    source = re.search(r'Screenshot saved to (.+)',screenshot).group(1).strip()
    shutil.move(source,out/f'{entry["slug"]}.png')
    print(f'{i}/{len(items)} {entry["slug"]} ({mode})',flush=True)
browser('close')
