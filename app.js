/* Safelight — application */
'use strict';
const h = U.h, $ = (s) => document.querySelector(s);

/* ============================== schema ============================== */
const Z8 = () => [0, 0, 0, 0, 0, 0, 0, 0];
function defaults() {
  return {
    temp: 0, tint: 0, exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
    texture: 0, clarity: 0, dehaze: 0, vibrance: 0, saturation: 0, bw: false,
    curve: { rgb: [[0, 0], [1, 1]], r: [[0, 0], [1, 1]], g: [[0, 0], [1, 1]], b: [[0, 0], [1, 1]] },
    pcHigh: 0, pcLight: 0, pcDark: 0, pcShadow: 0, pcS1: 25, pcS2: 50, pcS3: 75,
    hslH: Z8(), hslS: Z8(), hslL: Z8(), bwMix: Z8(),
    gsH: 220, gsS: 0, gsL: 0, gmH: 40, gmS: 0, gmL: 0, ghH: 45, ghS: 0, ghL: 0, ggH: 40, ggS: 0, ggL: 0, gradeBlend: 50, gradeBalance: 0,
    sharpen: 0, sharpRadius: 1, sharpDetail: 25, sharpMask: 0, nrLum: 0, nrDetail: 50, nrColor: 0,
    distortion: 0, lensVig: 0, lensVigMid: 50, caRed: 0, caBlue: 0, defPurple: 0, defGreen: 0,
    tVert: 0, tHorz: 0, tRot: 0, tAspect: 0, tScale: 100, tX: 0, tY: 0,
    vig: 0, vigMid: 50, vigRound: 0, vigFeather: 50, vigHigh: 0, grain: 0, grainSize: 25, grainRough: 50,
    calShadow: 0, calRH: 0, calRS: 0, calGH: 0, calGS: 0, calBH: 0, calBS: 0,
    crop: null, orient: 0, flipH: false, flipV: false,
    masks: [], spots: []
  };
}
const DEF = defaults();
const GROUPS = {
  treatment: ['Treatment', ['bw']],
  wb: ['White balance', ['temp', 'tint']],
  tone: ['Tone', ['exposure', 'contrast', 'highlights', 'shadows', 'whites', 'blacks']],
  presence: ['Presence', ['texture', 'clarity', 'dehaze', 'vibrance', 'saturation']],
  curve: ['Tone curve', ['curve', 'pcHigh', 'pcLight', 'pcDark', 'pcShadow', 'pcS1', 'pcS2', 'pcS3']],
  mixer: ['Color mixer', ['hslH', 'hslS', 'hslL', 'bwMix']],
  grading: ['Color grading', ['gsH', 'gsS', 'gsL', 'gmH', 'gmS', 'gmL', 'ghH', 'ghS', 'ghL', 'ggH', 'ggS', 'ggL', 'gradeBlend', 'gradeBalance']],
  detail: ['Detail', ['sharpen', 'sharpRadius', 'sharpDetail', 'sharpMask', 'nrLum', 'nrDetail', 'nrColor']],
  lens: ['Lens corrections', ['distortion', 'lensVig', 'lensVigMid', 'caRed', 'caBlue', 'defPurple', 'defGreen']],
  transform: ['Transform', ['tVert', 'tHorz', 'tRot', 'tAspect', 'tScale', 'tX', 'tY']],
  effects: ['Effects', ['vig', 'vigMid', 'vigRound', 'vigFeather', 'vigHigh', 'grain', 'grainSize', 'grainRough']],
  calibration: ['Calibration', ['calShadow', 'calRH', 'calRS', 'calGH', 'calGS', 'calBH', 'calBS']],
  crop: ['Crop & orientation', ['crop', 'orient', 'flipH', 'flipV']],
  masks: ['Masks', ['masks']],
  spots: ['Healing', ['spots']]
};
const HUES = ['Red', 'Orange', 'Yellow', 'Green', 'Aqua', 'Blue', 'Purple', 'Magenta'];
const HUE_COL = ['#e0433c', '#ec8a2c', '#e8cf35', '#4fb548', '#3fc1c4', '#3f6fe0', '#8b52d6', '#d64bb0'];
const LABELS = { red: '#d9534f', yellow: '#e2bf3c', green: '#62b357', blue: '#4f8fe0', purple: '#9a6fd6' };
const MASK_ADJ = [['exposure', 'Exposure', -4, 4, 0.01], ['contrast', 'Contrast', -100, 100, 1], ['highlights', 'Highlights', -100, 100, 1], ['shadows', 'Shadows', -100, 100, 1], ['whites', 'Whites', -100, 100, 1], ['blacks', 'Blacks', -100, 100, 1], ['temp', 'Temperature', -100, 100, 1], ['tint', 'Tint', -100, 100, 1], ['texture', 'Texture', -100, 100, 1], ['clarity', 'Clarity', -100, 100, 1], ['dehaze', 'Dehaze', -100, 100, 1], ['saturation', 'Saturation', -100, 100, 1]];
const maskAdj0 = () => Object.fromEntries(MASK_ADJ.map(a => [a[0], 0]));
const isDefault = (k, v) => JSON.stringify(v) === JSON.stringify(DEF[k]);
const isEdited = (p) => Object.keys(DEF).some(k => !isDefault(k, p[k]));

/* ============================== presets ============================== */
const BUILTIN = [
  ['Black & White', 'Silver Gelatin', { bw: true, contrast: 22, clarity: 14, whites: 10, blacks: -12, grain: 18, grainSize: 30, bwMix: [10, 14, 8, -10, -14, -20, -5, 5] }],
  ['Black & White', 'Selenium Print', { bw: true, contrast: 12, shadows: 10, gsH: 265, gsS: 18, ghH: 38, ghS: 12, gradeBalance: -10, vig: -12 }],
  ['Black & White', 'Soft Matte Mono', { bw: true, contrast: -10, curve: { rgb: [[0, 0.09], [0.3, 0.3], [0.75, 0.76], [1, 0.95]], r: [[0, 0], [1, 1]], g: [[0, 0], [1, 1]], b: [[0, 0], [1, 1]] }, grain: 10 }],
  ['Black & White', 'High Contrast Ink', { bw: true, contrast: 55, whites: 25, blacks: -35, clarity: 25, bwMix: [-20, -10, 10, -25, -30, -40, -20, 0] }],
  ['Color', 'Punch', { contrast: 28, vibrance: 28, clarity: 12, texture: 10, blacks: -8, whites: 8 }],
  ['Color', 'Golden Hour', { temp: 16, tint: 4, vibrance: 18, highlights: -12, ghH: 42, ghS: 18, gsH: 220, gsS: 8 }],
  ['Color', 'Blue Hour', { temp: -18, tint: 6, contrast: 10, gsH: 230, gsS: 22, ghH: 200, ghS: 6, vibrance: 10 }],
  ['Color', 'Clean Neutral', { contrast: 8, highlights: -18, shadows: 18, vibrance: 8, sharpen: 30 }],
  ['Creative', 'Faded Film', { contrast: -12, saturation: -14, curve: { rgb: [[0, 0.07], [0.25, 0.23], [0.75, 0.78], [1, 0.96]], r: [[0, 0], [1, 1]], g: [[0, 0], [1, 1]], b: [[0, 0], [1, 1]] }, gsH: 190, gsS: 16, ghH: 40, ghS: 10, grain: 22 }],
  ['Creative', 'Cross Process', { curve: { rgb: [[0, 0], [1, 1]], r: [[0, 0], [0.3, 0.24], [0.75, 0.84], [1, 1]], g: [[0, 0], [0.25, 0.2], [0.75, 0.82], [1, 1]], b: [[0, 0.12], [0.5, 0.5], [1, 0.86]] }, saturation: 10, contrast: 10 }],
  ['Creative', 'Teal & Amber', { gsH: 195, gsS: 30, ghH: 35, ghS: 26, gradeBalance: 10, hslS: [0, 10, -20, -30, 10, 0, -30, -20], hslH: [0, -10, -20, 30, 0, -10, 0, 0], contrast: 15 }],
  ['Creative', 'Nocturne', { exposure: -0.3, dehaze: 15, clarity: 15, temp: -10, vibrance: 15, vig: -25, blacks: -10 }],
  ['Portrait', 'Soft Skin', { texture: -22, clarity: -10, highlights: -12, shadows: 8, sharpen: 20, hslL: [4, 8, 0, 0, 0, 0, 0, 0], hslS: [-4, -6, 0, 0, 0, 0, 0, 0] }],
  ['Portrait', 'High Key', { exposure: 0.6, contrast: -18, highlights: -30, shadows: 30, whites: 15, vibrance: -5 }],
  ['Portrait', 'Low Key', { exposure: -0.5, contrast: 20, shadows: -15, blacks: -20, vig: -30, vigFeather: 70 }],
  ['Landscape', 'Clear Air', { dehaze: 22, clarity: 18, vibrance: 22, highlights: -25, shadows: 20, texture: 10 }],
  ['Landscape', 'Green Season', { hslH: [0, 0, -15, 10, 0, 0, 0, 0], hslS: [0, 0, 15, 20, 10, 10, 0, 0], hslL: [0, 0, 5, 5, 0, -10, 0, 0], vibrance: 12 }]
].map(([group, name, values]) => ({ id: 'b:' + name, group, name, values, builtin: true }));

/* ============================== state ============================== */
const S = {
  view: 'library', photos: [], collections: [], userPresets: [],
  sel: new Set(), cur: null, source: { kind: 'all' }, lastImport: null,
  filter: { q: '', rating: 0, flag: 'all', label: 'any', sort: 'capture', cell: 190 },
  tool: null, zoom: 0, center: [0.5, 0.5], compare: 'off', split: 0.5, showClip: false, stageBg: 'mid',
  heal: { mode: 'heal', size: 3, feather: 40, opacity: 100 }, selSpot: -1,
  selMask: -1, maskCreate: null, maskOverlay: true, brush: { size: 6, feather: 60, flow: 60, erase: false },
  cropAspect: 'original', cropPortrait: false, constrain: true,
  curveCh: 'rgb', curveMode: 'point', mixMode: 'hsl', mixProp: 'all',
  clip: null, lastPreset: null, picking: null
};
let engine = null, img = null, imgFor = null, brushState = null;
const imgCache = new Map();
const ph = () => S.photos.find(p => p.id === S.cur);
const P = () => ph() && ph().edits;

function toast(msg, ms = 2600) {
  const t = h('div', { class: 'toast', role: 'status', text: msg }); document.body.appendChild(t); setTimeout(() => t.remove(), ms);
}
const saveTimers = new Map();
function savePhoto(p, now) {
  clearTimeout(saveTimers.get(p.id));
  const go = () => U.DB.put('photos', p);
  if (now) return go();
  saveTimers.set(p.id, setTimeout(go, 500));
}
const saveColls = () => S.collections.forEach(c => U.DB.put('collections', c));

/* ============================== import ============================== */
async function decodeSource(rec) {
  if (imgCache.has(rec.id)) return imgCache.get(rec.id);
  let src = null;
  if (rec.raw) {
    const buf = await rec.blob.arrayBuffer();
    const r = await U.decodeRaw(buf, Math.min(engine.MAXTEX, 8192));
    if (r) src = { half: r.half, w: r.w, h: r.h, rawDecoded: true, exif: r.exif };
    else { const pv = await U.extractRawPreview(rec.blob); if (pv) src = await bitmapFrom(pv.blob); }
  } else src = await bitmapFrom(rec.blob);
  if (!src) return null;
  imgCache.set(rec.id, src);
  if (imgCache.size > 4) { const k = imgCache.keys().next().value; const v = imgCache.get(k); if (v && v.close) v.close(); imgCache.delete(k); }
  return src;
}
async function bitmapFrom(blob) {
  let b = await createImageBitmap(blob);
  const max = Math.min(engine.MAXTEX, 8192);
  if (Math.max(b.width, b.height) > max) {
    const s = max / Math.max(b.width, b.height); const nb = await createImageBitmap(b, { resizeWidth: Math.round(b.width * s), resizeHeight: Math.round(b.height * s), resizeQuality: 'high' }); b.close(); b = nb;
  }
  return b;
}
async function makeThumb(src, edits, mid) {
  const handle = engine.loadImage(src);
  const brush = buildBrush(edits, handle, mid);
  const id = engine.renderSmall(handle, edits, 360, brush);
  engine.freeImage(handle);
  const c = document.createElement('canvas'); c.width = id.width; c.height = id.height; c.getContext('2d').putImageData(id, 0, 0);
  return c.toDataURL('image/jpeg', 0.82);
}
async function importFiles(files, opts = {}) {
  const list = [...files].filter(f => f.type.startsWith('image/') || U.RAW_EXT.test(f.name));
  if (!list.length) { toast('No photos found. Safelight opens JPEG, PNG, WebP, AVIF, GIF, HEIC (Safari) and camera RAW files.'); return; }
  const batch = U.uid(); let done = 0, failed = 0;
  const busy = showBusy(`Importing 0 of ${list.length}…`);
  for (const f of list) {
    try {
      const raw = U.RAW_EXT.test(f.name);
      const rec = { id: U.uid(), blob: f, raw, name: f.name };
      let exif = f.exif || {};
      if (!raw && /jpe?g$/i.test(f.type)) exif = Object.assign(U.parseExif(await f.slice(0, 262144).arrayBuffer()), exif);
      if (raw) exif = U.parseExif(await f.slice(0, 1048576).arrayBuffer());
      const src = await decodeSource(rec);
      if (!src) { failed++; continue; }
      if (src.exif) exif = Object.assign({}, exif, Object.fromEntries(Object.entries(src.exif).filter(([, v]) => v != null && v !== '')));
      const w = src.half ? src.w : src.width, hh = src.half ? src.h : src.height;
      await U.DB.put('images', rec);
      const edits = defaults();
      const p = {
        id: U.uid(), imageId: rec.id, name: f.name, size: f.size, w, h: hh, raw, rawMode: raw ? (src.half ? 'full' : 'preview') : null, exif,
        importedAt: Date.now(), captureAt: exif.captureAt || U.exifDate(exif.dateOriginal) || U.exifDate(exif.dateTime) || f.lastModified || Date.now(),
        rating: 0, flag: 0, label: null, keywords: opts.keywords || [], title: '', caption: '', sample: !!opts.sample, batch,
        edits, history: [{ label: 'Import', edits: U.clone(edits) }], hIndex: 0, snapshots: [], thumb: await makeThumb(src, edits, 'x')
      };
      S.photos.push(p); await U.DB.put('photos', p); done++;
    } catch (e) { console.error(e); failed++; }
    busy.textContent = `Importing ${done + failed} of ${list.length}…`;
  }
  busy.remove();
  S.lastImport = batch;
  if (!opts.sample) toast(`Imported ${done} photo${done === 1 ? '' : 's'}${failed ? `, ${failed} could not be read` : ''}.`);
  const first = S.photos.find(p => p.batch === batch);
  if (first) { S.cur = first.id; S.sel = new Set([first.id]); }
  renderAll();
}
function showBusy(text) { const b = h('div', { class: 'busy', text }); $('#center').appendChild(b); return b; }

/* ============================== filtering ============================== */
function matchesSmart(p, r) {
  if (r.minRating && p.rating < r.minRating) return false;
  if (r.flag === 'pick' && p.flag !== 1) return false;
  if (r.flag === 'reject' && p.flag !== -1) return false;
  if (r.flag === 'none' && p.flag !== 0) return false;
  if (r.label && r.label !== 'any' && p.label !== r.label) return false;
  if (r.keyword && !p.keywords.some(k => k.toLowerCase().includes(r.keyword.toLowerCase()))) return false;
  if (r.edited && !isEdited(p.edits)) return false;
  return true;
}
function visiblePhotos() {
  const src = S.source, f = S.filter;
  let list = S.photos.filter(p => {
    if (src.kind === 'import' && p.batch !== S.lastImport) return false;
    if (src.kind === 'picks' && p.flag !== 1) return false;
    if (src.kind === 'edited' && !isEdited(p.edits)) return false;
    if (src.kind === 'col') { const c = S.collections.find(c => c.id === src.id); if (!c || !c.photos.includes(p.id)) return false; }
    if (src.kind === 'smart') { const c = S.collections.find(c => c.id === src.id); if (!c || !matchesSmart(p, c.rules)) return false; }
    if (src.kind === 'kw' && !p.keywords.includes(src.id)) return false;
    if (f.q) { const q = f.q.toLowerCase(); if (![p.name, p.title, p.caption, ...p.keywords].join(' ').toLowerCase().includes(q)) return false; }
    if (f.rating && p.rating < f.rating) return false;
    if (f.flag === 'pick' && p.flag !== 1) return false;
    if (f.flag === 'reject' && p.flag !== -1) return false;
    if (f.flag === 'none' && p.flag !== 0) return false;
    if (f.label !== 'any' && p.label !== f.label) return false;
    return true;
  });
  const sorters = { capture: (a, b) => a.captureAt - b.captureAt, import: (a, b) => a.importedAt - b.importedAt, name: (a, b) => a.name.localeCompare(b.name), rating: (a, b) => b.rating - a.rating || a.captureAt - b.captureAt };
  return list.sort(sorters[f.sort] || sorters.capture);
}

/* ============================== shell ============================== */
function setView(v) {
  if (v === 'edit' && !ph()) { const l = visiblePhotos(); if (!l.length) { toast('Import a photo first.'); return; } S.cur = l[0].id; S.sel = new Set([S.cur]); }
  if (S.view === 'edit' && v !== 'edit') finishEditing();
  S.view = v; S.tool = null; S.picking = null;
  $('#mLib').classList.toggle('on', v === 'library'); $('#mEdit').classList.toggle('on', v === 'edit');
  try { localStorage.setItem('safelight.view', v); } catch (e) {}
  renderAll();
}
function renderAll() {
  if (S.view === 'library') { renderLibLeft(); renderLibCenter(); renderLibRight(); }
  else { renderEditLeft(); renderEditCenter(); renderEditRight(); }
  renderStrip();
}
function section(id, title, body, opts = {}) {
  let closed = false; try { closed = localStorage.getItem('safelight.sec.' + id) === '0'; } catch (e) {}
  if (opts.open && localStorage.getItem('safelight.sec.' + id) == null) closed = false;
  const el = h('div', { class: 'sec' + (closed ? ' closed' : '') + (opts.mod ? ' mod' : ''), id: 'sec-' + id });
  const head = h('h3', { onclick: (e) => { if (e.target.closest('.act')) return; el.classList.toggle('closed'); try { localStorage.setItem('safelight.sec.' + id, el.classList.contains('closed') ? '0' : '1'); } catch (e2) {} } },
    h('span', { class: 'dot' }), title, opts.action || null, h('span', { class: 'chev', html: '&#9662;' }));
  el.append(head, h('div', { class: 'body' }, body));
  return el;
}

/* ============================== library: left ============================== */
function renderLibLeft() {
  const L = $('#left'); L.innerHTML = '';
  const n = (fn) => S.photos.filter(fn).length;
  const item = (label, src, count, extra) => h('button', { class: 'li' + (S.source.kind === src.kind && S.source.id === src.id ? ' on' : ''), onclick: () => { S.source = src; renderAll(); } }, h('span', { class: 't', text: label }), h('span', { class: 'n', text: count }), extra || null);
  L.append(section('catalog', 'Catalog', h('div', { class: 'list' },
    item('All photographs', { kind: 'all' }, S.photos.length),
    item('Previous import', { kind: 'import' }, n(p => p.batch === S.lastImport)),
    item('Picks', { kind: 'picks' }, n(p => p.flag === 1)),
    item('Edited', { kind: 'edited' }, n(p => isEdited(p.edits)))
  )));
  const cols = S.collections.map(c => item((c.smart ? '◇ ' : '▫ ') + c.name, { kind: c.smart ? 'smart' : 'col', id: c.id }, c.smart ? n(p => matchesSmart(p, c.rules)) : c.photos.length,
    h('button', { class: 'x', title: 'Delete collection', 'aria-label': 'Delete collection ' + c.name, onclick: (e) => { e.stopPropagation(); confirmDlg(`Delete the collection “${c.name}”? The photos stay in your library.`, 'Delete', () => { S.collections = S.collections.filter(x => x !== c); U.DB.del('collections', c.id); if (S.source.id === c.id) S.source = { kind: 'all' }; renderAll(); }); } }, '×')));
  L.append(section('cols', 'Collections', h('div', {},
    h('div', { class: 'list' }, cols.length ? cols : h('div', { class: 'empty', text: 'Group photos into collections, or make a smart collection that fills itself from rules.' })),
    h('div', { class: 'row', style: { marginTop: '8px' } },
      h('button', { class: 'btn sm', onclick: newCollectionDlg }, '+ Collection'),
      h('button', { class: 'btn sm', onclick: () => smartDlg() }, '+ Smart collection')))));
  const kw = {}; S.photos.forEach(p => p.keywords.forEach(k => kw[k] = (kw[k] || 0) + 1));
  const kws = Object.keys(kw).sort();
  L.append(section('kw', 'Keywords', h('div', { class: 'list' }, kws.length ? kws.map(k => item(k, { kind: 'kw', id: k }, kw[k])) : h('div', { class: 'empty', text: 'Keywords you add to photos appear here.' }))));
}
function newCollectionDlg() {
  const name = h('input', { type: 'text', id: 'colName', value: 'New collection' });
  const addSel = h('input', { type: 'checkbox', id: 'colAdd', checked: S.sel.size > 0 });
  dialog('New collection', [h('label', { class: 'field' }, h('span', { text: 'Name' }), name), h('label', { class: 'chk' }, addSel, `Include the ${S.sel.size} selected photo${S.sel.size === 1 ? '' : 's'}`)], 'Create', () => {
    const c = { id: U.uid(), name: name.value.trim() || 'Untitled', photos: addSel.checked ? [...S.sel] : [] };
    S.collections.push(c); U.DB.put('collections', c); S.source = { kind: 'col', id: c.id }; renderAll();
  });
  setTimeout(() => name.select(), 30);
}
function smartDlg() {
  const name = h('input', { type: 'text', id: 'smName', value: 'Best of' });
  const rating = h('select', { id: 'smRating' }, ['Any', '1+', '2+', '3+', '4+', '5'].map((t, i) => h('option', { value: i, text: t })));
  const flag = h('select', { id: 'smFlag' }, [['any', 'Any flag'], ['pick', 'Picked'], ['none', 'Unflagged'], ['reject', 'Rejected']].map(([v, t]) => h('option', { value: v, text: t })));
  const label = h('select', { id: 'smLabel' }, [['any', 'Any label'], ...Object.keys(LABELS).map(k => [k, k[0].toUpperCase() + k.slice(1)])].map(([v, t]) => h('option', { value: v, text: t })));
  const kw = h('input', { type: 'text', id: 'smKw', placeholder: 'e.g. travel' });
  const ed = h('input', { type: 'checkbox', id: 'smEd' });
  rating.value = '3';
  dialog('New smart collection', [h('label', { class: 'field' }, h('span', { text: 'Name' }), name),
    h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', { text: 'Rating' }), rating), h('label', { class: 'field' }, h('span', { text: 'Flag' }), flag), h('label', { class: 'field' }, h('span', { text: 'Color label' }), label), h('label', { class: 'field' }, h('span', { text: 'Keyword contains' }), kw)),
    h('label', { class: 'chk' }, ed, 'Only edited photos')], 'Create', () => {
    const c = { id: U.uid(), name: name.value.trim() || 'Smart collection', smart: true, rules: { minRating: +rating.value, flag: flag.value, label: label.value, keyword: kw.value.trim(), edited: ed.checked } };
    S.collections.push(c); U.DB.put('collections', c); S.source = { kind: 'smart', id: c.id }; renderAll();
  });
}

/* ============================== library: center ============================== */
function stars(p, onset) {
  return h('span', { class: 'stars', role: 'group', 'aria-label': 'Rating' }, [1, 2, 3, 4, 5].map(i => h('button', { class: i <= p.rating ? 'on' : '', 'aria-label': i + ' star' + (i > 1 ? 's' : ''), onclick: (e) => { e.stopPropagation(); onset(p.rating === i ? 0 : i); } }, '★')));
}
function setMeta(ids, fn) { ids.forEach(id => { const p = S.photos.find(x => x.id === id); if (p) { fn(p); savePhoto(p); } }); renderAll(); }
function renderLibCenter() {
  const C = $('#center'); C.innerHTML = '';
  const f = S.filter;
  const q = h('input', { type: 'text', id: 'libQ', placeholder: 'Search name, keyword, title', value: f.q, oninput: (e) => { f.q = e.target.value; renderGrid(); } });
  const sel = (id, opts, val, on) => { const s = h('select', { id, onchange: (e) => { on(e.target.value); renderGrid(); } }, opts.map(([v, t]) => h('option', { value: v, text: t }))); s.value = val; return s; };
  const bar = h('div', { class: 'libbar' }, q,
    sel('libRating', [[0, 'Any rating'], [1, '★ and up'], [2, '★★ and up'], [3, '★★★ and up'], [4, '★★★★ and up'], [5, '★★★★★']], f.rating, v => f.rating = +v),
    sel('libFlag', [['all', 'All flags'], ['pick', 'Picks'], ['none', 'Unflagged'], ['reject', 'Rejected']], f.flag, v => f.flag = v),
    sel('libLabel', [['any', 'Any label'], ...Object.keys(LABELS).map(k => [k, k[0].toUpperCase() + k.slice(1)])], f.label, v => f.label = v),
    sel('libSort', [['capture', 'Sort: capture time'], ['import', 'Sort: import order'], ['name', 'Sort: file name'], ['rating', 'Sort: rating']], f.sort, v => f.sort = v),
    h('input', { type: 'range', id: 'libSize', min: 120, max: 320, value: f.cell, style: { width: '90px' }, 'aria-label': 'Thumbnail size', oninput: (e) => { f.cell = +e.target.value; $('#grid').style.setProperty('--cell', f.cell + 'px'); } }),
    h('span', { class: 'count', id: 'libCount' }));
  const grid = h('div', { class: 'grid', id: 'grid', style: { '--cell': f.cell + 'px' } });
  C.append(bar, grid);
  setupDrop(C);
  renderGrid();
}
function renderGrid() {
  const grid = $('#grid'); if (!grid) return;
  const list = visiblePhotos(); grid.innerHTML = '';
  $('#libCount').textContent = `${list.length} of ${S.photos.length} · ${S.sel.size} selected`;
  if (!list.length) {
    grid.append(h('div', { class: 'empty', style: { gridColumn: '1/-1', textAlign: 'center', padding: '60px 0' } },
      S.photos.length ? 'No photos match these filters.' : 'Drop photos here, or use Import. JPEG, PNG, WebP and camera RAW files all work.'));
    return;
  }
  for (const p of list) {
    const ed = isEdited(p.edits);
    const cell = h('div', { class: 'cell' + (S.sel.has(p.id) ? ' sel' : '') + (S.cur === p.id ? ' cur' : '') + (p.flag === -1 ? ' rej' : ''), tabindex: 0,
      onclick: (e) => selectPhoto(p.id, e, list), ondblclick: () => { S.cur = p.id; S.sel = new Set([p.id]); setView('edit'); } },
      h('div', { class: 'thumb' }, h('img', { src: p.thumb, alt: p.title || p.name, loading: 'lazy', draggable: 'false' })),
      h('div', { class: 'nm', text: p.title || p.name }),
      h('div', { class: 'ft' }, stars(p, r => setMeta([p.id], x => x.rating = r)),
        p.label ? h('span', { class: 'lbl', style: { background: LABELS[p.label] }, title: p.label }) : null,
        p.flag === 1 ? h('span', { class: 'flag pick', text: 'PICK' }) : p.flag === -1 ? h('span', { class: 'flag rej', text: 'REJECT' }) : null,
        h('span', { style: { flex: 1 } }),
        p.raw ? h('span', { class: 'tag', text: 'RAW' }) : null,
        p.virtual ? h('span', { class: 'tag', text: 'COPY' }) : null,
        ed ? h('span', { class: 'tag ed', text: 'EDITED' }) : null));
    grid.append(cell);
  }
}
function selectPhoto(id, e, list) {
  list = list || visiblePhotos();
  if (e && (e.metaKey || e.ctrlKey)) { S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); S.cur = id; }
  else if (e && e.shiftKey && S.cur) {
    const a = list.findIndex(p => p.id === S.cur), b = list.findIndex(p => p.id === id);
    if (a >= 0 && b >= 0) { const [i, j] = a < b ? [a, b] : [b, a]; for (let k = i; k <= j; k++) S.sel.add(list[k].id); }
  } else { S.sel = new Set([id]); S.cur = id; }
  if (!S.sel.size) S.sel.add(id);
  if (S.view === 'library') { renderGrid(); renderLibRight(); renderStrip(); }
  else openCurrent();
}

/* ============================== library: right ============================== */
function renderLibRight() {
  const R = $('#right'); R.innerHTML = '';
  const p = ph();
  const ids = [...S.sel];
  const qd = (label, fn) => h('button', { class: 'btn sm', onclick: () => quickDevelop(ids, fn) }, label);
  R.append(section('quick', 'Quick adjust', h('div', { class: 'body', style: { padding: 0 } },
    h('div', { class: 'empty', style: { paddingTop: 0 }, text: ids.length ? `Applies to ${ids.length} selected photo${ids.length === 1 ? '' : 's'}.` : 'Select photos to adjust them together.' }),
    h('div', { class: 'row' }, qd('Auto tone', 'auto'), qd('Auto white balance', 'awb'), qd('Black & white', e => e.bw = !e.bw)),
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, width: '64px' }, text: 'Exposure' }), qd('−1', e => e.exposure -= 1), qd('−⅓', e => e.exposure -= 1 / 3), qd('+⅓', e => e.exposure += 1 / 3), qd('+1', e => e.exposure += 1)),
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, width: '64px' }, text: 'Contrast' }), qd('−20', e => e.contrast -= 20), qd('+20', e => e.contrast += 20)),
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, width: '64px' }, text: 'Vibrance' }), qd('−20', e => e.vibrance -= 20), qd('+20', e => e.vibrance += 20)),
    h('div', { class: 'row' }, qd('Paste settings', 'paste'), qd('Reset all', 'reset')))));
  if (!p) { R.append(h('div', { class: 'body' }, h('div', { class: 'empty', text: 'Select a photo to see its details.' }))); return; }
  const ex = p.exif || {};
  const kv = (k, v) => v ? [h('dt', { text: k }), h('dd', { text: String(v), title: String(v) })] : [];
  R.append(section('meta', 'Metadata', h('div', { class: 'body', style: { padding: 0, gap: '10px' } },
    h('div', { class: 'row' }, stars(p, r => setMeta(ids, x => x.rating = r)),
      h('span', { class: 'sp', style: { flex: 1 } }),
      h('div', { class: 'seg' }, [[1, 'Pick'], [0, '—'], [-1, 'Reject']].map(([v, t]) => h('button', { class: p.flag === v ? 'on' : '', onclick: () => setMeta(ids, x => x.flag = v) }, t)))),
    h('div', { class: 'row' }, [null, ...Object.keys(LABELS)].map(k => h('button', { class: 'iconbtn' + (p.label === k ? ' on' : ''), title: k || 'No label', 'aria-label': 'Label ' + (k || 'none'), onclick: () => setMeta(ids, x => x.label = k) },
      h('span', { class: 'lbl', style: { background: k ? LABELS[k] : 'transparent', border: k ? 0 : '1px solid var(--faint)', outline: p.label === k ? '2px solid var(--fg)' : 'none', outlineOffset: '2px' } })))),
    h('label', { class: 'field' }, h('span', { text: 'Title' }), h('input', { type: 'text', id: 'mdTitle', value: p.title, onchange: (e) => setMeta([p.id], x => x.title = e.target.value) })),
    h('label', { class: 'field' }, h('span', { text: 'Caption' }), h('textarea', { id: 'mdCaption', rows: 2, onchange: (e) => setMeta([p.id], x => x.caption = e.target.value) }, p.caption)),
    h('label', { class: 'field' }, h('span', { text: 'Keywords (comma separated)' }), h('input', { type: 'text', id: 'mdKw', value: p.keywords.join(', '), onchange: (e) => { const ks = e.target.value.split(',').map(s => s.trim()).filter(Boolean); setMeta(ids.length > 1 ? ids : [p.id], x => x.keywords = ids.length > 1 ? [...new Set([...x.keywords, ...ks])] : ks); } })),
    h('dl', { class: 'kv' }, kv('File', p.name), kv('Size', `${p.w} × ${p.h}${p.size ? ' · ' + (p.size / 1048576).toFixed(1) + ' MB' : ''}`), kv('RAW', p.raw ? (p.rawMode === 'full' ? 'Full RAW decode' : 'Embedded preview') : ''),
      kv('Captured', new Date(p.captureAt).toLocaleString()), kv('Camera', [ex.make, ex.model].filter(Boolean).join(' ')), kv('Lens', ex.lens),
      kv('Exposure', [ex.exposure ? U.fmtShutter(ex.exposure) : '', ex.fnumber ? 'f/' + (+ex.fnumber).toFixed(1) : '', ex.iso ? 'ISO ' + ex.iso : '', ex.focal ? Math.round(ex.focal) + ' mm' : ''].filter(Boolean).join(' · ')),
      kv('Sample', p.sample ? 'Generated example photo' : '')))));
  const inCols = S.collections.filter(c => !c.smart);
  R.append(section('pcols', 'In collections', h('div', { class: 'body', style: { padding: 0 } },
    inCols.length ? inCols.map(c => h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: c.photos.includes(p.id), onchange: (e) => { ids.forEach(id => { const i = c.photos.indexOf(id); if (e.target.checked && i < 0) c.photos.push(id); if (!e.target.checked && i >= 0) c.photos.splice(i, 1); }); U.DB.put('collections', c); renderLibLeft(); } }), c.name)) : h('div', { class: 'empty', text: 'No collections yet.' }))));
  R.append(section('pact', 'Photo', h('div', { class: 'row' },
    h('button', { class: 'btn sm', onclick: () => virtualCopy(p) }, 'Make virtual copy'),
    h('button', { class: 'btn sm', onclick: () => setView('edit') }, 'Edit'),
    h('button', { class: 'btn sm danger', onclick: () => removePhotos(ids) }, ids.length > 1 ? `Remove ${ids.length}` : 'Remove'))));
}
async function quickDevelop(ids, fn) {
  if (!ids.length) return;
  if (fn === 'paste') { pasteSettings(ids); return; }
  for (const id of ids) {
    const p = S.photos.find(x => x.id === id); if (!p) continue;
    const e = p.edits;
    if (fn === 'reset') Object.assign(e, defaults());
    else if (fn === 'auto' || fn === 'awb') {
      const rec = await U.DB.get('images', p.imageId); const src = rec && await decodeSource(rec); if (!src) continue;
      const hd = engine.loadImage(src);
      Object.assign(e, fn === 'auto' ? autoTone(hd, e) : autoWB(hd, e));
      engine.freeImage(hd);
    } else { fn(e); e.exposure = U.clamp(e.exposure, -5, 5); e.contrast = U.clamp(e.contrast, -100, 100); e.vibrance = U.clamp(e.vibrance, -100, 100); }
    pushHistoryFor(p, fn === 'auto' ? 'Auto tone' : fn === 'awb' ? 'Auto white balance' : fn === 'reset' ? 'Reset' : 'Quick adjust');
    await refreshThumb(p);
  }
  renderAll();
}
function virtualCopy(p) {
  const c = U.clone(p); c.id = U.uid(); c.virtual = true; c.name = p.name.replace(/(\.[^.]+)?$/, ' (copy)$1'); c.importedAt = Date.now();
  S.photos.push(c); U.DB.put('photos', c); S.cur = c.id; S.sel = new Set([c.id]); toast('Virtual copy made. It shares the original file but keeps its own edits.'); renderAll();
}
function removePhotos(ids) {
  confirmDlg(`Remove ${ids.length} photo${ids.length === 1 ? '' : 's'} from Safelight? Your original files on disk are not touched.`, 'Remove', async () => {
    for (const id of ids) {
      const p = S.photos.find(x => x.id === id); if (!p) continue;
      S.photos = S.photos.filter(x => x.id !== id); await U.DB.del('photos', id);
      S.collections.forEach(c => { const i = c.photos.indexOf(id); if (i >= 0) c.photos.splice(i, 1); });
      if (!S.photos.some(x => x.imageId === p.imageId)) { await U.DB.del('images', p.imageId); imgCache.delete(p.imageId); }
    }
    saveColls(); S.sel.clear(); S.cur = S.photos[0] ? S.photos[0].id : null; if (S.cur) S.sel.add(S.cur);
    if (S.view === 'edit' && !S.cur) S.view = 'library';
    renderAll();
  });
}

/* ============================== filmstrip ============================== */
function renderStrip() {
  const list = visiblePhotos();
  const bar = $('#stripbar'); bar.innerHTML = '';
  const srcName = { all: 'All photographs', import: 'Previous import', picks: 'Picks', edited: 'Edited' }[S.source.kind] || (S.collections.find(c => c.id === S.source.id) || {}).name || S.source.id;
  bar.append(h('span', { text: `${srcName} · ${list.length} photo${list.length === 1 ? '' : 's'} · ${S.sel.size} selected` }), h('span', { class: 'sp' }));
  if (S.view === 'edit') {
    bar.append(h('button', { class: 'btn sm ghost', onclick: () => copyDlg('copy'), title: 'Copy settings (Ctrl+C)' }, 'Copy'),
      h('button', { class: 'btn sm ghost', disabled: !S.clip, onclick: () => pasteSettings([...S.sel]), title: 'Paste settings (Ctrl+V)' }, 'Paste'),
      h('button', { class: 'btn sm ghost', disabled: S.sel.size < 2, onclick: () => copyDlg('sync'), title: 'Apply this photo’s settings to the other selected photos' }, `Sync to ${Math.max(0, S.sel.size - 1)}`));
  }
  const film = $('#film'); film.innerHTML = '';
  for (const p of list) {
    film.append(h('button', { class: 'fc' + (S.sel.has(p.id) ? ' sel' : '') + (S.cur === p.id ? ' cur' : ''), title: p.title || p.name, 'aria-label': p.title || p.name, onclick: (e) => selectPhoto(p.id, e, list), ondblclick: () => { if (S.view !== 'edit') setView('edit'); } },
      h('img', { src: p.thumb, alt: '', draggable: 'false' }), p.rating ? h('span', { class: 'st', text: '★'.repeat(p.rating) }) : null));
  }
  const cur = film.querySelector('.cur'); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/* ============================== drag & drop ============================== */
function setupDrop(el) {
  let dz = null;
  el.addEventListener('dragover', (e) => { if (![...e.dataTransfer.types].includes('Files')) return; e.preventDefault(); if (!dz) { dz = h('div', { class: 'drop', text: 'Drop to import' }); el.appendChild(dz); } });
  el.addEventListener('dragleave', (e) => { if (e.target === el || !el.contains(e.relatedTarget)) { dz && dz.remove(); dz = null; } });
  el.addEventListener('drop', (e) => { e.preventDefault(); dz && dz.remove(); dz = null; if (e.dataTransfer.files.length) importFiles(e.dataTransfer.files); });
}

/* ============================== dialogs ============================== */
function dialog(title, body, okLabel, onOk, opts = {}) {
  const close = () => { m.remove(); document.removeEventListener('keydown', esc, true); };
  const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  const ok = h('button', { class: 'btn pri', onclick: async () => { const r = await onOk(); if (r !== false) close(); } }, okLabel);
  const m = h('div', { class: 'modal', onclick: (e) => { if (e.target === m) close(); } },
    h('div', { class: 'dlg', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('header', { text: title }), h('div', { class: 'db' }, body),
      h('footer', {}, h('button', { class: 'btn', onclick: close }, opts.cancel || 'Cancel'), okLabel ? ok : null)));
  document.body.appendChild(m); document.addEventListener('keydown', esc, true);
  return { close, ok };
}
function confirmDlg(text, okLabel, fn) { dialog('Please confirm', [h('p', { style: { margin: 0, lineHeight: 1.5 }, text })], okLabel, fn); }

/* ============================== edit: loading ============================== */
let loadToken = 0;
async function openCurrent() {
  const p = ph(); if (!p) return;
  if (imgFor === p.id && img) { renderEditLeft(); renderEditRight(); renderStrip(); updateStagebar(); requestRender(); return; }
  if (imgFor && imgFor !== p.id) finishEditing(imgFor);
  const tok = ++loadToken;
  const busy = $('.stagewrap') ? showBusy(p.raw ? 'Decoding RAW file…' : 'Loading…') : null;
  const rec = await U.DB.get('images', p.imageId);
  const src = rec && await decodeSource(rec);
  busy && busy.remove();
  if (tok !== loadToken) return;
  if (!src) { toast('This photo’s file could not be read.'); return; }
  if (img) engine.freeImage(img);
  img = engine.loadImage(src); imgFor = p.id;
  if (p.raw && src.half && p.rawMode !== 'full') { p.rawMode = 'full'; savePhoto(p); }
  brushState = null; S.zoom = 0; S.center = [0.5, 0.5]; S.selMask = -1; S.selSpot = -1; S.lastPreset = null;
  renderEditLeft(); renderEditRight(); renderStrip(); updateStagebar(); layoutStage(); requestRender();
}
function finishEditing(id) {
  const p = S.photos.find(x => x.id === (id || S.cur)); if (p) { savePhoto(p, true); refreshThumb(p); }
}
async function refreshThumb(p) {
  try {
    let hd = null, own = false;
    if (imgFor === p.id && img) hd = img;
    else { const rec = await U.DB.get('images', p.imageId); const src = rec && await decodeSource(rec); if (!src) return; hd = engine.loadImage(src); own = true; }
    const id = engine.renderSmall(hd, p.edits, 360, buildBrush(p.edits, hd, own ? 'x' : p.id));
    if (own) engine.freeImage(hd);
    const c = document.createElement('canvas'); c.width = id.width; c.height = id.height; c.getContext('2d').putImageData(id, 0, 0);
    p.thumb = c.toDataURL('image/jpeg', 0.82); savePhoto(p);
    document.querySelectorAll('img').forEach(im => { if (im.dataset.pid === p.id) im.src = p.thumb; });
    if (S.view === 'library') renderGrid();
    renderStrip(); if (S.view === 'edit') drawNavigator();
    if (own) requestRender();
  } catch (e) { console.error(e); }
}
let thumbTimer = 0;
function scheduleThumb() { clearTimeout(thumbTimer); thumbTimer = setTimeout(() => { const p = ph(); if (p) refreshThumb(p); }, 1800); }

/* ============================== brush masks ============================== */
const brushCanv = new Map(); // key photoId:maskId -> {canvas, n}
function brushSize(handle) { const L = 1024; return handle.w >= handle.h ? [L, Math.max(1, Math.round(L * handle.h / handle.w))] : [Math.max(1, Math.round(L * handle.w / handle.h)), L]; }
function drawDabs(ctx, st, from, bw, bh) {
  const r = Math.max(0.5, st.r * bh), pts = st.pts;
  ctx.fillStyle = st.e ? '#000' : '#fff';
  for (let i = from; i < pts.length; i += 2) {
    const x = pts[i] * bw, y = pts[i + 1] * bh;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = st.e ? '0,0,0' : '255,255,255';
    g.addColorStop(0, `rgba(${c},${st.a})`); g.addColorStop(Math.max(0, Math.min(0.99, 1 - st.f)), `rgba(${c},${st.a})`); g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
}
function maskCanvas(pid, m, bw, bh) {
  const key = pid + ':' + m.id; let e = brushCanv.get(key);
  const sig = m.strokes.length + ':' + m.strokes.reduce((a, s) => a + s.pts.length, 0);
  if (e && e.canvas.width === bw && e.canvas.height === bh && e.sig === sig) return e;
  const c = e && e.canvas.width === bw && e.canvas.height === bh ? e.canvas : document.createElement('canvas'); c.width = bw; c.height = bh;
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, bw, bh);
  m.strokes.forEach(st => drawDabs(ctx, st, 0, bw, bh));
  e = { canvas: c, ctx, sig }; brushCanv.set(key, e); return e;
}
let brushVersion = 1;
function buildBrush(edits, handle, pid) {
  const [bw, bh] = brushSize(handle);
  const data = [new Uint8Array(bw * bh * 4), new Uint8Array(bw * bh * 4)];
  let any = false;
  edits.masks.slice(0, 8).forEach((m, i) => {
    if (m.type !== 'brush') return; any = true;
    const e = maskCanvas(pid, m, bw, bh); const px = e.ctx.getImageData(0, 0, bw, bh).data;
    const d = data[i >> 2], ch = i & 3; for (let k = 0, n = bw * bh; k < n; k++) d[k * 4 + ch] = px[k * 4];
  });
  return { w: bw, h: bh, data, version: brushVersion++, any };
}
function currentBrush() { if (!brushState) brushState = buildBrush(P(), img, ph().id); return brushState; }
function invalidateBrush() { brushState = null; }

/* ============================== history ============================== */
function pushHistoryFor(p, label) {
  p.history = p.history.slice(0, p.hIndex + 1);
  p.history.push({ label, edits: U.clone(p.edits) });
  if (p.history.length > 80) p.history.splice(1, p.history.length - 80);
  p.hIndex = p.history.length - 1; savePhoto(p);
}
function commit(label) {
  const p = ph(); if (!p) return;
  pushHistoryFor(p, label); renderHistory(); markMods(); scheduleThumb();
}
function gotoHistory(i) {
  const p = ph(); if (!p || i < 0 || i >= p.history.length) return;
  p.hIndex = i; p.edits = U.clone(p.history[i].edits); savePhoto(p); invalidateBrush();
  renderEditRight(); renderHistory(); requestRender(); scheduleThumb();
}
const undo = () => { const p = ph(); if (p) gotoHistory(p.hIndex - 1); };
const redo = () => { const p = ph(); if (p) gotoHistory(p.hIndex + 1); };

/* ============================== sliders ============================== */
function fmtVal(v, step) { if (step < 0.1) return (v > 0 ? '+' : '') + v.toFixed(2); if (step < 1) return v.toFixed(1); return (v > 0 && step >= 1 ? '+' : '') + Math.round(v); }
function slider(id, label, min, max, step, get, set, opts = {}) {
  const def = opts.def !== undefined ? opts.def : 0;
  const out = h('output', { for: id });
  const inp = h('input', { type: 'range', id, min, max, step, 'aria-label': label });
  const row = h('div', { class: 'sl' }, h('label', { for: id, text: label, title: 'Double-click to reset', ondblclick: () => { set(def); sync(); opts.onCommit && opts.onCommit(label); } }), inp, out);
  if (opts.track) inp.style.setProperty('--trk', opts.track);
  const show = opts.fmt || ((v) => fmtVal(v, step));
  function sync() { const v = get(); inp.value = v; out.textContent = show(v); row.classList.toggle('mod', Math.abs(v - def) > 1e-9); }
  inp.addEventListener('input', () => { set(+inp.value); out.textContent = show(+inp.value); row.classList.toggle('mod', Math.abs(+inp.value - def) > 1e-9); });
  inp.addEventListener('change', () => opts.onCommit && opts.onCommit(label));
  sync(); row.sync = sync; return row;
}
function pSlider(key, label, min, max, step, opts = {}) {
  return slider('s-' + key, label, min, max, step, () => P()[key], (v) => { P()[key] = v; requestRender(); }, Object.assign({ def: DEF[key], onCommit: commit }, opts));
}
function arrSlider(key, i, label, min, max, opts = {}) {
  return slider(`s-${key}-${i}`, label, min, max, 1, () => P()[key][i], (v) => { P()[key][i] = v; requestRender(); }, Object.assign({ def: 0, onCommit: (l) => commit(`${l} ${key === 'hslH' ? 'hue' : key === 'hslS' ? 'saturation' : key === 'hslL' ? 'luminance' : 'B&W mix'}`) }, opts));
}
function markMods() {
  const p = P(); if (!p) return;
  const groupsFor = { basic: ['treatment', 'wb', 'tone', 'presence'], curve: ['curve'], mixer: ['mixer'], grading: ['grading'], detail: ['detail'], lens: ['lens'], transform: ['transform'], effects: ['effects'], calibration: ['calibration'] };
  for (const [sec, gs] of Object.entries(groupsFor)) {
    const el = document.getElementById('sec-' + sec); if (!el) continue;
    el.classList.toggle('mod', gs.some(g => GROUPS[g][1].some(k => !isDefault(k, p[k]))));
  }
}
function resetGroup(gs, label) {
  const p = P(); gs.forEach(g => GROUPS[g][1].forEach(k => p[k] = U.clone(DEF[k])));
  invalidateBrush(); commit('Reset ' + label); renderEditRight(); requestRender();
}
function resetAct(gs, label) { return h('button', { class: 'act btn sm ghost', title: 'Reset ' + label, onclick: (e) => { e.stopPropagation(); resetGroup(gs, label); } }, 'Reset'); }

/* ============================== edit: right panel ============================== */
const ICONS = {
  crop: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 1v14h14M1 5h14v14"/></svg>',
  heal: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="13" r="4"/><circle cx="14" cy="6" r="4" stroke-dasharray="2 2"/></svg>',
  mask: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7"/><path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor"/></svg>',
  wb: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13 3l4 4-9 9H4v-4z"/><path d="M11 5l4 4"/></svg>',
  clip: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 17h16M4 17l4-9 3 5 2-3 3 7"/></svg>'
};
function renderEditRight() {
  const R = $('#right'); const st = R.scrollTop; R.innerHTML = '';
  if (!ph()) return;
  const histo = h('div', { class: 'histo' }, h('div', { class: 'clipb' }, h('canvas', { id: 'histo', width: 576, height: 184 }),
    h('button', { class: 'clipdot l' + (S.showClip ? ' on' : ''), title: 'Show clipping (J)', 'aria-label': 'Show shadow clipping', onclick: toggleClip }),
    h('button', { class: 'clipdot r' + (S.showClip ? ' on' : ''), title: 'Show clipping (J)', 'aria-label': 'Show highlight clipping', onclick: toggleClip })),
    h('div', { class: 'meta', id: 'histoMeta' }));
  R.append(histo);
  const tb = (id, label, key) => h('button', { class: S.tool === id ? 'on' : '', title: `${label} (${key})`, onclick: () => setTool(S.tool === id ? null : id), html: ICONS[id] + `<span>${label}</span>` });
  R.append(h('div', { class: 'tools' }, tb('crop', 'Crop', 'R'), tb('heal', 'Heal', 'Q'), tb('mask', 'Masks', 'M'), tb('wb', 'WB pick', 'W'),
    h('button', { class: S.showClip ? 'on' : '', title: 'Clipping (J)', onclick: toggleClip, html: ICONS.clip + '<span>Clipping</span>' })));
  if (S.tool === 'crop') R.append(cropPanel());
  if (S.tool === 'heal') R.append(healPanel());
  if (S.tool === 'mask') R.append(maskPanel());
  R.append(basicPanel(), curvePanel(), mixerPanel(), gradingPanel(), detailPanel(), lensPanel(), transformPanel(), effectsPanel(), calibrationPanel());
  markMods(); drawHistogram(); R.scrollTop = st;
}
function toggleClip() { S.showClip = !S.showClip; document.querySelectorAll('.clipdot').forEach(d => d.classList.toggle('on', S.showClip)); const t = [...document.querySelectorAll('.tools button')].pop(); t && t.classList.toggle('on', S.showClip); requestRender(); }

function basicPanel() {
  const p = P();
  const tr = h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'Treatment' }),
    h('div', { class: 'seg' }, h('button', { class: !p.bw ? 'on' : '', onclick: () => { P().bw = false; commit('Color'); renderEditRight(); requestRender(); } }, 'Color'), h('button', { class: p.bw ? 'on' : '', onclick: () => { P().bw = true; commit('Black & white'); renderEditRight(); requestRender(); } }, 'B&W')));
  const wbRow = h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'White balance' }),
    h('button', { class: 'btn sm' + (S.tool === 'wb' ? ' on' : ''), onclick: () => setTool(S.tool === 'wb' ? null : 'wb') }, 'Pick neutral'),
    h('button', { class: 'btn sm', onclick: () => { Object.assign(P(), autoWB(img, P())); commit('Auto white balance'); renderEditRight(); requestRender(); } }, 'Auto'));
  const toneRow = h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'Tone' }),
    h('button', { class: 'btn sm', onclick: () => { Object.assign(P(), autoTone(img, P())); commit('Auto tone'); renderEditRight(); requestRender(); } }, 'Auto'));
  return section('basic', 'Basic', [tr, wbRow,
    pSlider('temp', 'Temperature', -100, 100, 1, { track: 'linear-gradient(90deg,#4f7fd8,#ccc 50%,#e2b23c)' }),
    pSlider('tint', 'Tint', -100, 100, 1, { track: 'linear-gradient(90deg,#4fb548,#ccc 50%,#c64bb4)' }),
    toneRow,
    pSlider('exposure', 'Exposure', -5, 5, 0.01), pSlider('contrast', 'Contrast', -100, 100, 1),
    pSlider('highlights', 'Highlights', -100, 100, 1), pSlider('shadows', 'Shadows', -100, 100, 1),
    pSlider('whites', 'Whites', -100, 100, 1), pSlider('blacks', 'Blacks', -100, 100, 1),
    h('div', { class: 'sub', text: 'Presence' }),
    pSlider('texture', 'Texture', -100, 100, 1), pSlider('clarity', 'Clarity', -100, 100, 1), pSlider('dehaze', 'Dehaze', -100, 100, 1),
    pSlider('vibrance', 'Vibrance', -100, 100, 1), pSlider('saturation', 'Saturation', -100, 100, 1)], { action: resetAct(['treatment', 'wb', 'tone', 'presence'], 'basic') });
}

/* ---- tone curve editor ---- */
function curvePanel() {
  const cv = h('canvas', { id: 'curveCv', width: 520, height: 520, 'aria-label': 'Tone curve. Click to add a point, drag to move, double-click a point to remove it.' });
  const chs = h('div', { class: 'seg' }, [['rgb', 'RGB'], ['r', 'Red'], ['g', 'Green'], ['b', 'Blue']].map(([k, t]) => h('button', { class: S.curveCh === k ? 'on' : '', onclick: () => { S.curveCh = k; renderEditRight(); } }, t)));
  const mode = h('div', { class: 'seg' }, [['point', 'Point'], ['param', 'Region']].map(([k, t]) => h('button', { class: S.curveMode === k ? 'on' : '', onclick: () => { S.curveMode = k; renderEditRight(); } }, t)));
  const body = [h('div', { class: 'row' }, mode, S.curveMode === 'point' ? chs : null), h('div', { class: 'curvebox' }, cv)];
  if (S.curveMode === 'param') body.push(pSlider('pcHigh', 'Highlights', -100, 100, 1), pSlider('pcLight', 'Lights', -100, 100, 1), pSlider('pcDark', 'Darks', -100, 100, 1), pSlider('pcShadow', 'Shadows', -100, 100, 1),
    h('div', { class: 'sub', text: 'Region splits' }), pSlider('pcS1', 'Shadows / darks', 5, 45, 1, { fmt: v => v }), pSlider('pcS2', 'Darks / lights', 30, 70, 1, { fmt: v => v }), pSlider('pcS3', 'Lights / highs', 55, 95, 1, { fmt: v => v }));
  else body.push(h('div', { class: 'empty', style: { padding: 0 }, text: 'Click to add a point. Drag to shape. Double-click a point to remove it.' }));
  const sec = section('curve', 'Tone curve', body, { action: resetAct(['curve'], 'tone curve') });
  setTimeout(() => setupCurve(cv), 0);
  return sec;
}
let curveHist = null;
function drawCurve(cv) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, p = P(); g.clearRect(0, 0, W, H);
  if (curveHist) { g.fillStyle = 'rgba(255,255,255,0.06)'; const mx = Math.max(...curveHist.l.slice(2, 254)) || 1; g.beginPath(); g.moveTo(0, H); for (let i = 0; i < 256; i++) g.lineTo(i / 255 * W, H - Math.min(1, curveHist.l[i] / mx) * H * 0.9); g.lineTo(W, H); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1;
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * W / 4, 0); g.lineTo(i * W / 4, H); g.moveTo(0, i * H / 4); g.lineTo(W, i * H / 4); g.stroke(); }
  g.beginPath(); g.moveTo(0, H); g.lineTo(W, 0); g.strokeStyle = 'rgba(255,255,255,0.12)'; g.stroke();
  const col = { rgb: '#e4e4e4', r: '#ff5a5a', g: '#6bd36b', b: '#5b8cff' };
  if (S.curveMode === 'param') {
    const lut = Engine.buildLutPublic ? null : null;
    const pts = buildParamPreview(p);
    g.strokeStyle = col.rgb; g.lineWidth = 3; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x * W, H - y * H) : g.moveTo(x * W, H - y * H)); g.stroke();
    g.fillStyle = 'rgba(228,165,76,0.6)'; [p.pcS1, p.pcS2, p.pcS3].forEach(s => g.fillRect(s / 100 * W - 1, H - 10, 2, 10));
    return;
  }
  const chans = S.curveCh === 'rgb' ? ['rgb'] : ['rgb', S.curveCh];
  for (const ch of chans) {
    const f = U.monotone(p.curve[ch]); const active = ch === S.curveCh;
    g.strokeStyle = active ? col[ch] : 'rgba(255,255,255,0.25)'; g.lineWidth = active ? 3 : 1.5; g.beginPath();
    for (let i = 0; i <= 128; i++) { const x = i / 128, y = U.clamp(f(x), 0, 1); i ? g.lineTo(x * W, H - y * H) : g.moveTo(x * W, H - y * H); } g.stroke();
    if (active) p.curve[ch].forEach(([x, y]) => { g.fillStyle = '#121315'; g.strokeStyle = col[ch]; g.lineWidth = 3; g.beginPath(); g.arc(x * W, H - y * H, 9, 0, Math.PI * 2); g.fill(); g.stroke(); });
  }
}
function buildParamPreview(p) {
  const s1 = p.pcS1 / 100, s2 = p.pcS2 / 100, s3 = p.pcS3 / 100;
  const bump = (x, a, b) => { if (x <= a || x >= b) return 0; const t = (x - a) / (b - a); const s = Math.sin(Math.PI * t); return s * s; };
  const pts = []; for (let i = 0; i <= 128; i++) { const x = i / 128; pts.push([x, U.clamp(x + 0.22 * (p.pcShadow / 100 * bump(x, 0, s2) + p.pcDark / 100 * bump(x, s1 * 0.4, s3) + p.pcLight / 100 * bump(x, s1, 1 - (1 - s3) * 0.4) + p.pcHigh / 100 * bump(x, s2, 1)), 0, 1)]); }
  return pts;
}
function setupCurve(cv) {
  drawCurve(cv);
  if (S.curveMode !== 'point') return;
  let drag = -1;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [U.clamp((e.clientX - r.left) / r.width, 0, 1), U.clamp(1 - (e.clientY - r.top) / r.height, 0, 1)]; };
  const hit = (x, y) => P().curve[S.curveCh].findIndex(([px, py]) => Math.hypot(px - x, py - y) < 0.045);
  cv.addEventListener('pointerdown', (e) => {
    const [x, y] = pos(e); const pts = P().curve[S.curveCh]; let i = hit(x, y);
    if (i < 0) { pts.push([x, y]); pts.sort((a, b) => a[0] - b[0]); i = pts.findIndex(q => q[0] === x && q[1] === y); }
    drag = i; cv.setPointerCapture(e.pointerId); drawCurve(cv); requestRender();
  });
  cv.addEventListener('pointermove', (e) => {
    if (drag < 0) return; const [x, y] = pos(e); const pts = P().curve[S.curveCh];
    const lo = drag > 0 ? pts[drag - 1][0] + 0.01 : 0, hi = drag < pts.length - 1 ? pts[drag + 1][0] - 0.01 : 1;
    pts[drag] = [U.clamp(x, lo, hi), y]; drawCurve(cv); requestRender();
  });
  const up = () => { if (drag >= 0) { drag = -1; commit('Tone curve'); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('dblclick', (e) => { const [x, y] = pos(e); const pts = P().curve[S.curveCh]; const i = hit(x, y); if (i > 0 && i < pts.length - 1 || (i >= 0 && pts.length > 2)) { pts.splice(i, 1); drawCurve(cv); requestRender(); commit('Tone curve'); } });
}

/* ---- color mixer ---- */
function mixerPanel() {
  const p = P(); const body = [];
  if (p.bw) {
    body.push(h('div', { class: 'empty', style: { padding: 0 }, text: 'Black & white mix: set how bright each original color becomes in grey.' }));
    HUES.forEach((n, i) => body.push(arrSlider('bwMix', i, n, -100, 100, { track: `linear-gradient(90deg,#111,${HUE_COL[i]},#eee)` })));
  } else {
    body.push(h('div', { class: 'seg' }, [['all', 'All'], ['hslH', 'Hue'], ['hslS', 'Saturation'], ['hslL', 'Luminance']].map(([k, t]) => h('button', { class: S.mixProp === k ? 'on' : '', onclick: () => { S.mixProp = k; renderEditRight(); } }, t))));
    const props = S.mixProp === 'all' ? ['hslH', 'hslS', 'hslL'] : [S.mixProp];
    for (const k of props) {
      if (props.length > 1) body.push(h('div', { class: 'sub', text: { hslH: 'Hue', hslS: 'Saturation', hslL: 'Luminance' }[k] }));
      HUES.forEach((n, i) => {
        const tr = k === 'hslH' ? `linear-gradient(90deg,${HUE_COL[(i + 7) % 8]},${HUE_COL[i]},${HUE_COL[(i + 1) % 8]})` : k === 'hslS' ? `linear-gradient(90deg,#888,${HUE_COL[i]})` : `linear-gradient(90deg,#111,${HUE_COL[i]},#fff)`;
        body.push(arrSlider(k, i, n, -100, 100, { track: tr }));
      });
    }
  }
  return section('mixer', p.bw ? 'B&W mix' : 'Color mixer', body, { action: resetAct(['mixer'], 'color mixer') });
}

/* ---- color grading wheels ---- */
function wheel(key, label, big) {
  const cv = h('canvas', { width: 300, height: 300, 'aria-label': label + ' color wheel' });
  const w = h('div', { class: 'wheel' + (big ? ' big' : '') }, h('div', { class: 'wl', text: label }), cv,
    slider(`s-${key}L`, 'Luminance', -100, 100, 1, () => P()[key + 'L'], (v) => { P()[key + 'L'] = v; requestRender(); }, { def: 0, onCommit: () => commit(label + ' luminance') }));
  const draw = () => {
    const g = cv.getContext('2d'), W = 300, c = W / 2, r = c - 12; g.clearRect(0, 0, W, W);
    for (let a = 0; a < 360; a += 2) { g.beginPath(); g.moveTo(c, c); g.arc(c, c, r, (a - 1) * Math.PI / 180, (a + 2) * Math.PI / 180); const [R, G, B] = U.hsv2rgb(a / 360, 1, 1); g.fillStyle = `rgb(${R * 255},${G * 255},${B * 255})`; g.fill(); }
    const gr = g.createRadialGradient(c, c, 0, c, c, r); gr.addColorStop(0, 'rgba(60,62,66,1)'); gr.addColorStop(1, 'rgba(60,62,66,0)'); g.fillStyle = gr; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
    const hh = P()[key + 'H'], s = P()[key + 'S'] / 100; const a = -hh * Math.PI / 180;
    const x = c + Math.cos(a) * r * s, y = c + Math.sin(a) * r * s;
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '22px JetBrains Mono, monospace'; g.textAlign = 'center'; g.fillText(s > 0 ? `${Math.round(hh)}° ${Math.round(s * 100)}` : '', c, W - 2);
  };
  let dragging = false;
  const set = (e) => { const rc = cv.getBoundingClientRect(); const x = (e.clientX - rc.left) / rc.width * 300 - 150, y = (e.clientY - rc.top) / rc.height * 300 - 150; const r = Math.hypot(x, y) / 138; let a = -Math.atan2(y, x) * 180 / Math.PI; if (a < 0) a += 360; P()[key + 'H'] = Math.round(a); P()[key + 'S'] = Math.round(U.clamp(r, 0, 1) * 100 * (e.shiftKey ? 0.5 : 1)); draw(); requestRender(); };
  cv.addEventListener('pointerdown', (e) => { dragging = true; cv.setPointerCapture(e.pointerId); set(e); });
  cv.addEventListener('pointermove', (e) => dragging && set(e));
  cv.addEventListener('pointerup', () => { if (dragging) { dragging = false; commit(label + ' color'); } });
  cv.addEventListener('dblclick', () => { P()[key + 'S'] = 0; draw(); requestRender(); commit(label + ' reset'); });
  setTimeout(draw, 0);
  return w;
}
function gradingPanel() {
  return section('grading', 'Color grading', [h('div', { class: 'wheels' }, wheel('gs', 'Shadows'), wheel('gh', 'Highlights'), wheel('gm', 'Midtones'), wheel('gg', 'Global')),
    pSlider('gradeBlend', 'Blending', 0, 100, 1, { fmt: v => v }), pSlider('gradeBalance', 'Balance', -100, 100, 1)], { action: resetAct(['grading'], 'color grading') });
}
function detailPanel() {
  return section('detail', 'Detail', [h('div', { class: 'sub', style: { marginTop: 0 }, text: 'Sharpening' }),
    pSlider('sharpen', 'Amount', 0, 150, 1, { fmt: v => v }), pSlider('sharpRadius', 'Radius', 0.5, 3, 0.1), pSlider('sharpDetail', 'Detail', 0, 100, 1, { fmt: v => v }), pSlider('sharpMask', 'Masking', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'sub', text: 'Noise reduction' }),
    pSlider('nrLum', 'Luminance', 0, 100, 1, { fmt: v => v }), pSlider('nrDetail', 'Detail', 0, 100, 1, { fmt: v => v }), pSlider('nrColor', 'Color', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'empty', style: { padding: 0 }, text: 'Zoom to 100% (Z) to judge sharpening and noise.' })], { action: resetAct(['detail'], 'detail') });
}
function lensPanel() {
  return section('lens', 'Lens corrections', [pSlider('distortion', 'Distortion', -100, 100, 1),
    pSlider('lensVig', 'Vignetting', -100, 100, 1), pSlider('lensVigMid', 'Midpoint', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'sub', text: 'Chromatic aberration' }),
    pSlider('caRed', 'Red / cyan', -100, 100, 1), pSlider('caBlue', 'Blue / yellow', -100, 100, 1),
    pSlider('defPurple', 'Purple fringe', 0, 100, 1, { fmt: v => v }), pSlider('defGreen', 'Green fringe', 0, 100, 1, { fmt: v => v })], { action: resetAct(['lens'], 'lens corrections') });
}
function transformPanel() {
  return section('transform', 'Transform', [h('div', { class: 'empty', style: { padding: 0 }, text: 'Fix converging lines: Vertical for buildings shot looking up, Horizontal for walls shot at an angle.' }),
    pSlider('tVert', 'Vertical', -100, 100, 1), pSlider('tHorz', 'Horizontal', -100, 100, 1), pSlider('tRot', 'Rotate', -10, 10, 0.1),
    pSlider('tAspect', 'Aspect', -100, 100, 1), pSlider('tScale', 'Scale', 50, 150, 1, { fmt: v => v + '%' }), pSlider('tX', 'Offset X', -100, 100, 1), pSlider('tY', 'Offset Y', -100, 100, 1)], { action: resetAct(['transform'], 'transform') });
}
function effectsPanel() {
  return section('effects', 'Effects', [h('div', { class: 'sub', style: { marginTop: 0 }, text: 'Vignette (after crop)' }),
    pSlider('vig', 'Amount', -100, 100, 1), pSlider('vigMid', 'Midpoint', 0, 100, 1, { fmt: v => v }), pSlider('vigRound', 'Roundness', -100, 100, 1), pSlider('vigFeather', 'Feather', 0, 100, 1, { fmt: v => v }), pSlider('vigHigh', 'Highlights', 0, 100, 1, { fmt: v => v }),
    h('div', { class: 'sub', text: 'Grain' }),
    pSlider('grain', 'Amount', 0, 100, 1, { fmt: v => v }), pSlider('grainSize', 'Size', 0, 100, 1, { fmt: v => v }), pSlider('grainRough', 'Roughness', 0, 100, 1, { fmt: v => v })], { action: resetAct(['effects'], 'effects') });
}
function calibrationPanel() {
  return section('calibration', 'Calibration', [pSlider('calShadow', 'Shadows tint', -100, 100, 1, { track: 'linear-gradient(90deg,#4fb548,#888 50%,#c64bb4)' }),
    h('div', { class: 'sub', text: 'Red primary' }), pSlider('calRH', 'Hue', -100, 100, 1, { track: 'linear-gradient(90deg,#d64bb0,#e0433c,#ec8a2c)' }), pSlider('calRS', 'Saturation', -100, 100, 1),
    h('div', { class: 'sub', text: 'Green primary' }), pSlider('calGH', 'Hue', -100, 100, 1, { track: 'linear-gradient(90deg,#e8cf35,#4fb548,#3fc1c4)' }), pSlider('calGS', 'Saturation', -100, 100, 1),
    h('div', { class: 'sub', text: 'Blue primary' }), pSlider('calBH', 'Hue', -100, 100, 1, { track: 'linear-gradient(90deg,#3fc1c4,#3f6fe0,#8b52d6)' }), pSlider('calBS', 'Saturation', -100, 100, 1)], { action: resetAct(['calibration'], 'calibration') });
}

/* ============================== tool panels ============================== */
const ASPECTS = [['original', 'Original'], ['free', 'Free'], ['1', '1 : 1'], ['1.25', '4 : 5'], ['1.4', '5 : 7'], ['1.3333', '3 : 4'], ['1.5', '2 : 3'], ['1.7778', '16 : 9'], ['2.39', '2.39 : 1']];
function cropRatio() {
  if (S.cropAspect === 'free') return null;
  const F = Engine.frame(img, P());
  let r = S.cropAspect === 'original' ? F.hw / F.hh : +S.cropAspect;
  if (S.cropAspect !== 'original' && F.hw < F.hh) r = 1 / r;
  if (S.cropPortrait) r = 1 / r;
  return r;
}
function ensureCrop() { const p = P(); if (!p.crop) { const F = Engine.frame(img, p); p.crop = { cx: 0, cy: 0, hw: F.hw, hh: F.hh, angle: 0 }; } return p.crop; }
function applyAspect() {
  const c = ensureCrop(), r = cropRatio(); if (!r) return;
  const area = c.hw * c.hh; c.hw = Math.sqrt(area * r); c.hh = c.hw / r; constrainCrop(c, true);
}
function constrainCrop(c, grow) {
  if (!S.constrain) return;
  const F = Engine.frame(img, P());
  const a = c.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const inside = (cx, cy, hw, hh) => [[1, 1], [1, -1], [-1, 1], [-1, -1]].every(([sx, sy]) => { const x = cx + ca * sx * hw - sa * sy * hh, y = cy + sa * sx * hw + ca * sy * hh; return Math.abs(x) <= F.hw + 1e-6 && Math.abs(y) <= F.hh + 1e-6; });
  c.cx = U.clamp(c.cx, -F.hw, F.hw); c.cy = U.clamp(c.cy, -F.hh, F.hh);
  if (inside(c.cx, c.cy, c.hw, c.hh)) return;
  // first try sliding the centre inwards, then shrink
  for (let k = 0; k < 20 && !inside(c.cx, c.cy, c.hw, c.hh); k++) { c.cx *= 0.9; c.cy *= 0.9; }
  let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; inside(c.cx, c.cy, c.hw * m, c.hh * m) ? lo = m : hi = m; }
  c.hw *= lo; c.hh *= lo;
}
function cropPanel() {
  const p = P();
  const asp = h('select', { id: 'cropAspect', onchange: (e) => { S.cropAspect = e.target.value; applyAspect(); commit('Crop aspect'); requestRender(); } }, ASPECTS.map(([v, t]) => h('option', { value: v, text: t })));
  asp.value = S.cropAspect;
  const ang = slider('s-cropAngle', 'Straighten', -45, 45, 0.1, () => (P().crop ? P().crop.angle : 0), (v) => { const c = ensureCrop(); c.angle = v; constrainCrop(c); requestRender(); }, { def: 0, onCommit: () => commit('Straighten'), fmt: v => v.toFixed(1) + '°' });
  const orient = (d) => { const q = P(); q.orient = (q.orient + d + 4) % 4; q.crop = null; commit(d > 0 ? 'Rotate right' : 'Rotate left'); renderEditRight(); layoutStage(); requestRender(); };
  return section('croptool', 'Crop & straighten', [
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: 'Aspect' }), asp,
      h('button', { class: 'btn sm', title: 'Swap portrait / landscape', onclick: () => { S.cropPortrait = !S.cropPortrait; applyAspect(); commit('Crop orientation'); requestRender(); } }, '⇄')),
    ang,
    h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => orient(-1) }, '⟲ 90°'), h('button', { class: 'btn sm', onclick: () => orient(1) }, '⟳ 90°'),
      h('button', { class: 'btn sm' + (p.flipH ? ' on' : ''), onclick: () => { P().flipH = !P().flipH; commit('Flip horizontal'); renderEditRight(); requestRender(); } }, 'Flip ↔'),
      h('button', { class: 'btn sm' + (p.flipV ? ' on' : ''), onclick: () => { P().flipV = !P().flipV; commit('Flip vertical'); renderEditRight(); requestRender(); } }, 'Flip ↕')),
    h('label', { class: 'chk' }, h('input', { type: 'checkbox', id: 'cropConstrain', checked: S.constrain, onchange: (e) => { S.constrain = e.target.checked; if (S.constrain && P().crop) { constrainCrop(P().crop); requestRender(); } } }), 'Keep crop inside the photo'),
    h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => { P().crop = null; commit('Reset crop'); renderEditRight(); requestRender(); } }, 'Reset crop'), h('span', { style: { flex: 1 } }), h('button', { class: 'btn sm pri', onclick: () => setTool(null) }, 'Done')),
    h('div', { class: 'empty', style: { padding: 0 }, text: 'Drag corners or edges to crop, drag inside to move, drag outside the box to rotate.' })], { open: true });
}
function healPanel() {
  const p = P(), sp = p.spots[S.selSpot];
  const body = [h('div', { class: 'seg' }, [['heal', 'Heal'], ['clone', 'Clone'], ['redeye', 'Red eye']].map(([k, t]) => h('button', { class: S.heal.mode === k ? 'on' : '', onclick: () => { S.heal.mode = k; if (sp) { sp.mode = k; commit('Spot mode'); requestRender(); } renderEditRight(); } }, t))),
    slider('s-healSize', 'Size', 0.3, 20, 0.1, () => sp ? sp.r * 100 : S.heal.size, (v) => { S.heal.size = v; if (sp) { sp.r = v / 100; requestRender(); } drawOverlay(); }, { def: 3, fmt: v => v.toFixed(1), onCommit: () => sp && commit('Spot size') }),
    slider('s-healFeather', 'Feather', 0, 100, 1, () => sp ? sp.feather : S.heal.feather, (v) => { S.heal.feather = v; if (sp) { sp.feather = v; requestRender(); } }, { def: 40, fmt: v => v, onCommit: () => sp && commit('Spot feather') }),
    slider('s-healOpacity', 'Opacity', 0, 100, 1, () => sp ? sp.opacity : S.heal.opacity, (v) => { S.heal.opacity = v; if (sp) { sp.opacity = v; requestRender(); } }, { def: 100, fmt: v => v, onCommit: () => sp && commit('Spot opacity') }),
    h('div', { class: 'row' }, h('span', { class: 'sub', style: { margin: 0, flex: 1 }, text: `${p.spots.length} of 24 spots` }),
      h('button', { class: 'btn sm', disabled: !sp, onclick: deleteSpot }, 'Delete spot'), h('button', { class: 'btn sm', disabled: !p.spots.length, onclick: () => { P().spots = []; S.selSpot = -1; commit('Clear spots'); renderEditRight(); requestRender(); } }, 'Clear all')),
    h('div', { class: 'empty', style: { padding: 0 }, text: S.heal.mode === 'redeye' ? 'Click each pupil to remove red-eye.' : 'Click a blemish to fix it. Safelight picks a source area; drag the dashed circle to choose a better one.' })];
  return section('healtool', 'Healing', body, { open: true });
}
function deleteSpot() { const p = P(); if (S.selSpot < 0) return; p.spots.splice(S.selSpot, 1); S.selSpot = -1; commit('Delete spot'); renderEditRight(); requestRender(); }
function newMask(type) {
  const p = P(); if (p.masks.length >= 8) { toast('Up to 8 masks per photo.'); return; }
  const n = p.masks.filter(m => m.type === type).length + 1;
  const names = { linear: 'Linear gradient', radial: 'Radial gradient', brush: 'Brush', range: 'Range' };
  const m = { id: U.uid(), name: `${names[type]} ${n}`, type, invert: false, hidden: false, amount: 100, adj: maskAdj0(), range: { type: type === 'range' ? 'lum' : 'none', lo: 60, hi: 100, smooth: 15, hue: 210, tol: 30 }, strokes: [] };
  if (type === 'linear') m.geom = null;
  if (type === 'radial') m.geom = null;
  p.masks.push(m); S.selMask = p.masks.length - 1;
  S.maskCreate = (type === 'linear' || type === 'radial') ? type : null;
  if (type === 'range' || type === 'brush') commit('New mask');
  invalidateBrush(); renderEditRight(); requestRender();
  if (S.maskCreate) toast(type === 'linear' ? 'Drag across the photo: the effect is full where you start and fades out where you stop.' : 'Drag from the centre outwards to place the radial gradient.');
}
function maskPanel() {
  const p = P(); const m = p.masks[S.selMask];
  const body = [h('div', { class: 'row' }, ['linear', 'radial', 'brush', 'range'].map(t => h('button', { class: 'btn sm', onclick: () => newMask(t) }, '+ ' + { linear: 'Linear', radial: 'Radial', brush: 'Brush', range: 'Range' }[t])))];
  if (!p.masks.length) body.push(h('div', { class: 'empty', text: 'Masks apply local adjustments. Add a gradient, paint with a brush, or select by brightness or color.' }));
  p.masks.forEach((mk, i) => body.push(h('div', { class: 'maskrow' + (i === S.selMask ? ' on' : ''), onclick: () => { S.selMask = i; S.maskCreate = null; renderEditRight(); requestRender(); } },
    h('span', { class: 't', text: mk.name + (mk.range.type !== 'none' && mk.type !== 'range' ? ' · ' + mk.range.type : '') }),
    h('button', { class: 'iconbtn' + (mk.invert ? ' on' : ''), title: 'Invert', 'aria-label': 'Invert mask', onclick: (e) => { e.stopPropagation(); mk.invert = !mk.invert; commit('Invert mask'); renderEditRight(); requestRender(); } }, '◐'),
    h('button', { class: 'iconbtn' + (mk.hidden ? '' : ' on'), title: mk.hidden ? 'Show effect' : 'Hide effect', 'aria-label': 'Toggle mask', onclick: (e) => { e.stopPropagation(); mk.hidden = !mk.hidden; commit('Toggle mask'); renderEditRight(); requestRender(); } }, mk.hidden ? '○' : '●'),
    h('button', { class: 'iconbtn', title: 'Duplicate', 'aria-label': 'Duplicate mask', onclick: (e) => { e.stopPropagation(); if (p.masks.length >= 8) return; const c = U.clone(mk); c.id = U.uid(); c.name += ' copy'; p.masks.splice(i + 1, 0, c); S.selMask = i + 1; invalidateBrush(); commit('Duplicate mask'); renderEditRight(); requestRender(); } }, '⧉'),
    h('button', { class: 'iconbtn', title: 'Delete', 'aria-label': 'Delete mask', onclick: (e) => { e.stopPropagation(); p.masks.splice(i, 1); S.selMask = Math.min(S.selMask, p.masks.length - 1); invalidateBrush(); commit('Delete mask'); renderEditRight(); requestRender(); } }, '×'))));
  if (p.masks.length) body.push(h('label', { class: 'chk' }, h('input', { type: 'checkbox', id: 'maskOv', checked: S.maskOverlay, onchange: (e) => { S.maskOverlay = e.target.checked; requestRender(); } }), 'Show mask overlay (O)'));
  if (m) {
    const ms = (k, l, mn, mx, st) => slider(`s-m-${k}`, l, mn, mx, st, () => m.adj[k], (v) => { m.adj[k] = v; requestRender(); }, { def: 0, onCommit: () => commit(`Mask ${l.toLowerCase()}`) });
    body.push(h('div', { class: 'sub', text: m.name }),
      slider('s-m-amount', 'Amount', 0, 200, 1, () => m.amount, (v) => { m.amount = v; requestRender(); }, { def: 100, fmt: v => v + '%', onCommit: () => commit('Mask amount') }),
      ...MASK_ADJ.map(a => ms(...a)));
    if (m.type === 'radial' && m.geom) body.push(h('div', { class: 'sub', text: 'Shape' }),
      slider('s-m-feather', 'Feather', 0, 100, 1, () => m.geom.feather, (v) => { m.geom.feather = v; requestRender(); }, { def: 50, fmt: v => v, onCommit: () => commit('Mask feather') }),
      slider('s-m-angle', 'Angle', -90, 90, 1, () => m.geom.angle, (v) => { m.geom.angle = v; requestRender(); }, { def: 0, fmt: v => v + '°', onCommit: () => commit('Mask angle') }));
    if (m.type === 'brush') body.push(h('div', { class: 'sub', text: 'Brush' }),
      h('div', { class: 'seg' }, h('button', { class: !S.brush.erase ? 'on' : '', onclick: () => { S.brush.erase = false; renderEditRight(); } }, 'Paint'), h('button', { class: S.brush.erase ? 'on' : '', onclick: () => { S.brush.erase = true; renderEditRight(); } }, 'Erase')),
      slider('s-b-size', 'Size', 0.5, 40, 0.5, () => S.brush.size, (v) => S.brush.size = v, { def: 6, fmt: v => v.toFixed(1) }),
      slider('s-b-feather', 'Feather', 0, 100, 1, () => S.brush.feather, (v) => S.brush.feather = v, { def: 60, fmt: v => v }),
      slider('s-b-flow', 'Flow', 5, 100, 1, () => S.brush.flow, (v) => S.brush.flow = v, { def: 60, fmt: v => v }),
      h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => { m.strokes = []; invalidateBrush(); commit('Clear brush'); requestRender(); } }, 'Clear brush'), h('span', { class: 'empty', style: { padding: 0 }, text: 'Hold Alt to erase.' })));
    const r = m.range;
    body.push(h('div', { class: 'sub', text: m.type === 'range' ? 'Select by' : 'Refine by range' }),
      h('div', { class: 'seg' }, [...(m.type === 'range' ? [] : [['none', 'Off']]), ['lum', 'Luminance'], ['color', 'Color']].map(([k, t]) => h('button', { class: r.type === k ? 'on' : '', onclick: () => { r.type = k; commit('Mask range'); renderEditRight(); requestRender(); } }, t))));
    if (r.type === 'lum') body.push(
      slider('s-r-lo', 'From', 0, 100, 1, () => r.lo, (v) => { r.lo = v; requestRender(); }, { def: 60, fmt: v => v, onCommit: () => commit('Mask range') }),
      slider('s-r-hi', 'To', 0, 100, 1, () => r.hi, (v) => { r.hi = v; requestRender(); }, { def: 100, fmt: v => v, onCommit: () => commit('Mask range') }),
      slider('s-r-sm', 'Smoothness', 0, 50, 1, () => r.smooth, (v) => { r.smooth = v; requestRender(); }, { def: 15, fmt: v => v, onCommit: () => commit('Mask range') }));
    if (r.type === 'color') body.push(
      h('div', { class: 'row' }, h('button', { class: 'btn sm' + (S.picking === 'maskColor' ? ' on' : ''), onclick: () => { S.picking = S.picking === 'maskColor' ? null : 'maskColor'; renderEditRight(); updateHint(); } }, 'Pick color from photo'),
        h('span', { class: 'lbl', style: { width: '18px', height: '18px', background: `hsl(${r.hue},70%,50%)` } })),
      slider('s-r-hue', 'Hue', 0, 360, 1, () => r.hue, (v) => { r.hue = v; requestRender(); }, { def: 210, fmt: v => v + '°', track: 'linear-gradient(90deg,red,yellow,lime,cyan,blue,magenta,red)', onCommit: () => commit('Mask color') }),
      slider('s-r-tol', 'Tolerance', 2, 100, 1, () => r.tol, (v) => { r.tol = v; requestRender(); }, { def: 30, fmt: v => v, onCommit: () => commit('Mask color') }));
  }
  return section('masktool', 'Masks', body, { open: true });
}

/* ============================== auto tone & white balance ============================== */
function analyse(handle, e, zeroWB) {
  const q = defaults(); ['crop', 'orient', 'flipH', 'flipV'].forEach(k => q[k] = U.clone(e[k]));
  if (!zeroWB) { q.temp = e.temp; q.tint = e.tint; }
  const id = engine.renderSmall(handle, q, 256, null);
  if (img && handle === img) requestRender();
  return id;
}
function autoTone(handle, e) {
  const id = analyse(handle, e, false), d = id.data; const L = [];
  for (let i = 0; i < d.length; i += 4) L.push((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255);
  L.sort((a, b) => a - b); const pc = (q) => L[Math.min(L.length - 1, Math.floor(q * L.length))];
  const med = pc(0.5);
  const exposure = U.clamp(Math.log2(U.toLin(0.46) / Math.max(1e-4, U.toLin(med))) * 0.85, -3, 3);
  const g = Math.pow(2, exposure); const adj = (v) => U.clamp(U.toSrgb(U.toLin(v) * g), 0, 1.5);
  const p99 = adj(pc(0.995)), p01 = adj(pc(0.005)), hiShare = L.filter(v => adj(v) > 0.95).length / L.length;
  return {
    exposure: Math.round(exposure * 100) / 100,
    whites: Math.round(U.clamp((0.97 - p99) / 0.25 * 100, -60, 60)),
    blacks: Math.round(U.clamp((0.025 - p01) / 0.15 * 100, -60, 40)),
    highlights: Math.round(hiShare > 0.02 ? -U.clamp(hiShare * 500, 10, 60) : -10),
    shadows: Math.round(U.clamp((0.3 - adj(pc(0.15))) * 120, 0, 45)),
    contrast: 8, vibrance: Math.max(e.vibrance, 12)
  };
}
function wbFromRGB(r, g, b) {
  r = Math.max(r, 1e-4); g = Math.max(g, 1e-4); b = Math.max(b, 1e-4);
  const T = Math.log(b / r) / 1.6, Tn = (Math.log(g) - Math.log(r) - 0.8 * T) / 0.5;
  return { temp: Math.round(U.clamp(T * 100, -100, 100)), tint: Math.round(U.clamp(Tn * 100, -100, 100)) };
}
function autoWB(handle, e) {
  const id = analyse(handle, e, true), d = id.data; let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]); if (mx > 250 || mx < 10) continue; r += U.toLin(d[i] / 255); g += U.toLin(d[i + 1] / 255); b += U.toLin(d[i + 2] / 255); n++; }
  return n ? wbFromRGB(r / n, g / n, b / n) : {};
}
function pickWB(u, v) {
  const id = analyse(img, P(), true); const x = Math.round(u * (id.width - 1)), y = Math.round(v * (id.height - 1));
  let r = 0, g = 0, b = 0, n = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = U.clamp(x + dx, 0, id.width - 1), yy = U.clamp(y + dy, 0, id.height - 1), i = (yy * id.width + xx) * 4; r += U.toLin(id.data[i] / 255); g += U.toLin(id.data[i + 1] / 255); b += U.toLin(id.data[i + 2] / 255); n++; }
  Object.assign(P(), wbFromRGB(r / n, g / n, b / n)); commit('White balance picker'); renderEditRight(); requestRender();
}
function pickMaskColor(u, v) {
  const m = P().masks[S.selMask]; if (!m) return;
  const q = U.clone(P()); q.masks = []; const id = engine.renderSmall(img, q, 256, null);
  const x = Math.round(u * (id.width - 1)), y = Math.round(v * (id.height - 1)), i = (y * id.width + x) * 4;
  const R = id.data[i] / 255, G = id.data[i + 1] / 255, B = id.data[i + 2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
  let hh = 0; if (d > 0) { hh = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; hh *= 60; if (hh < 0) hh += 360; }
  m.range.hue = Math.round(hh); S.picking = null; commit('Mask color'); renderEditRight(); requestRender();
}

/* ============================== edit: left panel ============================== */
function renderEditLeft() {
  const L = $('#left'); const st = L.scrollTop; L.innerHTML = '';
  const p = ph(); if (!p) return;
  L.append(section('nav', 'Navigator', h('div', { class: 'nav' }, h('canvas', { id: 'navCv', width: 440, height: 300, 'aria-label': 'Navigator: click to move the zoomed view' }),
    h('div', { class: 'row', style: { marginTop: '8px' } }, h('div', { class: 'seg' }, [[0, 'Fit'], [0.5, '50%'], [1, '100%'], [2, '200%']].map(([z, t]) => h('button', { class: S.zoom === z ? 'on' : '', onclick: () => { S.zoom = z; layoutStage(); requestRender(); renderEditLeft(); } }, t)))))));
  // presets
  const groups = {}; [...BUILTIN, ...S.userPresets].forEach(pr => (groups[pr.group] = groups[pr.group] || []).push(pr));
  const plist = h('div', { class: 'list' });
  Object.entries(groups).forEach(([g, items]) => {
    plist.append(h('div', { class: 'sub', text: g }));
    items.forEach(pr => plist.append(h('button', { class: 'li', onclick: () => applyPreset(pr), title: 'Apply preset' }, h('span', { class: 't', text: pr.name }),
      pr.builtin ? null : h('button', { class: 'x', 'aria-label': 'Delete preset ' + pr.name, onclick: (e) => { e.stopPropagation(); confirmDlg(`Delete the preset “${pr.name}”?`, 'Delete', () => { S.userPresets = S.userPresets.filter(x => x !== pr); U.DB.del('presets', pr.id); renderEditLeft(); }); } }, '×'))));
  });
  const amt = S.lastPreset ? slider('s-presetAmt', 'Amount', 0, 200, 1, () => S.lastPreset.amount, (v) => { S.lastPreset.amount = v; blendPreset(); }, { def: 100, fmt: v => v + '%', onCommit: () => commit(`Preset amount ${S.lastPreset.amount}%`) }) : null;
  L.append(section('presets', 'Presets', [amt ? h('div', {}, h('div', { class: 'sub', style: { marginTop: 0 }, text: 'Applied: ' + S.lastPreset.name }), amt) : null, plist,
    h('div', { class: 'row', style: { marginTop: '6px' } }, h('button', { class: 'btn sm', onclick: savePresetDlg }, '+ Save current as preset'))]));
  // snapshots
  L.append(section('snaps', 'Snapshots', [h('div', { class: 'list' }, p.snapshots.length ? p.snapshots.map((s, i) => h('button', { class: 'li', onclick: () => { p.edits = U.clone(s.edits); invalidateBrush(); commit('Snapshot: ' + s.name); renderEditRight(); requestRender(); } }, h('span', { class: 't', text: s.name }), h('span', { class: 'n', text: new Date(s.at).toLocaleDateString() }),
    h('button', { class: 'x', 'aria-label': 'Delete snapshot', onclick: (e) => { e.stopPropagation(); p.snapshots.splice(i, 1); savePhoto(p); renderEditLeft(); } }, '×'))) : h('div', { class: 'empty', text: 'Save versions of this edit to compare or return to later.' })),
    h('div', { class: 'row', style: { marginTop: '6px' } }, h('button', { class: 'btn sm', onclick: () => { const name = h('input', { type: 'text', id: 'snapName', value: 'Version ' + (p.snapshots.length + 1) }); dialog('New snapshot', [h('label', { class: 'field' }, h('span', { text: 'Name' }), name)], 'Save', () => { p.snapshots.push({ name: name.value.trim() || 'Snapshot', at: Date.now(), edits: U.clone(p.edits) }); savePhoto(p); renderEditLeft(); }); setTimeout(() => name.select(), 30); } }, '+ Snapshot'))]));
  L.append(section('hist', 'History', h('div', { class: 'list', id: 'histList' })));
  L.append(section('photoAct', 'Photo', h('div', { class: 'row' },
    h('button', { class: 'btn sm', onclick: () => { P() && Object.assign(p.edits, defaults()); invalidateBrush(); commit('Reset all'); renderEditRight(); requestRender(); } }, 'Reset all'),
    h('button', { class: 'btn sm', onclick: () => virtualCopy(p) }, 'Virtual copy'))));
  renderHistory(); drawNavigator(); L.scrollTop = st;
}
function renderHistory() {
  const el = $('#histList'); const p = ph(); if (!el || !p) return; el.innerHTML = '';
  for (let i = p.history.length - 1; i >= 0; i--) {
    el.append(h('button', { class: 'li' + (i === p.hIndex ? ' on' : ''), style: i > p.hIndex ? { opacity: 0.5 } : null, onclick: () => gotoHistory(i) }, h('span', { class: 't', text: p.history[i].label })));
  }
}
function applyPreset(pr) {
  const p = P(); const base = U.clone(p);
  for (const [k, v] of Object.entries(pr.values)) p[k] = U.clone(v);
  S.lastPreset = { name: pr.name, base, applied: U.clone(p), amount: 100 };
  commit('Preset: ' + pr.name); renderEditLeft(); renderEditRight(); requestRender();
}
function blendPreset() {
  const lp = S.lastPreset, p = P(), t = lp.amount / 100;
  for (const k of Object.keys(DEF)) {
    const a = lp.base[k], b = lp.applied[k];
    if (typeof a === 'number' && typeof b === 'number') p[k] = a + (b - a) * t;
    else if (Array.isArray(a) && typeof a[0] === 'number' && a.length === b.length) p[k] = a.map((x, i) => x + (b[i] - x) * t);
    else if (k === 'curve') { const o = {}; for (const ch of ['rgb', 'r', 'g', 'b']) { const ca = a[ch], cb = b[ch]; o[ch] = JSON.stringify(ca) === JSON.stringify(cb) ? U.clone(ca) : cb.map(([x, y]) => [x, U.clamp(x + (y - x) * t, 0, 1)]); } p[k] = o; }
    else p[k] = U.clone(t >= 0.5 ? b : a);
  }
  requestRender(); clearTimeout(blendPreset.t); blendPreset.t = setTimeout(() => renderEditRight(), 120);
}
function savePresetDlg() {
  const name = h('input', { type: 'text', id: 'prName', value: 'My look' });
  const group = h('input', { type: 'text', id: 'prGroup', value: 'My presets' });
  const keys = Object.keys(GROUPS).filter(g => !['crop', 'masks', 'spots'].includes(g));
  const checks = Object.keys(GROUPS).map(g => h('label', { class: 'chk' }, h('input', { type: 'checkbox', value: g, checked: keys.includes(g) }), GROUPS[g][0]));
  dialog('Save preset', [h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', { text: 'Name' }), name), h('label', { class: 'field' }, h('span', { text: 'Group' }), group)),
    h('div', { class: 'sub', text: 'Include' }), h('div', { class: 'grid2' }, checks)], 'Save', () => {
    const values = {}; checks.forEach(c => { const cb = c.querySelector('input'); if (cb.checked) GROUPS[cb.value][1].forEach(k => values[k] = U.clone(P()[k])); });
    const pr = { id: U.uid(), group: group.value.trim() || 'My presets', name: name.value.trim() || 'Preset', values };
    S.userPresets.push(pr); U.DB.put('presets', pr); renderEditLeft(); toast('Preset saved.');
  });
  setTimeout(() => name.select(), 30);
}

/* ============================== edit: stage ============================== */
const STAGE_BG = { dark: '#0e0f10', mid: '#26272a', light: '#8a8c90' };
function renderEditCenter() {
  const C = $('#center'); C.innerHTML = ''; C.style.background = STAGE_BG[S.stageBg];
  const bar = h('div', { class: 'stagebar', id: 'stagebar' });
  const wrap = h('div', { class: 'stagewrap', id: 'stagewrap' }, h('canvas', { id: 'gl' }), h('canvas', { id: 'ov' }));
  C.append(bar, wrap);
  setupDrop(C);
  const cv = $('#gl');
  if (!engine) { toast('This browser does not support WebGL2, which Safelight needs for editing.'); return; }
  // move the engine's canvas into the stage
  cv.replaceWith(engine.gl.canvas); engine.gl.canvas.id = 'gl';
  updateStagebar(); setupStagePointer(wrap); layoutStage();
  new ResizeObserver(() => { layoutStage(); requestRender(); }).observe(wrap);
  openCurrent();
}
function updateStagebar() {
  const bar = $('#stagebar'); const p = ph(); if (!bar || !p) return; bar.innerHTML = '';
  const G = img ? Engine.geom(img, P(), false) : null;
  const seg = (items, val, on) => h('div', { class: 'seg' }, items.map(([v, t, title]) => h('button', { class: val === v ? 'on' : '', title: title || t, onclick: () => on(v) }, t)));
  bar.append(h('span', { class: 'name', text: p.title || p.name }), h('span', { class: 'info', text: G ? `${G.outW} × ${G.outH}${p.raw ? (p.rawMode === 'full' ? ' · RAW' : ' · RAW preview') : ''}` : '' }), h('span', { style: { flex: 1 } }),
    stars(p, r => { setMeta([p.id], x => x.rating = r); }),
    seg([['off', 'Edited', 'Show the edit'], ['split', 'Split', 'Before / after split (Y)'], ['before', 'Before', 'Show the original (\\)']], S.compare, (v) => { S.compare = v; updateStagebar(); requestRender(); }),
    seg([['dark', '◼', 'Dark surround'], ['mid', '◧', 'Grey surround'], ['light', '◻', 'Light surround']], S.stageBg, (v) => { S.stageBg = v; $('#center').style.background = STAGE_BG[v]; updateStagebar(); }));
}
let lay = null;
function layoutStage() {
  const wrap = $('#stagewrap'); if (!wrap || !img || S.view !== 'edit') return;
  const cropMode = S.tool === 'crop';
  const G = Engine.geom(img, P(), cropMode);
  const sw = wrap.clientWidth, sh = wrap.clientHeight; if (!sw || !sh) return;
  let cw, chh, view;
  if (!S.zoom) {
    const mg = cropMode ? 140 : 32; const s = Math.min((sw - mg) / G.outW, (sh - mg) / G.outH);
    cw = G.outW * s; chh = G.outH * s; view = [0, 0, 1, 1];
  } else {
    const z = S.zoom / (window.devicePixelRatio || 1);
    cw = Math.min(sw, G.outW * z); chh = Math.min(sh, G.outH * z);
    const su = cw / (G.outW * z), sv = chh / (G.outH * z);
    S.center[0] = U.clamp(S.center[0], su / 2, 1 - su / 2); S.center[1] = U.clamp(S.center[1], sv / 2, 1 - sv / 2);
    view = [S.center[0] - su / 2, S.center[1] - sv / 2, S.center[0] + su / 2, S.center[1] + sv / 2];
  }
  const dpr = window.devicePixelRatio || 1;
  const x = Math.round((sw - cw) / 2), y = Math.round((sh - chh) / 2);
  const bw = Math.max(1, Math.min(engine.MAXTEX, Math.round(cw * dpr))), bh = Math.max(1, Math.min(engine.MAXTEX, Math.round(chh * dpr)));
  for (const c of [engine.gl.canvas, $('#ov')]) { c.style.left = x + 'px'; c.style.top = y + 'px'; c.style.width = cw + 'px'; c.style.height = chh + 'px'; }
  const gc = engine.gl.canvas; if (gc.width !== bw || gc.height !== bh) { gc.width = bw; gc.height = bh; }
  const ov = $('#ov'); if (ov.width !== bw || ov.height !== bh) { ov.width = bw; ov.height = bh; }
  gc.style.imageRendering = S.zoom > 1 ? 'pixelated' : 'auto';
  lay = { x, y, w: cw, h: chh, view, G, cropMode, dpr };
}

/* ============================== render loop ============================== */
let dirty = false, histTimer = 0;
function requestRender() { if (!dirty) { dirty = true; requestAnimationFrame(frameRender); } }
function beforeParams(p) { const q = defaults(); ['crop', 'orient', 'flipH', 'flipV'].forEach(k => q[k] = U.clone(p[k])); return q; }
function frameRender() {
  dirty = false;
  if (S.view !== 'edit' || !img || !ph()) return;
  layoutStage(); if (!lay) return;
  const p = P(); const gc = engine.gl.canvas;
  const showMask = S.tool === 'mask' && S.maskOverlay && S.selMask >= 0 && P().masks[S.selMask] && !(P().masks[S.selMask].type !== 'brush' && !P().masks[S.selMask].geom && P().masks[S.selMask].type !== 'range') ? S.selMask : -1;
  const opt = { view: lay.view, w: gc.width, h: gc.height, cropMode: lay.cropMode, showClip: S.showClip, showMask, brush: currentBrush() };
  try {
    if (S.compare === 'before') engine.render(img, beforeParams(p), Object.assign({}, opt, { showMask: -1 }));
    else {
      engine.render(img, p, opt);
      if (S.compare === 'split') { const sx = Math.round(gc.width * S.split); engine.render(img, beforeParams(p), Object.assign({}, opt, { showMask: -1, scissor: [0, 0, sx, gc.height] })); }
    }
  } catch (e) { console.error(e); }
  drawOverlay();
  clearTimeout(histTimer); histTimer = setTimeout(drawHistogram, 140);
}
function drawHistogram() {
  const cv = $('#histo'); if (!cv || !img || !ph()) return;
  let id; try { id = engine.renderSmall(img, P(), 220, currentBrush()); } catch (e) { return; }
  const d = id.data, R = new Float32Array(256), G = new Float32Array(256), B = new Float32Array(256), Lh = new Float32Array(256);
  for (let i = 0; i < d.length; i += 4) { R[d[i]]++; G[d[i + 1]]++; B[d[i + 2]]++; Lh[Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2])]++; }
  curveHist = { l: Lh }; const ccv = $('#curveCv'); if (ccv) drawCurve(ccv);
  const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.clearRect(0, 0, W, H);
  const mx = Math.max(...[R, G, B].map(a => Math.max(...a.slice(2, 254)))) || 1;
  g.globalCompositeOperation = 'lighter';
  for (const [arr, col] of [[R, 'rgba(230,70,70,0.75)'], [G, 'rgba(70,200,90,0.75)'], [B, 'rgba(80,120,255,0.75)']]) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    for (let i = 0; i < 256; i++) g.lineTo(i / 255 * W, H - Math.min(1, Math.sqrt(arr[i] / mx)) * (H - 6));
    g.lineTo(W, H); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  const n = d.length / 4, lo = (R[0] + G[0] + B[0]) / 3 / n, hi = (R[255] + G[255] + B[255]) / 3 / n;
  const ex = ph().exif || {};
  const meta = $('#histoMeta'); if (meta) meta.textContent = [ex.iso ? 'ISO ' + ex.iso : '', ex.focal ? Math.round(ex.focal) + ' mm' : '', ex.fnumber ? 'ƒ/' + (+ex.fnumber).toFixed(1) : '', ex.exposure ? U.fmtShutter(ex.exposure) : '', `clip ${(lo * 100).toFixed(1)}% / ${(hi * 100).toFixed(1)}%`].filter(Boolean).join('   ');
}
function drawNavigator() {
  const cv = $('#navCv'); const p = ph(); if (!cv || !p) return;
  const im = new Image(); im.onload = () => {
    const g = cv.getContext('2d'), W = cv.width; const H = Math.round(W * im.height / im.width); if (cv.height !== H) cv.height = H;
    g.drawImage(im, 0, 0, W, H);
    if (S.zoom && lay) { const [u0, v0, u1, v1] = lay.view; g.strokeStyle = '#e4a54c'; g.lineWidth = 3; g.strokeRect(u0 * W, v0 * H, (u1 - u0) * W, (v1 - v0) * H); }
  }; im.src = p.thumb;
  cv.onclick = (e) => { const r = cv.getBoundingClientRect(); S.center = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; if (!S.zoom) S.zoom = 1; layoutStage(); requestRender(); renderEditLeft(); };
}

/* ============================== overlay & pointer tools ============================== */
function evToOut(e) {
  const r = $('#ov').getBoundingClientRect(); const [u0, v0, u1, v1] = lay.view;
  return [u0 + (e.clientX - r.left) / r.width * (u1 - u0), v0 + (e.clientY - r.top) / r.height * (v1 - v0), e.clientX - r.left, e.clientY - r.top];
}
function outToPx(u, v) { const [u0, v0, u1, v1] = lay.view; return [(u - u0) / (u1 - u0) * lay.w, (v - v0) / (v1 - v0) * lay.h]; }
function srcToPx(su, sv) { const o = Engine.srcToOut(lay.G, su, sv); return outToPx(o[0], o[1]); }
const As = () => img.w / img.h;
let hover = null;
function drawOverlay() {
  const ov = $('#ov'); if (!ov || !lay) return;
  const g = ov.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, ov.width, ov.height);
  g.setTransform(ov.width / lay.w, 0, 0, ov.height / lay.h, 0, 0);
  const p = P(); if (!p) return;
  if (lay.cropMode) { drawCropOverlay(g); return; }
  if (S.compare === 'split') {
    const x = S.split * lay.w; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, lay.h); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, lay.h / 2, 9, 0, Math.PI * 2); g.fill();
    g.font = '600 11px Instrument Sans, sans-serif'; g.fillStyle = 'rgba(10,10,12,.75)';
    g.fillRect(x - 64, 10, 56, 20); g.fillRect(x + 8, 10, 50, 20); g.fillStyle = '#fff'; g.fillText('BEFORE', x - 58, 24); g.fillText('AFTER', x + 14, 24);
  }
  const ring = (su, sv, r, dash, col, w) => {
    g.beginPath(); for (let k = 0; k <= 48; k++) { const a = k / 48 * Math.PI * 2; const [x, y] = srcToPx(su + Math.cos(a) * r / As(), sv + Math.sin(a) * r); k ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.setLineDash(dash ? [5, 4] : []); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = w + 2; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); g.setLineDash([]);
  };
  const pin = (x, y, on) => { g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fillStyle = on ? '#e4a54c' : '#fff'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 2; g.stroke(); };
  if (S.tool === 'heal') {
    p.spots.forEach((s, i) => {
      const sel = i === S.selSpot, col = sel ? '#e4a54c' : 'rgba(255,255,255,.85)';
      ring(s.tx, s.ty, s.r, false, col, sel ? 2 : 1.2);
      if (s.mode !== 'redeye') { ring(s.sx, s.sy, s.r, true, col, sel ? 2 : 1.2); const a = srcToPx(s.tx, s.ty), b = srcToPx(s.sx, s.sy); g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    });
    if (hover && hover.src) ring(hover.src[0], hover.src[1], S.heal.size / 100, false, 'rgba(255,255,255,.5)', 1);
  }
  if (S.tool === 'mask') {
    const m = p.masks[S.selMask];
    if (m && m.type === 'linear' && m.geom) {
      const a = srcToPx(m.geom.x0, m.geom.y0), b = srcToPx(m.geom.x1, m.geom.y1);
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * 2000, ny = dx / L * 2000;
      g.setLineDash([6, 5]); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1;
      for (const q of [a, b]) { g.beginPath(); g.moveTo(q[0] - nx, q[1] - ny); g.lineTo(q[0] + nx, q[1] + ny); g.stroke(); }
      g.setLineDash([]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); pin(a[0], a[1], true); pin(b[0], b[1], false);
    }
    if (m && m.type === 'radial' && m.geom) {
      const G0 = m.geom, ang = G0.angle * Math.PI / 180;
      const pt = (ex, ey) => { const x = ex * Math.cos(ang) - ey * Math.sin(ang), y = ex * Math.sin(ang) + ey * Math.cos(ang); return srcToPx(G0.cx + x / As(), G0.cy + y); };
      for (const f of [1, 1 - G0.feather / 100]) { g.beginPath(); for (let k = 0; k <= 64; k++) { const a = k / 64 * Math.PI * 2; const [x, y] = pt(Math.cos(a) * G0.rx * f, Math.sin(a) * G0.ry * f); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.setLineDash(f < 1 ? [5, 4] : []); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; g.stroke(); }
      g.setLineDash([]); const c = srcToPx(G0.cx, G0.cy); pin(c[0], c[1], true); const ex = pt(G0.rx, 0), ey = pt(0, G0.ry); pin(ex[0], ex[1], false); pin(ey[0], ey[1], false);
    }
    if (m && m.type === 'brush' && hover && hover.src) {
      const r = S.brush.size / 200; ring(hover.src[0], hover.src[1], r, false, (S.brush.erase || hover.alt) ? '#ff8a8a' : '#fff', 1.2);
      ring(hover.src[0], hover.src[1], r * (1 - S.brush.feather / 100), true, 'rgba(255,255,255,.6)', 1);
    }
  }
}
function drawCropOverlay(g) {
  const c = P().crop || (() => { const F = Engine.frame(img, P()); return { cx: 0, cy: 0, hw: F.hw, hh: F.hh, angle: 0 }; })();
  const hw0 = lay.G.crop[2], hh0 = lay.G.crop[3];
  const toPx = (qx, qy) => outToPx((qx / hw0 + 1) / 2, (qy / hh0 + 1) / 2);
  const a = c.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const L2Q = (lx, ly) => [c.cx + ca * lx - sa * ly, c.cy + sa * lx + ca * ly];
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => toPx(...L2Q(sx * c.hw, sy * c.hh)));
  g.fillStyle = 'rgba(8,8,10,0.62)'; g.beginPath(); g.rect(0, 0, lay.w, lay.h); g.moveTo(...corners[0]); for (let i = 3; i >= 0; i--) g.lineTo(...corners[i]); g.closePath(); g.fill('evenodd');
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
  for (const t of [-1 / 3, 1 / 3]) {
    const A = toPx(...L2Q(t * c.hw * 1, -c.hh)), B = toPx(...L2Q(t * c.hw * 1, c.hh)); g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.stroke();
    const C = toPx(...L2Q(-c.hw, t * c.hh)), D = toPx(...L2Q(c.hw, t * c.hh)); g.beginPath(); g.moveTo(...C); g.lineTo(...D); g.stroke();
  }
  g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(...corners[0]); corners.slice(1).forEach(q => g.lineTo(...q)); g.closePath(); g.stroke();
  g.fillStyle = '#fff'; corners.forEach(([x, y]) => g.fillRect(x - 5, y - 5, 10, 10));
  [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([sx, sy]) => { const [x, y] = toPx(...L2Q(sx * c.hw, sy * c.hh)); g.fillRect(x - 4, y - 4, 8, 8); });
}
function updateHint() {
  const wrap = $('#stagewrap'); if (!wrap) return; let el = wrap.querySelector('.hint');
  const t = S.picking === 'maskColor' ? 'Click the color to select' : S.tool === 'wb' ? 'Click something that should be neutral grey or white' : S.tool === 'mask' && S.maskCreate ? (S.maskCreate === 'linear' ? 'Drag to draw a linear gradient' : 'Drag from the centre to draw a radial gradient') :
    S.tool === 'mask' && P().masks[S.selMask] && P().masks[S.selMask].type === 'brush' ? 'Paint the area to adjust · Alt to erase' : S.tool === 'heal' ? (S.heal.mode === 'redeye' ? 'Click each pupil' : 'Click a spot to remove it') : S.tool === 'crop' ? 'Drag to crop · drag outside to rotate · Enter when done' : '';
  if (!t) { el && el.remove(); return; }
  if (!el) { el = h('div', { class: 'hint' }); wrap.appendChild(el); } el.textContent = t;
}
function setTool(t) {
  if (S.tool === 'crop' && t !== 'crop') commitIfChanged('Crop');
  S.tool = t; S.maskCreate = null; S.picking = null; hover = null;
  if (t === 'mask' && S.selMask < 0 && P().masks.length) S.selMask = 0;
  renderEditRight(); layoutStage(); requestRender(); updateHint();
}
function commitIfChanged(label) { const p = ph(); if (!p) return; if (JSON.stringify(p.history[p.hIndex].edits) !== JSON.stringify(p.edits)) commit(label); }
function syncSlider(id) { const el = document.getElementById(id); el && el.closest('.sl') && el.closest('.sl').sync(); }

function setupStagePointer(wrap) {
  let drag = null, space = false;
  addEventListener('keydown', (e) => { if (e.code === 'Space' && !isTyping(e)) { space = true; if (S.view === 'edit') e.preventDefault(); } });
  addEventListener('keyup', (e) => { if (e.code === 'Space') space = false; });
  wrap.addEventListener('wheel', (e) => {
    if (!lay || !(e.ctrlKey || e.metaKey || !S.tool)) return; e.preventDefault();
    const steps = [0, 0.25, 0.5, 1, 2, 4]; const [u, v] = evToOut(e);
    let i = steps.indexOf(S.zoom); if (i < 0) i = 0; i = U.clamp(i + (e.deltaY < 0 ? 1 : -1), 0, steps.length - 1);
    if (steps[i] === S.zoom) return; S.zoom = steps[i]; S.center = [u, v]; layoutStage(); requestRender(); renderEditLeft();
  }, { passive: false });
  wrap.addEventListener('pointermove', (e) => {
    if (drag || !lay) return;
    if (S.tool === 'heal' || (S.tool === 'mask' && P().masks[S.selMask] && P().masks[S.selMask].type === 'brush')) {
      const [u, v] = evToOut(e); hover = { src: Engine.outToSrc(lay.G, u, v), alt: e.altKey }; drawOverlay();
    }
  });
  wrap.addEventListener('pointerleave', () => { if (!drag) { hover = null; drawOverlay(); } });
  wrap.addEventListener('pointerdown', (e) => {
    if (!lay || !img || e.button > 0) return;
    const [u, v, px, py] = evToOut(e); const p = P();
    const inside = px >= 0 && py >= 0 && px <= lay.w && py <= lay.h;
    wrap.setPointerCapture(e.pointerId);
    const start = { x: e.clientX, y: e.clientY, u, v, center: S.center.slice(), moved: false };
    if (space || (!S.tool && !S.picking && S.compare !== 'split') || e.button === 1) { drag = { kind: 'pan', start }; return; }
    if (S.compare === 'split' && Math.abs(px - S.split * lay.w) < 14 && !S.tool) { drag = { kind: 'split', start }; return; }
    if (!inside && S.tool !== 'crop') { drag = { kind: 'pan', start }; return; }
    if (S.picking === 'maskColor') { pickMaskColor(u, v); updateHint(); return; }
    if (S.tool === 'wb') { pickWB(u, v); setTool(null); return; }
    if (S.tool === 'crop') { drag = cropDown(u, v, start); return; }
    const s = Engine.outToSrc(lay.G, u, v);
    if (S.tool === 'heal') { drag = healDown(s, start); return; }
    if (S.tool === 'mask') { drag = maskDown(s, px, py, start, e); return; }
    drag = { kind: 'pan', start };
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const [u, v, px, py] = evToOut(e); const st = drag.start;
    if (Math.hypot(e.clientX - st.x, e.clientY - st.y) > 3) st.moved = true;
    if (drag.kind === 'pan') {
      if (!S.zoom) return; const [u0, v0, u1, v1] = lay.view;
      S.center = [st.center[0] - (e.clientX - st.x) / lay.w * (u1 - u0), st.center[1] - (e.clientY - st.y) / lay.h * (v1 - v0)];
      requestRender(); return;
    }
    if (drag.kind === 'split') { S.split = U.clamp(px / lay.w, 0.02, 0.98); requestRender(); return; }
    drag.move && drag.move(u, v, px, py, e);
  });
  const up = (e) => {
    if (!drag) return; const d = drag; drag = null;
    if (d.kind === 'pan' && !d.start.moved && !S.tool) {
      if (S.zoom) S.zoom = 0; else { S.zoom = 1; S.center = [d.start.u, d.start.v]; }
      layoutStage(); requestRender(); renderEditLeft(); return;
    }
    if (d.kind === 'pan' && S.zoom) drawNavigator();
    d.up && d.up();
  };
  wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
}
function cropDown(u, v, start) {
  const c = ensureCrop(); const c0 = U.clone(c);
  const hw0 = lay.G.crop[2], hh0 = lay.G.crop[3];
  const toQ = (uu, vv) => [(2 * uu - 1) * hw0, (2 * vv - 1) * hh0];
  const a = c0.angle * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const toL = (q) => { const dx = q[0] - c0.cx, dy = q[1] - c0.cy; return [ca * dx + sa * dy, -sa * dx + ca * dy]; };
  const L0 = toL(toQ(u, v));
  const tol = 16 / lay.w * 2 * hw0 * (lay.view[2] - lay.view[0]);
  const nx = Math.abs(Math.abs(L0[0]) - c0.hw) < tol, ny = Math.abs(Math.abs(L0[1]) - c0.hh) < tol;
  const inX = Math.abs(L0[0]) < c0.hw + tol, inY = Math.abs(L0[1]) < c0.hh + tol;
  let mode;
  if (nx && ny) mode = 'corner'; else if (nx && inY) mode = 'ex'; else if (ny && inX) mode = 'ey'; else if (Math.abs(L0[0]) < c0.hw && Math.abs(L0[1]) < c0.hh) mode = 'move'; else mode = 'rotate';
  const sx = Math.sign(L0[0]) || 1, sy = Math.sign(L0[1]) || 1; const r = cropRatio(); const min = 0.02;
  return {
    kind: 'crop', start,
    move(uu, vv) {
      const Q = toQ(uu, vv), L = toL(Q);
      if (mode === 'move') { c.cx = c0.cx + Q[0] - toQ(start.u, start.v)[0]; c.cy = c0.cy + Q[1] - toQ(start.u, start.v)[1]; c.hw = c0.hw; c.hh = c0.hh; }
      else if (mode === 'rotate') { const d = Math.atan2(L[1], L[0]) - Math.atan2(L0[1], L0[0]); c.angle = U.clamp(c0.angle + d * 180 / Math.PI, -45, 45); c.hw = c0.hw; c.hh = c0.hh; c.cx = c0.cx; c.cy = c0.cy; syncSlider('s-cropAngle'); }
      else {
        let ax = -sx * c0.hw, ay = -sy * c0.hh; let hw = c0.hw, hh = c0.hh, lx = 0, ly = 0;
        if (mode === 'corner' || mode === 'ex') hw = Math.max(min, (L[0] - ax) * sx / 2);
        if (mode === 'corner' || mode === 'ey') hh = Math.max(min, (L[1] - ay) * sy / 2);
        if (r) { if (mode === 'ex') hh = hw / r; else if (mode === 'ey') hw = hh * r; else if (hw / hh > r) hh = hw / r; else hw = hh * r; }
        lx = mode === 'ey' ? 0 : ax + sx * hw; ly = mode === 'ex' ? 0 : ay + sy * hh;
        c.hw = hw; c.hh = hh; c.cx = c0.cx + ca * lx - sa * ly; c.cy = c0.cy + sa * lx + ca * ly;
      }
      constrainCrop(c); requestRender();
    },
    up() { commit('Crop'); updateStagebar(); }
  };
}
function healDown(s, start) {
  const p = P(); const A = As();
  const dist = (x, y, r) => Math.hypot((s[0] - x) * A, s[1] - y) < r;
  for (let i = p.spots.length - 1; i >= 0; i--) {
    const sp = p.spots[i];
    if (sp.mode !== 'redeye' && dist(sp.sx, sp.sy, sp.r)) { S.selSpot = i; renderEditRight(); return spotDrag(sp, 'source', s, start); }
    if (dist(sp.tx, sp.ty, sp.r)) { S.selSpot = i; renderEditRight(); return spotDrag(sp, 'both', s, start); }
  }
  if (p.spots.length >= 24) { toast('Up to 24 healing spots per photo.'); return null; }
  const r = S.heal.size / 100;
  const sp = { tx: s[0], ty: s[1], sx: s[0], sy: s[1], r, feather: S.heal.feather, opacity: S.heal.opacity, mode: S.heal.mode };
  if (sp.mode !== 'redeye') {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
    for (const [dx, dy] of dirs) { const x = s[0] + dx * r * 2.4 / A, y = s[1] + dy * r * 2.4; if (x - r / A > 0 && x + r / A < 1 && y - r > 0 && y + r < 1) { sp.sx = x; sp.sy = y; break; } }
  }
  p.spots.push(sp); S.selSpot = p.spots.length - 1; requestRender(); renderEditRight();
  return spotDrag(sp, sp.mode === 'redeye' ? 'none' : 'source', s, start, true);
}
function spotDrag(sp, what, s0, start, created) {
  const o = U.clone(sp);
  return {
    kind: 'spot', start,
    move(u, v) {
      const s = Engine.outToSrc(lay.G, u, v), dx = s[0] - s0[0], dy = s[1] - s0[1];
      if (what === 'source') { sp.sx = o.sx + dx; sp.sy = o.sy + dy; }
      if (what === 'both') { sp.tx = o.tx + dx; sp.ty = o.ty + dy; sp.sx = o.sx + dx; sp.sy = o.sy + dy; }
      requestRender();
    },
    up() { if (created || start.moved) commit(created ? 'Add spot' : 'Move spot'); }
  };
}
function maskDown(s, px, py, start, ev) {
  const p = P(); const m = p.masks[S.selMask]; const A = As();
  if (!m) { toast('Add a mask first.'); return null; }
  if (S.maskCreate === 'linear' || (m.type === 'linear' && !m.geom)) {
    m.geom = { x0: s[0], y0: s[1], x1: s[0], y1: s[1] + 0.001 };
    return { kind: 'mk', start, move(u, v) { const q = Engine.outToSrc(lay.G, u, v); m.geom.x1 = q[0]; m.geom.y1 = q[1]; requestRender(); }, up() { S.maskCreate = null; commit('Linear gradient'); renderEditRight(); updateHint(); } };
  }
  if (S.maskCreate === 'radial' || (m.type === 'radial' && !m.geom)) {
    m.geom = { cx: s[0], cy: s[1], rx: 0.05, ry: 0.05, angle: 0, feather: 50 };
    return { kind: 'mk', start, move(u, v) { const q = Engine.outToSrc(lay.G, u, v); m.geom.rx = Math.max(0.01, Math.abs(q[0] - s[0]) * A); m.geom.ry = Math.max(0.01, Math.abs(q[1] - s[1])); if (!ev.shiftKey && false) m.geom.ry = m.geom.rx; requestRender(); }, up() { if (!start.moved) { m.geom.rx = 0.25; m.geom.ry = 0.25; } S.maskCreate = null; commit('Radial gradient'); renderEditRight(); updateHint(); requestRender(); } };
  }
  const near = (su, sv) => { const [x, y] = srcToPx(su, sv); return Math.hypot(x - px, y - py) < 14; };
  if (m.type === 'linear') {
    const g0 = U.clone(m.geom); let which = near(g0.x0, g0.y0) ? 'a' : near(g0.x1, g0.y1) ? 'b' : 'both';
    return { kind: 'mk', start, move(u, v) { const q = Engine.outToSrc(lay.G, u, v), dx = q[0] - s[0], dy = q[1] - s[1];
      if (which !== 'b') { m.geom.x0 = g0.x0 + dx; m.geom.y0 = g0.y0 + dy; } if (which !== 'a') { m.geom.x1 = g0.x1 + dx; m.geom.y1 = g0.y1 + dy; } requestRender(); }, up() { if (start.moved) commit('Move gradient'); } };
  }
  if (m.type === 'radial') {
    const g0 = U.clone(m.geom), ang = g0.angle * Math.PI / 180;
    const ptS = (ex, ey) => [g0.cx + (ex * Math.cos(ang) - ey * Math.sin(ang)) / A, g0.cy + ex * Math.sin(ang) + ey * Math.cos(ang)];
    const ex = ptS(g0.rx, 0), ey = ptS(0, g0.ry);
    const which = near(...ex) ? 'rx' : near(...ey) ? 'ry' : 'move';
    return { kind: 'mk', start, move(u, v) { const q = Engine.outToSrc(lay.G, u, v);
      if (which === 'move') { m.geom.cx = g0.cx + q[0] - s[0]; m.geom.cy = g0.cy + q[1] - s[1]; }
      else { const dx = (q[0] - g0.cx) * A, dy = q[1] - g0.cy; const lx = dx * Math.cos(-ang) - dy * Math.sin(-ang), ly = dx * Math.sin(-ang) + dy * Math.cos(-ang); if (which === 'rx') m.geom.rx = Math.max(0.01, Math.abs(lx)); else m.geom.ry = Math.max(0.01, Math.abs(ly)); }
      requestRender(); }, up() { if (start.moved) commit('Adjust radial'); } };
  }
  if (m.type === 'brush') {
    const st = { e: S.brush.erase || ev.altKey, r: S.brush.size / 200, f: S.brush.feather / 100, a: S.brush.flow / 100, pts: [s[0], s[1]] };
    m.strokes.push(st);
    const [bw, bh] = brushSize(img); const ent = maskCanvas(ph().id, m, bw, bh);
    let last = s; const paint = () => { ent.sig = m.strokes.length + ':' + m.strokes.reduce((a, q) => a + q.pts.length, 0); invalidateBrush(); requestRender(); };
    paint();
    return { kind: 'brush', start, move(u, v) {
      const q = Engine.outToSrc(lay.G, u, v); const d = Math.hypot((q[0] - last[0]) * A, q[1] - last[1]); const step = Math.max(st.r * 0.25, 0.001);
      if (d < step) return; const n = Math.floor(d / step); const from = st.pts.length;
      for (let k = 1; k <= n; k++) st.pts.push(last[0] + (q[0] - last[0]) * k / n, last[1] + (q[1] - last[1]) * k / n);
      last = [st.pts[st.pts.length - 2], st.pts[st.pts.length - 1]];
      drawDabs(ent.ctx, st, from, bw, bh); paint(); hover = { src: q, alt: ev.altKey }; },
      up() { commit(st.e ? 'Erase brush' : 'Brush'); } };
  }
  return null;
}

/* ============================== copy / paste / sync ============================== */
function copyDlg(mode) {
  const p = ph(); if (!p) return;
  const defaultsOn = (g) => !['crop', 'masks', 'spots'].includes(g);
  const checks = Object.keys(GROUPS).map(g => h('label', { class: 'chk' }, h('input', { type: 'checkbox', value: g, checked: defaultsOn(g) }), GROUPS[g][0]));
  const all = h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => checks.forEach(c => c.querySelector('input').checked = true) }, 'Check all'), h('button', { class: 'btn sm', onclick: () => checks.forEach(c => c.querySelector('input').checked = false) }, 'Check none'));
  const others = [...S.sel].filter(id => id !== p.id);
  dialog(mode === 'sync' ? `Sync settings to ${others.length} photo${others.length === 1 ? '' : 's'}` : 'Copy settings', [all, h('div', { class: 'grid2' }, checks)], mode === 'sync' ? 'Sync' : 'Copy', async () => {
    const values = {}; checks.forEach(c => { const cb = c.querySelector('input'); if (cb.checked) GROUPS[cb.value][1].forEach(k => values[k] = U.clone(p.edits[k])); });
    S.clip = { values, from: p.id };
    if (mode === 'sync') await pasteSettings(others); else { toast('Settings copied. Paste them onto other photos with Ctrl+V.'); renderStrip(); }
  });
}
async function pasteSettings(ids) {
  if (!S.clip) { toast('Copy settings from a photo first.'); return; }
  const busy = ids.length > 1 ? showBusy(`Applying settings to ${ids.length} photos…`) : null;
  for (const id of ids) {
    const p = S.photos.find(x => x.id === id); if (!p) continue;
    for (const [k, v] of Object.entries(S.clip.values)) p.edits[k] = U.clone(v);
    if (S.clip.values.masks) p.edits.masks.forEach(m => m.id = U.uid());
    pushHistoryFor(p, 'Paste settings');
    if (id === S.cur && S.view === 'edit') { invalidateBrush(); renderEditRight(); renderHistory(); requestRender(); }
    await refreshThumb(p);
  }
  busy && busy.remove();
  toast(`Settings applied to ${ids.length} photo${ids.length === 1 ? '' : 's'}.`);
  if (S.view === 'library') renderAll();
}

/* ============================== export ============================== */
function exportDlg() {
  const ids = S.sel.size ? [...S.sel] : (S.cur ? [S.cur] : []);
  if (!ids.length) { toast('Select photos to export.'); return; }
  let prefs = {}; try { prefs = JSON.parse(localStorage.getItem('safelight.export') || '{}'); } catch (e) {}
  const fmt = h('select', { id: 'exFmt' }, [['jpeg', 'JPEG'], ['png', 'PNG'], ['webp', 'WebP']].map(([v, t]) => h('option', { value: v, text: t }))); fmt.value = prefs.fmt || 'jpeg';
  const q = h('input', { type: 'range', id: 'exQ', min: 40, max: 100, value: prefs.q || 90 }); const qo = h('output', { text: (prefs.q || 90) }); q.oninput = () => qo.textContent = q.value;
  const size = h('select', { id: 'exSize' }, [['0', 'Full size'], ['3840', 'Long edge 3840 px'], ['2560', 'Long edge 2560 px'], ['2048', 'Long edge 2048 px'], ['1600', 'Long edge 1600 px'], ['1080', 'Long edge 1080 px']].map(([v, t]) => h('option', { value: v, text: t }))); size.value = prefs.size || '0';
  const name = h('input', { type: 'text', id: 'exName', value: prefs.name || '{name}-edit' });
  const wm = h('input', { type: 'text', id: 'exWm', value: prefs.wm || '', placeholder: 'e.g. © Your Name' });
  const wmPos = h('select', { id: 'exWmPos' }, [['br', 'Bottom right'], ['bl', 'Bottom left'], ['tr', 'Top right'], ['tl', 'Top left'], ['c', 'Centre']].map(([v, t]) => h('option', { value: v, text: t }))); wmPos.value = prefs.wmPos || 'br';
  const wmSize = h('input', { type: 'range', id: 'exWmSize', min: 1, max: 10, step: 0.5, value: prefs.wmSize || 3 });
  const wmOp = h('input', { type: 'range', id: 'exWmOp', min: 10, max: 100, value: prefs.wmOp || 70 });
  const status = h('div', { class: 'empty', style: { padding: 0 }, text: ids.length > 1 ? `${ids.length} photos will be saved together as one .zip file.` : 'One photo will be exported.' });
  const d = dialog(`Export ${ids.length} photo${ids.length === 1 ? '' : 's'}`, [
    h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', { text: 'Format' }), fmt), h('label', { class: 'field' }, h('span', { text: 'Size' }), size)),
    h('div', { class: 'sl' }, h('label', { for: 'exQ', text: 'Quality' }), q, qo),
    h('label', { class: 'field' }, h('span', { text: 'File name — {name} {seq} {date} {rating}' }), name),
    h('div', { class: 'sub', text: 'Watermark' }),
    h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', { text: 'Text (leave empty for none)' }), wm), h('label', { class: 'field' }, h('span', { text: 'Position' }), wmPos)),
    h('div', { class: 'grid2' }, h('label', { class: 'field' }, h('span', { text: 'Size' }), wmSize), h('label', { class: 'field' }, h('span', { text: 'Opacity' }), wmOp)),
    status], 'Export', async () => {
    const o = { fmt: fmt.value, q: +q.value, size: size.value, name: name.value, wm: wm.value, wmPos: wmPos.value, wmSize: +wmSize.value, wmOp: +wmOp.value };
    try { localStorage.setItem('safelight.export', JSON.stringify(o)); } catch (e) {}
    d.ok.disabled = true; await runExport(ids, o, status); d.ok.disabled = false; return false;
  });
}
async function renderExport(p, o) {
  let hd = null, own = false;
  if (imgFor === p.id && img) hd = img;
  else { const rec = await U.DB.get('images', p.imageId); const src = rec && await decodeSource(rec); if (!src) throw new Error('unreadable'); hd = engine.loadImage(src); own = true; }
  const G = Engine.geom(hd, p.edits, false);
  let W = G.outW, H = G.outH; const lim = +o.size;
  if (lim && Math.max(W, H) > lim) { const s = lim / Math.max(W, H); W = Math.round(W * s); H = Math.round(H * s); }
  const id = engine.renderPixels(hd, p.edits, W, H, buildBrush(p.edits, hd, own ? 'x' : p.id));
  if (own) engine.freeImage(hd); else requestRender();
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.putImageData(id, 0, 0);
  if (o.wm.trim()) {
    const fs = Math.max(10, Math.round(Math.min(W, H) * o.wmSize / 100)); g.font = `500 ${fs}px "Instrument Sans", sans-serif`; g.fillStyle = `rgba(255,255,255,${o.wmOp / 100})`;
    g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = fs * 0.15; const tw = g.measureText(o.wm).width, m = fs;
    const pos = { br: [W - tw - m, H - m], bl: [m, H - m], tr: [W - tw - m, m + fs * 0.8], tl: [m, m + fs * 0.8], c: [(W - tw) / 2, H / 2 + fs * 0.35] }[o.wmPos];
    g.fillText(o.wm, pos[0], pos[1]);
  }
  const mime = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[o.fmt];
  return await new Promise(r => c.toBlob(r, mime, o.q / 100));
}
function exportName(p, o, seq) {
  const base = p.name.replace(/\.[^.]+$/, '');
  const d = new Date(p.captureAt); const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const n = (o.name || '{name}').replace(/\{name\}/g, base).replace(/\{seq\}/g, String(seq).padStart(3, '0')).replace(/\{date\}/g, ds).replace(/\{rating\}/g, p.rating).replace(/[\\/:*?"<>|]/g, '_');
  return n + '.' + (o.fmt === 'jpeg' ? 'jpg' : o.fmt);
}
async function runExport(ids, o, status) {
  const files = []; let i = 0;
  for (const id of ids) {
    const p = S.photos.find(x => x.id === id); if (!p) continue; i++;
    status.textContent = `Rendering ${i} of ${ids.length}: ${p.name}…`; await new Promise(r => setTimeout(r, 30));
    try { const blob = await renderExport(p, o); let nm = exportName(p, o, i); while (files.some(f => f.name === nm)) nm = nm.replace(/(\.[^.]+)$/, '-' + i + '$1'); files.push({ name: nm, blob }); }
    catch (e) { console.error(e); }
  }
  if (!files.length) { status.textContent = 'Nothing could be exported.'; return; }
  const out = files.length === 1 ? files[0] : { name: `safelight-export-${new Date().toISOString().slice(0, 10)}.zip`, blob: await U.zip(files) };
  status.textContent = `Saving ${out.name} (${(out.blob.size / 1048576).toFixed(1)} MB)…`;
  const dl = window.claude && window.claude.use ? await Promise.race([window.claude.use('downloads'), new Promise(r => setTimeout(() => r(null), 3000))]) : null;
  if (dl) {
    try { await dl.save({ filename: out.name, data: out.blob }); status.textContent = `Saved ${out.name}.`; toast(`Exported ${files.length} photo${files.length === 1 ? '' : 's'}.`); }
    catch (e) { status.textContent = e && e.code === 'declined' ? 'Save cancelled.' : e && e.code === 'too_large' ? 'That file is too large to save here. Try a smaller size.' : `The file could not be saved (${e && e.code || 'error'}).`; }
    return;
  }
  const a = h('a', { href: URL.createObjectURL(out.blob), download: out.name }); document.body.appendChild(a); a.click(); a.remove();
  status.textContent = `Saved ${out.name}. If nothing downloaded, this view does not allow saving files.`;
}

/* ============================== keyboard ============================== */
function isTyping(e) { const t = e.target; return t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && t.type !== 'range' && t.type !== 'checkbox') || t.tagName === 'SELECT' || t.isContentEditable); }
addEventListener('keydown', (e) => {
  if (isTyping(e) || document.querySelector('.modal')) return;
  const k = e.key, mod = e.ctrlKey || e.metaKey;
  const ids = [...S.sel].length ? [...S.sel] : (S.cur ? [S.cur] : []);
  const onRange = e.target && e.target.type === 'range';
  if (mod && k.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (mod && k.toLowerCase() === 'c' && !window.getSelection().toString()) { e.preventDefault(); copyDlg('copy'); return; }
  if (mod && k.toLowerCase() === 'v') { e.preventDefault(); pasteSettings(ids); return; }
  if (mod && k.toLowerCase() === 'e') { e.preventDefault(); exportDlg(); return; }
  if (mod && k.toLowerCase() === 'a' && S.view === 'library') { e.preventDefault(); S.sel = new Set(visiblePhotos().map(p => p.id)); renderAll(); return; }
  if (mod) return;
  if (k === 'g') { setView('library'); return; }
  if (k === 'e' || k === 'd') { setView('edit'); return; }
  if (/^[0-5]$/.test(k)) { setMeta(ids, p => p.rating = +k); if (S.view === 'edit') updateStagebar(); return; }
  if (/^[6-9]$/.test(k)) { const l = ['red', 'yellow', 'green', 'blue'][+k - 6]; setMeta(ids, p => p.label = p.label === l ? null : l); return; }
  if (k === 'p') { setMeta(ids, p => p.flag = 1); return; }
  if (k === 'x') { setMeta(ids, p => p.flag = -1); return; }
  if (k === 'u') { setMeta(ids, p => p.flag = 0); return; }
  if ((k === 'ArrowRight' || k === 'ArrowLeft') && !onRange) {
    const list = visiblePhotos(); const i = list.findIndex(p => p.id === S.cur); const n = list[U.clamp(i + (k === 'ArrowRight' ? 1 : -1), 0, list.length - 1)];
    if (n) { e.preventDefault(); selectPhoto(n.id, null, list); } return;
  }
  if (S.view !== 'edit') { if ((k === 'Delete' || k === 'Backspace') && ids.length) removePhotos(ids); if (k === 'Enter' && S.cur) setView('edit'); return; }
  if (k === '\\') { S.compare = S.compare === 'before' ? 'off' : 'before'; updateStagebar(); requestRender(); return; }
  if (k === 'y') { S.compare = S.compare === 'split' ? 'off' : 'split'; updateStagebar(); requestRender(); return; }
  if (k === 'r') { setTool(S.tool === 'crop' ? null : 'crop'); return; }
  if (k === 'q') { setTool(S.tool === 'heal' ? null : 'heal'); return; }
  if (k === 'm') { setTool(S.tool === 'mask' ? null : 'mask'); return; }
  if (k === 'w') { setTool(S.tool === 'wb' ? null : 'wb'); return; }
  if (k === 'j') { toggleClip(); return; }
  if (k === 'o') { S.maskOverlay = !S.maskOverlay; requestRender(); const c = $('#maskOv'); if (c) c.checked = S.maskOverlay; return; }
  if (k === 'z') { S.zoom = S.zoom ? 0 : 1; layoutStage(); requestRender(); renderEditLeft(); return; }
  if (k === 'Escape') { if (S.maskCreate || S.picking) { S.maskCreate = null; S.picking = null; updateHint(); renderEditRight(); } else if (S.tool) setTool(null); return; }
  if (k === 'Enter' && S.tool === 'crop') { setTool(null); return; }
  if ((k === 'Delete' || k === 'Backspace') && S.tool === 'heal' && S.selSpot >= 0) { deleteSpot(); return; }
  if ((k === 'Delete' || k === 'Backspace') && S.tool === 'mask' && S.selMask >= 0) { P().masks.splice(S.selMask, 1); S.selMask = Math.min(S.selMask, P().masks.length - 1); invalidateBrush(); commit('Delete mask'); renderEditRight(); requestRender(); return; }
});

/* ============================== start ============================== */
async function start() {
  const glc = document.createElement('canvas');
  try { engine = Engine.create(glc); } catch (e) { console.error(e); engine = null; }
  if (!engine) {
    $('#center').append(h('div', { class: 'empty', style: { padding: '40px', textAlign: 'center' }, text: 'Safelight needs WebGL2, which this browser does not provide. Try a current version of Chrome, Edge, Firefox or Safari.' }));
    return;
  }
  const ok = await U.DB.open();
  $('#storeNote').textContent = ok ? 'Library saved in this browser' : 'This browser blocks storage: your library lasts only until you close the page';
  S.photos = (await U.DB.all('photos')).sort((a, b) => a.importedAt - b.importedAt);
  S.photos.forEach(p => { const d = defaults(); for (const k of Object.keys(d)) if (p.edits[k] === undefined) p.edits[k] = d[k]; });
  S.collections = await U.DB.all('collections');
  S.userPresets = await U.DB.all('presets');
  const meta = await U.DB.get('meta', 'state');
  if (meta) { S.lastImport = meta.lastImport; }
  $('#mLib').onclick = () => setView('library'); $('#mEdit').onclick = () => setView('edit');
  $('#bImport').onclick = () => $('#fileIn').click();
  $('#fileIn').onchange = (e) => { importFiles(e.target.files); e.target.value = ''; };
  $('#bExport').onclick = exportDlg;
  addEventListener('beforeunload', () => { const p = ph(); if (p) U.DB.put('photos', p); U.DB.put('meta', { id: 'state', lastImport: S.lastImport }); });
  setInterval(() => U.DB.put('meta', { id: 'state', lastImport: S.lastImport }), 10000);
  if (!S.photos.length) {
    renderAll();
    const samples = await U.makeSamples();
    await importFiles(samples.map(s => Object.assign(new File([s.blob], s.name, { type: 'image/jpeg', lastModified: Date.now() }), { exif: s.exif })), { sample: true, keywords: ['sample'] });
    const fruit = S.photos.find(p => /Fruit/.test(p.name)); if (fruit) { fruit.rating = 4; fruit.label = 'yellow'; savePhoto(fruit); }
    const lake = S.photos.find(p => /Lake/.test(p.name)); if (lake) { lake.flag = 1; lake.rating = 5; savePhoto(lake); }
  }
  if (!S.cur && S.photos.length) { S.cur = S.photos[0].id; S.sel = new Set([S.cur]); }
  let v = 'library'; try { v = localStorage.getItem('safelight.view') || 'library'; } catch (e) {}
  setView(v === 'edit' && S.photos.length ? 'edit' : 'library');
}
start();
