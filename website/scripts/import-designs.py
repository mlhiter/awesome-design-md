#!/usr/bin/env python3
"""Import pinned local upstream snapshots; requires only Python's standard library."""
import argparse, json, re, shutil, subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--current', type=Path, default=root / '.context/upstream/current')
parser.add_argument('--historical', type=Path, default=root / '.context/upstream/historical')
args = parser.parse_args()
labels = {'AI & LLM Platforms':'AI 与大模型','Developer Tools & IDEs':'开发工具','Backend, Database & DevOps':'后端与数据库','Productivity & SaaS':'效率与 SaaS','Design & Creative Tools':'设计与创意','Fintech & Crypto':'金融与加密','E-commerce & Retail':'电商与零售','Media & Consumer Tech':'媒体与消费科技','Automotive':'汽车','Retro Web · DESIGN.md Nostalgia':'复古互联网'}
metadata = {}
category = '其他'
for line in (args.current / 'README.md').read_text().splitlines():
    if line.startswith('### '):
        category = labels.get(line[4:], line[4:])
    match = re.match(r'- \[\*\*(.*?)\*\*\]\(https://getdesign.md/([^/]+)/design-md\) - (.*)', line)
    if match:
        name, slug, description = match.groups()
        metadata[slug] = dict(name=name, category=category, description=description)
entries = []
for source in sorted((args.current / 'design-md').glob('*/DESIGN.md')):
    slug = source.parent.name
    target = root / 'designs' / slug
    target.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target / 'DESIGN.md')
    text = source.read_text()
    color_section = re.search(r'\ncolors:\n(.*?)(?=\n\w[^\n]*:\n|\n---)', text, re.S)
    colors = []
    if color_section:
        for role, value in re.findall(r'^  ([\w-]+):\s*[\"\x27]?(#[0-9a-fA-F]{3,8})', color_section[1], re.M):
            if len(value) in (4, 7) and value.lower() not in [c['value'].lower() for c in colors]:
                colors.append(dict(role=role, value=value))
    if not colors:
        for value in dict.fromkeys(re.findall(r'#[0-9a-fA-F]{6}\b', text)):
            colors.append(dict(role='color', value=value))
    previews = {}
    for mode, filename in [('light', 'preview.html'), ('dark', 'preview-dark.html')]:
        historical = args.historical / 'design-md' / slug / filename
        if historical.exists():
            html = historical.read_text()
            # Remove remote font and avatar requests; retain text attribution.
            html = re.sub(r'<link\b[^>]*href=[\"\x27]https?://[^>]*>', '', html, flags=re.I)
            html = re.sub(r'<img\b[^>]*src=[\"\x27]https?://[^>]*>', '', html, flags=re.I)
            html = html.replace('<head>', '<head>\n<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; font-src \'none\'; script-src \'none\'">', 1)
            (target / filename).write_text(html)
            previews[mode] = f'designs/{slug}/{filename}'
        elif (target / filename).exists():
            (target / filename).unlink()
    meta = metadata.get(slug, dict(name=slug.title(), category='其他', description='Design system reference.'))
    entries.append(dict(slug=slug, **meta, colors=colors[:12], previews=previews, document=f'designs/{slug}/DESIGN.md'))
shutil.copyfile(args.current / 'LICENSE', root / 'LICENSE')
def sha(path):
    return subprocess.check_output(['git', '-C', str(path), 'rev-parse', 'HEAD'], text=True).strip()
catalog = dict(entries=entries, sources=[dict(repository='mlhiter/awesome-design-md', commit=sha(args.current)), dict(repository='Meliwat/awesome-design-md-pre-paywall', commit=sha(args.historical))])
(root / 'assets/catalog.js').write_text('window.DESIGN_CATALOG = ' + json.dumps(catalog, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(f'Imported {len(entries)} documents, {sum(bool(e["previews"]) for e in entries)} preview pairs.')
