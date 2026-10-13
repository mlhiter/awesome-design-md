'use strict';
const $ = (selector) => document.querySelector(selector);
const entries = window.DESIGN_CATALOG.entries;
const featured = ['claude', 'linear.app', 'apple', 'stripe', 'vercel', 'notion', 'supabase', 'figma', 'airbnb'];
const state = { category: '全部', query: '', previewOnly: false, sort: 'featured', selected: null, mode: 'light', tab: 'preview', document: '', request: 0 };
const documents = new Map();
let toastTimer;
let previewObserver;
let previewResize;
let previewMeasure;

function clearPreviewSizing() {
  previewObserver?.disconnect();
  previewResize?.disconnect();
  previewMeasure = null;
}

// Same-origin previews expand into the dialog instead of creating a second
// scrolling viewport. Re-measure when content or the available width changes.
$('#preview-frame').addEventListener('load', () => {
  clearPreviewSizing();
  const frame = $('#preview-frame');
  if (!frame.hasAttribute('src')) return;
  const doc = frame.contentDocument;
  if (!doc?.body) return;
  doc.documentElement.style.overflow = 'hidden';
  doc.body.style.overflow = 'hidden';
  let measuring = false;
  const measure = () => {
    if (measuring || frame.hidden || $('#preview-panel').hidden || !$('#detail').open) return;
    measuring = true;
    // Collapse first so viewport-relative minimum heights can also shrink.
    frame.style.height = '1px';
    const height = Math.max(doc.body.scrollHeight, doc.body.offsetHeight, doc.documentElement.scrollHeight);
    frame.style.height = `${height + 2}px`;
    measuring = false;
  };
  previewMeasure = measure;
  measure();
  previewObserver = new ResizeObserver(measure);
  previewObserver.observe(doc.body);
  let previousWidth = frame.clientWidth;
  previewResize = new ResizeObserver(() => {
    if (frame.clientWidth === previousWidth) return;
    previousWidth = frame.clientWidth;
    measure();
  });
  previewResize.observe(frame);
  doc.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;
    const hash = anchor.getAttribute('href').slice(1);
    const target = hash ? doc.getElementById(decodeURIComponent(hash)) : doc.body;
    if (!target) return;
    event.preventDefault();
    const dialog = $('#detail');
    const top = frame.getBoundingClientRect().top + target.getBoundingClientRect().top
      - dialog.getBoundingClientRect().top + dialog.scrollTop;
    dialog.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
});
const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function contrast(hex) {
  const full = hex.length === 4 ? '#' + [...hex.slice(1)].map(c => c + c).join('') : hex;
  const rgb = full.slice(1).match(/../g).map(c => parseInt(c,16)/255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4);
  return rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722 > .179 ? '#161b27' : '#ffffff';
}
function theme(entry, dark = false) {
  const color = (roles, fallback) => entry.colors.find(c => roles.includes(c.role))?.value || fallback;
  const accent = color(['primary', 'accent', 'brand', 'brand-primary'], entry.colors[0]?.value || '#315ee8');
  const canvas = dark ? color(['surface-dark', 'surface-black', 'canvas-dark', 'background-dark'], '#192134') : color(['canvas','background','surface','surface-white'], '#f0f3f9');
  const font = ['claude','notion','oura','mastercard','wired'].includes(entry.slug) ? 'Georgia,serif' : '"Avenir Next","Segoe UI",sans-serif';
  return `--accent:${accent};--canvas:${canvas};--text:${contrast(canvas)};--on-accent:${contrast(accent)};--font:${font};--button-radius:${['vercel','spacex','renault','ibm'].includes(entry.slug) ? '2px' : '20px'};`;
}
function renderCategories() {
  const categories = ['全部', ...new Set(entries.map(e => e.category))];
  $('#categories').innerHTML = categories.map(category => `<button type="button" data-category="${escape(category)}" aria-pressed="${state.category === category}">${escape(category)}<small>${category === '全部' ? entries.length : entries.filter(e => e.category === category).length}</small></button>`).join('');
}
const specimens = {
  claude: '<div class="claude-mark">✳</div><div class="spec-serif">A little more<br>human.</div><div class="claude-input">How can I help you today?<span>↑</span></div>',
  'linear.app': '<div class="linear-sidebar"><b>◒ Linear</b><span>Workspace</span><span>◉ Issues</span><span>◇ Projects</span></div><div class="linear-content"><div class="linear-top">Product / Cycle 24</div><h4>Build with precision.</h4><div class="issue"><i></i><span>Refine the details</span><small>High</small></div><div class="issue"><i></i><span>Ship something great</span><small>In progress</small></div><div class="linear-line"></div></div>',
  apple: '<div class="apple-nav">Apple <span>Mac &nbsp; iPad &nbsp; iPhone</span></div><div class="apple-title">Less. But more.</div><div class="apple-sub">Beautifully simple. Simply powerful.</div><div class="apple-links">Learn more › &nbsp;&nbsp; Buy ›</div><div class="apple-orbs"><i></i><i></i><i></i></div>',
  stripe: '<div class="stripe-wash"></div><b class="stripe-brand">stripe</b><div class="stripe-title">Payments.<br>Reimagined.</div><div class="stripe-action">Start now →</div><div class="stripe-checkout"><small>Total due</small><b>$128.00</b><span>•••• &nbsp; •••• &nbsp; •••• &nbsp; 4242</span><em>Pay securely</em></div>',
  vercel: '<div class="vercel-grid"></div><b class="vercel-brand">▲ Vercel</b><div class="vercel-title">Build.<br>Deploy. Scale.</div><div class="vercel-actions"><span>Start deploying</span><span>Get a demo</span></div><div class="vercel-terminal">✓ Production deployed <i>Ready</i></div>',
  notion: '<div class="notion-sidebar"><b>▣ Workspace</b><span>⌕ Search</span><span>◷ Updates</span><span>▤ Projects</span></div><div class="notion-page"><div class="notion-icon">✎</div><h4>Your next big idea.</h4><p>Make room for a little clarity.</p><div class="notion-check">☑ A place to think</div><div class="notion-check">☐ A plan to make it happen</div><div class="notion-rule"></div></div>',
  supabase: '<div class="supabase-top"><b>ϟ supabase</b><span>Database / public</span></div><div class="supabase-title">Build in a weekend.<br><em>Scale to millions.</em></div><div class="db-table"><div>id <span>name</span><span>created_at</span></div><div>01 <span>Your next idea</span><span>just now</span></div><div>02 <span>Something great</span><span>just now</span></div></div>',
  figma: '<div class="figma-top"><b>figma</b><span>Ideas become things.</span><i>▶</i></div><div class="figma-canvas"><div class="figma-sticker">Make<br>something<br>playful.</div><div class="figma-circle"></div><div class="figma-selection"><span>Aa</span><i></i><i></i><i></i><i></i></div><div class="figma-cursor">↖ <span>You</span></div></div>',
  airbnb: '<div class="airbnb-top"><b>airbnb</b><span>Find your somewhere.</span></div><div class="airbnb-search">Anywhere <i>·</i> Any week <span>⌕</span></div><div class="stay-grid"><div><div class="stay-image stay-one"><i></i><span>♡</span></div><b>A quiet little escape</b><small>Mountain cabin</small></div><div><div class="stay-image stay-two"><i></i><span>♡</span></div><b>A place in the sun</b><small>Coastal retreat</small></div></div>'
};
function cardVisual(entry) {
  if (specimens[entry.slug]) {
    return `<div class="card-visual specimen spec-${entry.slug.replace('.', '-')}" aria-hidden="true">${specimens[entry.slug]}<span class="visual-label">文档示意</span></div>`;
  }
  if (entry.previews.light) {
    return `<div class="card-visual"><img src="assets/previews/${escape(entry.slug)}.png" alt="" width="1200" height="760" loading="lazy"><span class="visual-label">历史预览</span></div>`;
  }
  return `<div class="card-visual token-visual" style="${theme(entry)}" aria-hidden="true"><div class="token-brand">${escape(entry.name)}</div><div class="token-caption">Design language</div><div class="token-strip">${entry.colors.slice(0,5).map(c => `<span style="background:${c.value};color:${contrast(c.value)}"><small>${c.value}</small></span>`).join('')}</div><span class="visual-label">文档色板</span></div>`;
}
function renderGrid() {
  const query = state.query.trim().toLowerCase();
  const list = entries.filter(e => (state.category === '全部' || state.category === e.category) && (!state.previewOnly || Object.keys(e.previews).length) && `${e.name} ${e.slug} ${e.category} ${e.description} ${e.colors.map(c => c.value).join(' ')}`.toLowerCase().includes(query));
  list.sort((a,b) => {
    if (state.sort === 'featured') {
      const rank = e => featured.includes(e.slug) ? featured.indexOf(e.slug) : 999;
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
    }
    return a.name.localeCompare(b.name, 'en');
  });
  $('#grid').innerHTML = list.map(e => `<button type="button" class="design-card" data-slug="${escape(e.slug)}" aria-label="查看 ${escape(e.name)} 设计">${cardVisual(e)}<div class="card-body"><div class="card-title"><h3>${escape(e.name)}</h3><span class="card-arrow" aria-hidden="true">↗</span></div><p class="card-category">${escape(e.category)}</p><p class="card-description" lang="en">${escape(e.description)}</p><div class="card-foot"><span class="swatches" aria-hidden="true">${e.colors.slice(0,5).map(c => `<i style="background:${c.value}"></i>`).join('')}</span><span class="preview-badge ${e.previews.light ? 'available' : ''}">${e.previews.light ? '◉ 历史预览' : '文档与色板'}</span></div></div></button>`).join('');
  $('#empty').hidden = list.length > 0;
  $('#result-count').textContent = `${list.length} / ${entries.length} 套设计`;
}
function notify(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500);
}
async function loadDocument(entry) {
  const request = ++state.request;
  state.document = '';
  $('#document').textContent = '正在加载 DESIGN.md…';
  $('#retry').hidden = true;
  $('#copy').disabled = true;
  try {
    let text = documents.get(entry.slug);
    if (!text) {
      const response = await fetch(entry.document);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      text = await response.text();
      documents.set(entry.slug, text);
    }
    if (request !== state.request) return;
    state.document = text;
    $('#document').textContent = text;
    $('#copy').disabled = false;
  } catch {
    if (request !== state.request) return;
    $('#document').textContent = '文档加载失败。请确认站点通过 HTTP 服务打开，或点击“查看源文件”读取 GitHub 上的文档。';
    $('#retry').hidden = false;
    notify('文档加载失败，可重试或查看源文件');
  }
}
function renderDetail() {
  const entry = state.selected;
  if (!entry) return;
  const isPreview = state.tab === 'preview';
  $('#preview-panel').hidden = !isPreview;
  $('#document-panel').hidden = isPreview;
  $('#preview-tab').setAttribute('aria-pressed', isPreview);
  $('#document-tab').setAttribute('aria-pressed', !isPreview);
  $('.modes').hidden = !isPreview;
  $('#light').setAttribute('aria-pressed', state.mode === 'light');
  $('#dark').setAttribute('aria-pressed', state.mode === 'dark');
  const path = entry.previews[state.mode];
  $('#preview-note').textContent = !isPreview ? '原始 Markdown 文档，可复制或下载后放入项目根目录。' : path ? '下方色板来自当前文档；HTML 是历史版本预览，可能与文档不同。远程字体已移除，使用系统字体回退。' : '此设计没有历史 HTML 预览。下方仅展示从文档提取的色板与示意组件，不代表原站页面。';
  $('#detail-palette').className = 'detail-palette';
  $('#detail-palette').innerHTML = entry.colors.slice(0,8).map(c => `<div class="palette-item"><i style="background:${c.value}"></i><span>${escape(c.role)}<b>${c.value}</b></span></div>`).join('');
  const frame = $('#preview-frame');
  frame.hidden = !path;
  if (path && frame.getAttribute('src') !== path) {
    clearPreviewSizing();
    frame.style.height = '1px';
    frame.src = path;
  }
  if (!path) { clearPreviewSizing(); frame.removeAttribute('src'); }
  if (isPreview) requestAnimationFrame(() => previewMeasure?.());
  $('#token-preview').hidden = !!path;
  $('#token-preview').setAttribute('style', `${theme(entry, state.mode === 'dark')}background:var(--canvas);color:var(--text)`);
  $('#token-preview').innerHTML = `<h3>${escape(entry.name)}</h3><p>${escape(entry.description)}</p><div class="token-buttons" aria-hidden="true"><span style="background:var(--accent);color:var(--on-accent)">Primary action</span><span style="border:1px solid currentColor">Secondary action</span></div>`;
}
function openDetail(slug, updateHistory = true) {
  const entry = entries.find(e => e.slug === slug);
  if (!entry) return;
  state.selected = entry;
  state.mode = 'light';
  state.tab = 'preview';
  $('#detail-title').textContent = entry.name;
  $('#detail-category').textContent = entry.category;
  $('#detail-description').textContent = entry.description;
  $('#download').href = entry.document;
  $('#source').href = `https://github.com/mlhiter/awesome-design-md/blob/${window.DESIGN_CATALOG.sources[0].commit}/design-md/${encodeURIComponent(entry.slug)}/DESIGN.md`;
  renderDetail();
  if (!$('#detail').open) $('#detail').showModal();
  $('#detail').scrollTop = 0;
  loadDocument(entry);
  if (updateHistory) {
    const url = new URL(location.href);
    url.searchParams.set('design', slug);
    history.pushState(null, '', url);
  }
}
function closeDetail() {
  $('#detail').close();
  clearPreviewSizing();
  $('#preview-frame').removeAttribute('src');
  ++state.request;
  const url = new URL(location.href);
  url.searchParams.delete('design');
  history.replaceState(null, '', url);
}
$('#grid').addEventListener('click', e => {
  const card = e.target.closest('[data-slug]');
  if (card) openDetail(card.dataset.slug);
});
$('#categories').addEventListener('click', e => {
  const button = e.target.closest('[data-category]');
  if (!button) return;
  state.category = button.dataset.category;
  renderCategories(); renderGrid();
  [...$('#categories').children].find(b => b.dataset.category === state.category)?.focus({preventScroll:true});
});
$('#search').addEventListener('input', e => { state.query = e.target.value; renderGrid(); });
$('#has-preview').addEventListener('change', e => { state.previewOnly = e.target.checked; renderGrid(); });
$('#sort').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });
$('#reset').addEventListener('click', () => {
  state.category = '全部'; state.query = ''; state.previewOnly = false; state.sort = 'featured';
  $('#search').value = ''; $('#has-preview').checked = false; $('#sort').value = 'featured';
  renderCategories(); renderGrid(); $('#search').focus();
});
$('#close-detail').addEventListener('click', closeDetail);
$('#detail').addEventListener('cancel', e => { e.preventDefault(); closeDetail(); });
$('#detail').addEventListener('click', e => {
  if (e.target !== $('#detail')) return;
  const rect = e.target.getBoundingClientRect();
  if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) closeDetail();
});
for (const mode of ['light','dark']) $(`#${mode}`).addEventListener('click', () => { state.mode = mode; renderDetail(); });
for (const tab of ['preview','document']) $(`#${tab}-tab`).addEventListener('click', () => { state.tab = tab; renderDetail(); });
$('#retry').addEventListener('click', () => loadDocument(state.selected));
$('#copy').addEventListener('click', async () => {
  if (!state.document) return;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(state.document);
    else {
      const field = document.createElement('textarea');
      field.value = state.document; field.style.position = 'fixed'; field.style.opacity = '0';
      $('#detail').append(field); field.select();
      const copied = document.execCommand('copy'); field.remove();
      if (!copied) throw new Error('Copy unavailable');
    }
    notify('已复制 DESIGN.md，可以粘贴到项目中');
  } catch { notify('浏览器未允许复制，请使用“下载文件”'); }
});
document.addEventListener('keydown', e => {
  if (e.key === '/' && !$('#detail').open && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault(); $('#search').focus();
  }
});
window.addEventListener('popstate', () => {
  const slug = new URL(location.href).searchParams.get('design');
  if (slug && entries.some(e => e.slug === slug)) openDetail(slug, false);
  else closeDetail();
});
$('#total-stat').textContent = entries.length;
$('#preview-stat').textContent = entries.filter(e => Object.keys(e.previews).length).length;
renderCategories(); renderGrid();
const initialSlug = new URL(location.href).searchParams.get('design');
if (initialSlug) openDetail(initialSlug, false);
