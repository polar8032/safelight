/* Safelight — utilities: storage, EXIF, RAW previews, zip, curves, samples */
'use strict';

const U = {};

U.uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
U.clone = (o) => JSON.parse(JSON.stringify(o));
U.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
U.lerp = (a, b, t) => a + (b - a) * t;
U.h = function (tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.appendChild(typeof kid === 'string' || typeof kid === 'number' ? document.createTextNode(String(kid)) : kid);
  }
  return el;
};

/* ---------- IndexedDB with in-memory fallback ---------- */
U.DB = (() => {
  const STORES = ['images', 'photos', 'collections', 'presets', 'meta'];
  const mem = {}; STORES.forEach(s => mem[s] = new Map());
  let db = null;
  function open() {
    return new Promise((res) => {
      try {
        const rq = indexedDB.open('safelight', 1);
        rq.onupgradeneeded = () => { const d = rq.result; STORES.forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); }); };
        rq.onsuccess = () => { db = rq.result; res(true); };
        rq.onerror = () => res(false);
        rq.onblocked = () => res(false);
        setTimeout(() => res(!!db), 4000);
      } catch (e) { res(false); }
    });
  }
  function tx(store, mode, fn) {
    if (!db) return Promise.resolve(fn(null));
    return new Promise((res) => {
      try {
        const t = db.transaction(store, mode); const os = t.objectStore(store);
        const r = fn(os);
        t.oncomplete = () => res(r && r.result !== undefined ? r.result : undefined);
        t.onerror = () => res(undefined); t.onabort = () => res(undefined);
      } catch (e) { res(undefined); }
    });
  }
  return {
    open,
    get persistent() { return !!db; },
    async put(store, obj) { mem[store].set(obj.id, obj); if (db) await tx(store, 'readwrite', os => os.put(obj)); },
    async del(store, id) { mem[store].delete(id); if (db) await tx(store, 'readwrite', os => os.delete(id)); },
    async get(store, id) {
      if (mem[store].has(id)) return mem[store].get(id);
      if (!db) return undefined;
      const v = await tx(store, 'readonly', os => os.get(id)); if (v) mem[store].set(id, v); return v;
    },
    async all(store) {
      if (!db) return [...mem[store].values()];
      const v = await tx(store, 'readonly', os => os.getAll()); (v || []).forEach(o => mem[store].set(o.id, o)); return v || [];
    }
  };
})();

/* ---------- EXIF (JPEG / TIFF-based RAW) ---------- */
U.parseExif = function (buf) {
  const out = {};
  try {
    const dv = new DataView(buf);
    let tiff = -1;
    if (dv.getUint16(0) === 0xFFD8) {
      let p = 2;
      while (p < Math.min(dv.byteLength - 4, 262144)) {
        if (dv.getUint8(p) !== 0xFF) break;
        const m = dv.getUint8(p + 1), len = dv.getUint16(p + 2);
        if (m === 0xE1 && dv.getUint32(p + 4) === 0x45786966) { tiff = p + 10; break; }
        p += 2 + len;
      }
    } else if (dv.getUint16(0) === 0x4949 || dv.getUint16(0) === 0x4D4D) tiff = 0;
    if (tiff < 0) return out;
    const le = dv.getUint16(tiff) === 0x4949;
    const u16 = o => dv.getUint16(tiff + o, le), u32 = o => dv.getUint32(tiff + o, le);
    const str = (o, n) => { let s = ''; for (let i = 0; i < n; i++) { const c = dv.getUint8(tiff + o + i); if (!c) break; s += String.fromCharCode(c); } return s.trim(); };
    const val = (e) => {
      const type = u16(e + 2), cnt = u32(e + 4), vo = e + 8;
      const off = (type === 2 && cnt > 4) || (type === 5 || type === 10) ? u32(vo) : vo;
      if (type === 2) return str(off, cnt);
      if (type === 3) return u16(off);
      if (type === 4) return u32(off);
      if (type === 5) return u32(off) / (u32(off + 4) || 1);
      if (type === 10) return dv.getInt32(tiff + off, le) / (dv.getInt32(tiff + off + 4, le) || 1);
      return null;
    };
    const read = (ifd, map) => {
      const n = u16(ifd); const tags = {};
      for (let i = 0; i < n; i++) { const e = ifd + 2 + i * 12; const t = u16(e); if (map[t]) tags[map[t]] = val(e); }
      return tags;
    };
    const ifd0 = read(u32(4), { 0x010F: 'make', 0x0110: 'model', 0x8769: 'exifPtr', 0x0132: 'dateTime' });
    Object.assign(out, ifd0);
    if (ifd0.exifPtr) Object.assign(out, read(ifd0.exifPtr, { 0x829A: 'exposure', 0x829D: 'fnumber', 0x8827: 'iso', 0x9003: 'dateOriginal', 0x920A: 'focal', 0xA434: 'lens' }));
    delete out.exifPtr;
  } catch (e) { /* malformed metadata is ignored */ }
  return out;
};
U.exifDate = (s) => {
  if (!s || typeof s !== 'string') return null;
  const m = s.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  return m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() : null;
};
U.fmtShutter = (t) => !t ? '' : t >= 1 ? t.toFixed(t < 10 ? 1 : 0) + 's' : '1/' + Math.round(1 / t) + 's';

/* ---------- RAW: decode the camera's embedded JPEG preview ---------- */
U.RAW_EXT = /\.(cr2|cr3|nef|nrw|arw|srf|sr2|dng|raf|orf|rw2|pef|srw|x3f|3fr|iiq|erf|kdc|mrw)$/i;
U.extractRawPreview = async function (file) {
  const buf = await file.arrayBuffer();
  const b = new Uint8Array(buf);
  const starts = [];
  for (let i = 0; i < b.length - 3 && starts.length < 40; i++) {
    if (b[i] === 0xFF && b[i + 1] === 0xD8 && b[i + 2] === 0xFF && (b[i + 3] & 0xF0) === 0xE0 || (b[i] === 0xFF && b[i + 1] === 0xD8 && b[i + 2] === 0xFF && b[i + 3] === 0xDB)) starts.push(i);
  }
  let best = null;
  for (const s of starts) {
    try {
      const blob = new Blob([b.subarray(s)], { type: 'image/jpeg' });
      const bmp = await createImageBitmap(blob);
      if (!best || bmp.width * bmp.height > best.bmp.width * best.bmp.height) { if (best) best.bmp.close(); best = { bmp, s }; }
      else bmp.close();
    } catch (e) { /* not a decodable preview */ }
  }
  if (!best) return null;
  const c = document.createElement('canvas'); c.width = best.bmp.width; c.height = best.bmp.height;
  c.getContext('2d').drawImage(best.bmp, 0, 0); best.bmp.close();
  const jpeg = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.95));
  return { blob: jpeg, exif: U.parseExif(buf) };
};

/* ---------- ZIP (store, no compression) ---------- */
U.zip = async function (files) {
  const crcT = U._crcT || (U._crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })());
  const crc = (d) => { let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = crcT[(c ^ d[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const enc = new TextEncoder(); const parts = []; const central = []; let offset = 0;
  for (const f of files) {
    const data = new Uint8Array(await f.blob.arrayBuffer()); const name = enc.encode(f.name); const c = crc(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(8, 0, true);
    lh.setUint32(14, c, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true);
    parts.push(lh.buffer, name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
    ch.setUint32(16, c, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
    central.push(ch.buffer, name);
    offset += 30 + name.length + data.length;
  }
  const csize = central.reduce((a, p) => a + (p.byteLength || p.length), 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, csize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
};

/* ---------- Curves: monotone cubic interpolation ---------- */
U.monotone = function (pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0]);
  const n = p.length;
  if (n < 2) return () => 0;
  const dx = [], dy = [], m = [];
  for (let i = 0; i < n - 1; i++) { dx.push(Math.max(1e-6, p[i + 1][0] - p[i][0])); dy.push((p[i + 1][1] - p[i][1]) / dx[i]); }
  m[0] = dy[0]; m[n - 1] = dy[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = dy[i - 1] * dy[i] <= 0 ? 0 : (dy[i - 1] + dy[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (dy[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / dy[i], b = m[i + 1] / dy[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * dy[i]; m[i + 1] = t * b * dy[i]; }
  }
  return (x) => {
    if (x <= p[0][0]) return p[0][1];
    if (x >= p[n - 1][0]) return p[n - 1][1];
    let i = 0; while (i < n - 2 && x > p[i + 1][0]) i++;
    const h = dx[i], t = (x - p[i][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * p[i + 1][1] + (t3 - t2) * h * m[i + 1];
  };
};

/* ---------- Color helpers ---------- */
U.hsv2rgb = (h, s, v) => {
  const f = (n) => { const k = (n + h * 6) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5), f(3), f(1)];
};
U.toLin = (x) => x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
U.toSrgb = (x) => x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;

/* ---------- Sample photographs (generated, clearly labelled) ---------- */
U.makeSamples = async function () {
  const rnd = (() => { let s = 1234567; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const noise1 = (() => { const g = Array.from({ length: 512 }, rnd); return (x) => { const i = Math.floor(x), f = x - i, a = g[i & 511], b = g[(i + 1) & 511]; const t = f * f * (3 - 2 * f); return a + (b - a) * t; }; })();
  const fbm = (x, o) => { let v = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { v += a * noise1(x * f); a *= 0.5; f *= 2.03; } return v; };
  const grain = (ctx, w, h, amt) => {
    const id = ctx.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n * 1.1; }
    ctx.putImageData(id, 0, 0);
  };
  const out = [];

  /* 1 — lake at dusk: flat, slightly underexposed, warm/cool mix */
  {
    const W = 1800, H = 1200, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, H * 0.58);
    sky.addColorStop(0, '#26314f'); sky.addColorStop(0.45, '#5a5d78'); sky.addColorStop(0.8, '#b98a6e'); sky.addColorStop(1, '#d9a479');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const sun = g.createRadialGradient(W * 0.64, H * 0.5, 0, W * 0.64, H * 0.5, H * 0.4);
    sun.addColorStop(0, 'rgba(255,236,190,0.95)'); sun.addColorStop(0.06, 'rgba(255,214,150,0.8)'); sun.addColorStop(0.3, 'rgba(240,160,110,0.25)'); sun.addColorStop(1, 'rgba(240,160,110,0)');
    g.fillStyle = sun; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * W, y = H * (0.08 + rnd() * 0.32), rx = 80 + rnd() * 260, ry = 10 + rnd() * 30;
      const cg = g.createRadialGradient(x, y, 0, x, y, rx);
      const warm = y > H * 0.25; cg.addColorStop(0, warm ? 'rgba(230,170,140,0.22)' : 'rgba(150,150,180,0.18)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
      g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = cg; g.beginPath(); g.arc(x, y, rx, 0, Math.PI * 2); g.fill(); g.restore();
    }
    const layers = [['#6d6a82', 0.47, 70, 3.1], ['#4f5168', 0.52, 90, 7.7], ['#343849', 0.565, 60, 13.2]];
    for (const [col, base, amp, seed] of layers) {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) g.lineTo(x, H * base - amp * (fbm(x / 260 + seed, 5) * 1.6 - 0.3));
      g.lineTo(W, H); g.closePath(); g.fill();
    }
    const hz = Math.round(H * 0.6);
    g.save(); g.translate(0, hz * 2); g.scale(1, -1); g.globalAlpha = 0.55; g.drawImage(c, 0, 0, W, hz, 0, 0, W, hz); g.restore();
    const water = g.createLinearGradient(0, hz, 0, H); water.addColorStop(0, 'rgba(40,46,70,0.35)'); water.addColorStop(1, 'rgba(14,18,30,0.85)');
    g.fillStyle = water; g.fillRect(0, hz, W, H - hz);
    for (let y = hz; y < H; y += 3) { g.fillStyle = `rgba(255,220,180,${0.05 * rnd()})`; g.fillRect(W * 0.64 - 40 - rnd() * 120, y, 80 + rnd() * 240, 1.5); }
    g.fillStyle = '#121418'; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 3) g.lineTo(x, H * 0.9 - 50 * fbm(x / 120 + 40, 4) - (x < W * 0.3 ? (W * 0.3 - x) * 0.25 : 0));
    g.lineTo(W, H); g.closePath(); g.fill();
    for (let i = 0; i < 900; i++) { const x = rnd() * W * 0.45, y = H * 0.82 + rnd() * H * 0.18; g.strokeStyle = `rgba(${40 + rnd() * 30},${44 + rnd() * 30},${30},0.6)`; g.beginPath(); g.moveTo(x, y + 30); g.lineTo(x + (rnd() - 0.5) * 20, y - 20 - rnd() * 40); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, W, H);
    grain(g, W, H, 10);
    out.push({ name: 'Sample — Lake at dusk.jpg', blob: await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)), exif: { make: 'Sample', model: 'Generated scene', iso: 400, fnumber: 8, exposure: 1 / 60, focal: 35 } });
  }

  /* 2 — fruit still life: low-key, cool cast to correct */
  {
    const W = 1600, H = 1200, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const bg = g.createRadialGradient(W * 0.35, H * 0.25, 50, W * 0.5, H * 0.5, W * 0.9);
    bg.addColorStop(0, '#4a4d55'); bg.addColorStop(1, '#121318'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const table = g.createLinearGradient(0, H * 0.62, 0, H); table.addColorStop(0, '#5a4636'); table.addColorStop(1, '#2a1f18');
    g.fillStyle = table; g.fillRect(0, H * 0.62, W, H * 0.38);
    for (let y = H * 0.62; y < H; y += 2) { g.fillStyle = `rgba(20,10,5,${0.12 * rnd()})`; g.fillRect(0, y, W, 1); }
    const fruit = [[520, 700, 150, '#e0761c', '#ffc27a'], [800, 735, 120, '#7bb33a', '#d6f39a'], [1050, 690, 160, '#7a2546', '#e46a9a'], [660, 830, 110, '#e8b52a', '#fff0a6'], [930, 860, 100, '#d44a2a', '#ffa080'], [1210, 850, 95, '#e0761c', '#ffc27a']];
    for (const [x, y, r, col, hi] of fruit) {
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(x + r * 0.25, y + r * 0.92, r * 1.05, r * 0.22, 0, 0, Math.PI * 2); g.fill();
      const fg = g.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.05, x, y, r * 1.05);
      fg.addColorStop(0, hi); fg.addColorStop(0.35, col); fg.addColorStop(1, '#100806');
      g.fillStyle = fg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      const sp = g.createRadialGradient(x - r * 0.42, y - r * 0.5, 0, x - r * 0.42, y - r * 0.5, r * 0.22);
      sp.addColorStop(0, 'rgba(255,255,255,0.85)'); sp.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sp; g.beginPath(); g.arc(x - r * 0.42, y - r * 0.5, r * 0.22, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 400; i++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r * 0.95; g.fillStyle = `rgba(0,0,0,${0.08 * rnd()})`; g.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 2, 2); }
    }
    g.fillStyle = 'rgba(40,70,110,0.16)'; g.fillRect(0, 0, W, H);
    grain(g, W, H, 14);
    out.push({ name: 'Sample — Fruit still life.jpg', blob: await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)), exif: { make: 'Sample', model: 'Generated scene', iso: 1600, fnumber: 2.8, exposure: 1 / 30, focal: 50 } });
  }

  /* 3 — city facade: tilted, converging verticals, hazy */
  {
    const W = 1200, H = 1600, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#9fb3c8'); sky.addColorStop(1, '#d8dde0');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2, H / 2); g.rotate(0.035); g.translate(-W / 2, -H / 2);
    const top = H * 0.08, bot = H * 1.02, inset = 140;
    g.fillStyle = '#b9876a'; g.beginPath(); g.moveTo(inset, top); g.lineTo(W - inset, top); g.lineTo(W + 40, bot); g.lineTo(-40, bot); g.closePath(); g.fill();
    const rows = 9, cols = 5;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const t0 = (r + 0.25) / rows, t1 = (r + 0.75) / rows;
      const lx = (t) => U.lerp(inset, -40, t), rx = (t) => U.lerp(W - inset, W + 40, t);
      const y0 = U.lerp(top, bot, t0), y1 = U.lerp(top, bot, t1);
      const xa0 = U.lerp(lx(t0), rx(t0), (k + 0.22) / cols), xb0 = U.lerp(lx(t0), rx(t0), (k + 0.78) / cols);
      const xa1 = U.lerp(lx(t1), rx(t1), (k + 0.22) / cols), xb1 = U.lerp(lx(t1), rx(t1), (k + 0.78) / cols);
      const lit = rnd() < 0.25;
      g.fillStyle = lit ? '#f1c97a' : '#2b3440'; g.beginPath(); g.moveTo(xa0, y0); g.lineTo(xb0, y0); g.lineTo(xb1, y1); g.lineTo(xa1, y1); g.closePath(); g.fill();
      g.strokeStyle = '#e8d9c8'; g.lineWidth = 6; g.stroke();
    }
    g.restore();
    g.fillStyle = 'rgba(210,215,220,0.28)'; g.fillRect(0, 0, W, H);
    grain(g, W, H, 8);
    out.push({ name: 'Sample — City facade.jpg', blob: await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92)), exif: { make: 'Sample', model: 'Generated scene', iso: 100, fnumber: 11, exposure: 1 / 250, focal: 24 } });
  }
  return out;
};

/* ---------- RAW: full decode with LibRaw (WebAssembly), linear 16-bit -> half floats ---------- */
U.f2h = (() => {
  const f = new Float32Array(1), i = new Uint32Array(f.buffer);
  return (v) => {
    f[0] = v; const x = i[0];
    const s = (x >>> 16) & 0x8000; let e = ((x >>> 23) & 0xff) - 127 + 15; let m = x & 0x7fffff;
    if (e <= 0) { if (e < -10) return s; m = (m | 0x800000) >> (1 - e); return s | (m + 0x1000) >> 13; }
    if (e >= 31) return s | 0x7c00;
    const r = s | (e << 10) | (m >> 13); return (m & 0x1000) ? r + 1 : r;
  };
})();
U.decodeRaw = async function (buf, maxSide) {
  let LibRaw;
  try { LibRaw = (await import('./vendor/libraw/index.js')).default; } catch (e) { return null; }
  const raw = new LibRaw();
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 90000));
  try {
    await Promise.race([raw.open(new Uint8Array(buf.slice(0)), { outputBps: 16, gamm: [1, 1], noAutoBright: true, useCameraWb: true, useCameraMatrix: 1, outputColor: 1, highlight: 2, userQual: 3 }), timeout]);
    const meta = await raw.metadata().catch(() => ({}));
    const img = await Promise.race([raw.imageData(), timeout]);
    const { width: W, height: H } = img; const src = img.data; const ch = img.colors || 3;
    // auto-brightness like a camera: put the 99.5th percentile of green near 0.9 (keeps highlights > 1 for recovery)
    const hist = new Uint32Array(4096); let n = 0;
    for (let i = 1; i < src.length; i += ch * 37) { hist[src[i] >> 4]++; n++; }
    let acc = 0, p = 4095; for (let k = 0; k < 4096; k++) { acc += hist[k]; if (acc >= n * 0.995) { p = k; break; } }
    const gain = U.clamp(0.9 / Math.max(((p << 4) + 8) / 65535, 1e-4), 1, 16);
    const lut = new Uint16Array(65536); for (let k = 0; k < 65536; k++) lut[k] = U.f2h(k / 65535 * gain);
    let step = 1; while (Math.max(W, H) / step > maxSide) step++;
    const w = Math.floor(W / step), h = Math.floor(H / step);
    const out = new Uint16Array(w * h * 3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const si = ((y * step) * W + x * step) * ch, di = (y * w + x) * 3;
      out[di] = lut[src[si]]; out[di + 1] = lut[src[si + 1]]; out[di + 2] = lut[src[si + 2]];
    }
    const exif = { make: meta.camera_make, model: meta.camera_model, iso: meta.iso_speed, exposure: meta.shutter, fnumber: meta.aperture, focal: meta.focal_len, lens: meta.lens && (meta.lens.Lens || meta.lens.lens) || undefined, dateOriginal: null, captureAt: meta.timestamp instanceof Date && !isNaN(meta.timestamp) ? meta.timestamp.getTime() : null };
    return { w, h, half: out, exif };
  } catch (e) { return null; }
  finally { try { raw.dispose(); } catch (e) {} }
};
