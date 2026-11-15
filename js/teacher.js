// Teacher mode: build a pack of levels, test them, and share the pack as a link or QR code.
// No server: the whole pack is compressed into the link itself (#/pack/<code>), so nothing is stored online.
// Screens:
//   #/teach              the editor (the draft is saved in this browser's localStorage)
//   #/teach/test/<n>     the teacher solves level n; that program becomes the solution and the 3-star target
//   #/pack/<code>        a student opens a shared pack: the list of its levels
//   #/pack/<code>/<n>    a student plays level n of the pack
// app.js calls Teacher.init(api) once. api has: app (main element), esc, toast, go, settings, progress, saveProgress,
//   hash(text), mascot(mood), MASCOT, stars(n), mountLevel({ def, head, finish, canType })
window.Teacher = (() => {
  'use strict';

  let api = null;
  const LIMIT = { levels: 8, rowsMin: 2, rowsMax: 7, colsMin: 3, colsMax: 8, title: 40, desc: 120, hint: 100 };
  const BLOCKS = [ // [block, letter in the link, label]
    ['move', 'm', 'เดินหน้า move'], ['left', 'l', 'หันซ้าย turn_left'], ['right', 'r', 'หันขวา turn_right'],
    ['pick', 'p', 'เก็บเพชร pick_gem'], ['repeat', 'f', 'ลูป for'], ['ifwall', 'w', 'if wall_ahead'], ['ifgem', 'g', 'if gem_here']
  ];
  const ALWAYS = ['move', 'left', 'right'];
  const TOOLS = [['S', '🤖', 'จุดเริ่ม'], ['G', '🏁', 'ธง'], ['#', '🪨', 'หิน'], ['*', '💎', 'เพชร'], ['.', '⬜', 'ลบ']];
  const DRAFT_KEY = 'vct-teacher-pack';
  const $ = (s) => document.querySelector(s);

  // ---------- Link code: pack → JSON → deflate → base64url ----------
  const toB64 = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const fromB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  async function pipe(bytes, stream) {
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
  }
  async function encodePack(pack) {
    const json = JSON.stringify({
      v: 1, t: pack.title,
      l: pack.levels.map((lv) => ({
        t: lv.title, d: lv.desc, h: lv.hint, m: lv.grid, n: lv.best, s: lv.solution,
        b: BLOCKS.filter(([b]) => lv.blocks.includes(b)).map(([, c]) => c).join('')
      }))
    });
    const bytes = new TextEncoder().encode(json);
    if (window.CompressionStream) return 'z' + toB64(await pipe(bytes, new CompressionStream('deflate-raw')));
    return 'j' + toB64(bytes);
  }
  // Returns { title, levels: [def, ...] } ready to play, or throws if the link is broken or edited by hand.
  async function decodePack(code) {
    let bytes = fromB64(code.slice(1));
    if (code[0] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    else if (code[0] !== 'j') throw new Error('unknown format');
    const raw = JSON.parse(new TextDecoder().decode(bytes));
    if (raw.v !== 1 || !Array.isArray(raw.l) || !raw.l.length || raw.l.length > LIMIT.levels) throw new Error('bad pack');
    const str = (x, max) => String(x || '').slice(0, max);
    const levels = raw.l.map((l, i) => {
      const grid = l.m;
      const ok = Array.isArray(grid) && grid.length >= LIMIT.rowsMin && grid.length <= LIMIT.rowsMax &&
        grid.every((r) => typeof r === 'string' && r.length === grid[0].length && /^[SG#*.]+$/.test(r)) &&
        grid[0].length >= LIMIT.colsMin && grid[0].length <= LIMIT.colsMax &&
        grid.join('').split('S').length === 2 && grid.join('').split('G').length === 2;
      if (!ok) throw new Error(`level ${i + 1}: bad map`);
      const blocks = BLOCKS.filter(([, c]) => String(l.b).includes(c)).map(([b]) => b);
      const def = {
        title: str(l.t, LIMIT.title) || `ด่าน ${i + 1}`,
        desc: str(l.d, LIMIT.desc) || 'ด่านจากคุณครู',
        hint: str(l.h, LIMIT.hint) || 'ลองแบ่งทางเป็นช่วง ๆ แล้วนับช่องดูนะ',
        map: grid, blocks: blocks.length ? blocks : ALWAYS, solution: String(l.s), best: Number(l.n)
      };
      // check the teacher's solution really works (also protects against hand-edited links)
      const check = window.Puzzle.simulate(def, def.solution);
      if (!check.ok || !(def.best >= 1 && def.best <= 200)) throw new Error(`level ${i + 1}: solution does not work`);
      return def;
    });
    return { title: str(raw.t, LIMIT.title) || 'ชุดด่านจากคุณครู', levels };
  }

  // ---------- Draft (the teacher's work in progress) ----------
  const newLevel = (n) => ({
    title: `ด่าน ${n}`, desc: '', hint: '', grid: ['S....', '.....', '....G'], blocks: ALWAYS.slice(), solution: null, best: null
  });
  let draft = null;
  let cur = 0; // the level being edited
  let tool = '#';
  function loadDraft() {
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch (e) { draft = null; }
    if (!draft || !Array.isArray(draft.levels) || !draft.levels.length) draft = { title: 'ชุดด่านของห้องเรา', levels: [newLevel(1)] };
    cur = Math.min(cur, draft.levels.length - 1);
  }
  function saveDraft() { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (e) { /* ignore */ } }
  const tested = (lv) => !!lv.solution && lv.best > 0;
  // any change to the map or blocks means the level must be tested again
  function changed(lv) { lv.solution = null; lv.best = null; saveDraft(); }

  function resize(lv, rows, cols) {
    const old = lv.grid.map((r) => r.split(''));
    const g = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (old[r] && old[r][c]) || '.'));
    const has = (ch) => g.some((row) => row.includes(ch));
    if (!has('S')) g[0][0] = 'S'; // the start goes back to the top-left (if a flag was there, it's placed again below)
    if (!has('G')) {
      // the flag goes to the bottom-right, or the last free square
      outer: for (let r = rows - 1; r >= 0; r--) for (let c = cols - 1; c >= 0; c--) if (g[r][c] !== 'S') { g[r][c] = 'G'; break outer; }
    }
    lv.grid = g.map((row) => row.join(''));
  }

  function paint(lv, r, c) {
    const g = lv.grid.map((row) => row.split(''));
    const here = g[r][c];
    if (here === tool) return;
    if ((here === 'S' || here === 'G') && tool !== 'S' && tool !== 'G') {
      api.toast(here === 'S' ? 'ย้ายจุดเริ่มด้วยเครื่องมือ 🤖 จุดเริ่ม' : 'ย้ายธงด้วยเครื่องมือ 🏁 ธง');
      return;
    }
    if (tool === 'S' || tool === 'G') {
      if (here === 'S' || here === 'G') { api.toast('จุดเริ่มกับธงต้องอยู่คนละช่อง'); return; }
      g.forEach((row) => row.forEach((ch, k) => { if (ch === tool) row[k] = '.'; })); // only one start and one flag
    }
    g[r][c] = tool;
    lv.grid = g.map((row) => row.join(''));
    changed(lv);
  }

  // ---------- Editor screen ----------
  function renderEditor() {
    loadDraft();
    const { esc } = api;
    const lv = draft.levels[cur];
    const rows = lv.grid.length;
    const cols = lv.grid[0].length;
    const allTested = draft.levels.every(tested);
    const opts = (from, to, v) => Array.from({ length: to - from + 1 }, (_, k) => from + k)
      .map((n) => `<option value="${n}" ${n === v ? 'selected' : ''}>${n}</option>`).join('');
    const cells = lv.grid.map((row, r) => row.split('').map((ch, c) => {
      const icon = { S: `<span class="pz-bit">${api.MASCOT}</span>`, G: '🏁', '#': '🪨', '*': '💎', '.': '' }[ch];
      const name = { S: 'จุดเริ่ม', G: 'ธง', '#': 'หิน', '*': 'เพชร', '.': 'ว่าง' }[ch];
      return `<button type="button" class="pz-cell ed-cell ${ch === '#' ? 'rock' : ''} ${ch === 'G' ? 'goal' : ''}" data-r="${r}" data-c="${c}"
        aria-label="แถว ${r + 1} ช่อง ${c + 1}: ${name}">${icon}</button>`;
    }).join('')).join('');

    api.app.innerHTML = `<section class="screen teach">
      <div class="screen-head"><a href="#/" class="btn small ghost">← หน้าแรก</a><h1>🛠️ สร้างชุดด่านสำหรับห้องเรียน</h1></div>
      <article class="card reading teach-how">
        <ol class="steps">
          <li>วาดแผนที่ของแต่ละด่าน และเลือกคำสั่งที่นักเรียนใช้ได้</li>
          <li>กด ▶ ทดสอบ แล้วเขียนโค้ดผ่านด่านเอง โปรแกรมของคุณครูจะเป็นเฉลย และจำนวนคำสั่งจะเป็นเป้าหมาย 3 ดาว</li>
          <li>ทดสอบครบทุกด่านแล้ว กด 🔗 สร้างลิงก์ แล้วแชร์ลิงก์หรือ QR ให้นักเรียน</li>
        </ol>
        <p class="note">ไม่ต้องสมัครสมาชิก ด่านทั้งหมดถูกบีบอัดอยู่ในลิงก์ ไม่มีการเก็บข้อมูลบนเซิร์ฟเวอร์ ร่างของคุณครูบันทึกไว้ในเบราว์เซอร์นี้</p>
      </article>

      <label class="field">ชื่อชุดด่าน <input type="text" id="edPackTitle" maxlength="${LIMIT.title}" value="${esc(draft.title)}"></label>

      <div class="ed-tabs" role="tablist" aria-label="ด่านในชุด">
        ${draft.levels.map((l, i) => `<button type="button" role="tab" class="seg-btn" data-tab="${i}" aria-selected="${i === cur}" aria-pressed="${i === cur}">ด่าน ${i + 1} ${tested(l) ? '✓' : '•'}</button>`).join('')}
        ${draft.levels.length < LIMIT.levels ? '<button type="button" class="seg-btn" id="edAdd">➕ เพิ่มด่าน</button>' : ''}
      </div>

      <article class="card ed-level">
        <div class="ed-fields">
          <label class="field">ชื่อด่าน <input type="text" id="edTitle" maxlength="${LIMIT.title}" value="${esc(lv.title)}"></label>
          <label class="field">โจทย์ / คำอธิบาย <textarea id="edDesc" maxlength="${LIMIT.desc}" rows="2" placeholder="เช่น พาบิตเก็บเพชรให้ครบ แล้วไปที่ธง">${esc(lv.desc)}</textarea></label>
          <label class="field">คำใบ้ (แสดงเมื่อนักเรียนรันไม่ผ่าน) <input type="text" id="edHint" maxlength="${LIMIT.hint}" value="${esc(lv.hint)}" placeholder="เช่น ลองใช้ลูปสิ"></label>
        </div>
        <div class="ed-size">
          <label>แถว <select id="edRows">${opts(LIMIT.rowsMin, LIMIT.rowsMax, rows)}</select></label>
          <label>คอลัมน์ <select id="edCols">${opts(LIMIT.colsMin, LIMIT.colsMax, cols)}</select></label>
        </div>
        <p class="g-label">เครื่องมือวาด แล้วแตะช่องบนแผนที่:</p>
        <div class="ed-tools" role="group" aria-label="เครื่องมือวาด">
          ${TOOLS.map(([ch, icon, name]) => `<button type="button" class="seg-btn" data-tool="${ch}" aria-pressed="${tool === ch}">${icon} ${name}</button>`).join('')}
        </div>
        <div class="pz-board ed-board" style="--cols:${cols}">${cells}</div>
        <p class="g-label">คำสั่งที่นักเรียนใช้ได้:</p>
        <div class="ed-blocks">
          ${BLOCKS.map(([b, , label]) => `<label class="switch"><input type="checkbox" data-block="${b}" ${lv.blocks.includes(b) ? 'checked' : ''} ${ALWAYS.includes(b) ? 'disabled' : ''}><span>${label}</span></label>`).join('')}
        </div>
        <p class="ed-status ${tested(lv) ? 'ok' : ''}" role="status">${tested(lv)
          ? `✓ ทดสอบผ่านแล้ว เป้าหมาย 3 ดาว: ${lv.best} คำสั่ง`
          : '• ยังไม่ได้ทดสอบ กด ▶ ทดสอบด่านนี้ แล้วผ่านด่านเอง'}</p>
        <div class="pz-run">
          <a class="btn big primary" href="#/teach/test/${cur}" id="edTest">▶ ทดสอบด่านนี้</a>
          ${cur > 0 ? '<button type="button" class="btn big" id="edUp">◀ ย้ายไปก่อนหน้า</button>' : ''}
          ${draft.levels.length > 1 ? '<button type="button" class="btn big danger" id="edDel">🗑 ลบด่านนี้</button>' : ''}
        </div>
      </article>

      <article class="card ed-share" aria-labelledby="shareTitle">
        <h2 id="shareTitle">🔗 แชร์ให้นักเรียน</h2>
        ${allTested
          ? '<button type="button" class="btn big primary wide" id="edShare">🔗 สร้างลิงก์และ QR</button><div id="shareOut"></div>'
          : `<p>ต้องทดสอบให้ผ่านทุกด่านก่อน: ยังเหลือ ${draft.levels.map((l, i) => (tested(l) ? null : `ด่าน ${i + 1}`)).filter(Boolean).join(', ')}</p>`}
      </article>
    </section>`;

    const app = api.app;
    // text: save as you type (no redraw, so the cursor stays put). Text changes don't need a new test.
    const bindText = (id, key) => app.querySelector(id).addEventListener('input', (e) => { (key === 'pack' ? draft : lv)[key === 'pack' ? 'title' : key] = e.target.value; saveDraft(); });
    bindText('#edPackTitle', 'pack');
    bindText('#edTitle', 'title');
    bindText('#edDesc', 'desc');
    bindText('#edHint', 'hint');
    const redraw = (focusSel) => { renderEditor(); const f = focusSel && app.querySelector(focusSel); if (f) f.focus(); };
    app.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { cur = Number(b.dataset.tab); redraw(`[data-tab="${cur}"]`); }));
    const add = app.querySelector('#edAdd');
    if (add) add.addEventListener('click', () => { draft.levels.push(newLevel(draft.levels.length + 1)); cur = draft.levels.length - 1; saveDraft(); redraw(`[data-tab="${cur}"]`); });
    const size = () => { resize(lv, Number(app.querySelector('#edRows').value), Number(app.querySelector('#edCols').value)); changed(lv); };
    app.querySelector('#edRows').addEventListener('change', () => { size(); redraw('#edRows'); });
    app.querySelector('#edCols').addEventListener('change', () => { size(); redraw('#edCols'); });
    app.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => { tool = b.dataset.tool; redraw(`[data-tool="${tool}"]`); }));
    app.querySelectorAll('.ed-cell').forEach((b) => b.addEventListener('click', () => {
      paint(lv, Number(b.dataset.r), Number(b.dataset.c));
      redraw(`.ed-cell[data-r="${b.dataset.r}"][data-c="${b.dataset.c}"]`);
    }));
    app.querySelectorAll('[data-block]').forEach((b) => b.addEventListener('change', () => {
      lv.blocks = BLOCKS.map(([k]) => k).filter((k) => ALWAYS.includes(k) || app.querySelector(`[data-block="${k}"]`).checked);
      changed(lv);
      redraw(`[data-block="${b.dataset.block}"]`);
    }));
    const up = app.querySelector('#edUp');
    if (up) up.addEventListener('click', () => { [draft.levels[cur - 1], draft.levels[cur]] = [draft.levels[cur], draft.levels[cur - 1]]; cur--; saveDraft(); redraw(`[data-tab="${cur}"]`); });
    const del = app.querySelector('#edDel');
    if (del) {
      let armed = false;
      del.addEventListener('click', () => {
        if (!armed) { armed = true; del.textContent = 'แน่ใจไหม? กดอีกครั้งเพื่อลบ'; setTimeout(() => { armed = false; del.textContent = '🗑 ลบด่านนี้'; }, 4000); return; }
        draft.levels.splice(cur, 1);
        cur = Math.max(0, cur - 1);
        saveDraft();
        redraw(`[data-tab="${cur}"]`);
      });
    }
    const share = app.querySelector('#edShare');
    if (share) share.addEventListener('click', () => showShare(app.querySelector('#shareOut')));
  }

  async function showShare(out) {
    const code = await encodePack(draft);
    const url = `${location.href.split('#')[0]}#/pack/${code}`;
    let qr = '';
    try {
      const q = window.qrcode(0, 'L');
      q.addData(url);
      q.make();
      qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: 'QR code ของลิงก์ชุดด่าน' });
    } catch (e) {
      qr = '<p class="pz-error">ลิงก์ยาวเกินกว่าจะทำ QR ได้ ลองลดจำนวนด่านหรือข้อความ</p>';
    }
    out.innerHTML = `
      <label class="field">ลิงก์ชุดด่าน <input type="text" id="shareUrl" readonly value="${api.esc(url)}"></label>
      <div class="pz-run">
        <button type="button" class="btn big primary" id="shareCopy">📋 คัดลอกลิงก์</button>
        <a class="btn big" href="${api.esc(url)}" target="_blank" rel="noopener">👀 เปิดดูแบบนักเรียน</a>
      </div>
      <a class="btn big primary wide" href="#/room/${code}" id="shareRoom">🏫 เปิดห้องเรียนสด (เห็นรายชื่อนักเรียนแบบสด ๆ)</a>
      <div class="qr-box" id="shareQr">${qr}</div>
      <p class="note">${url.length > 900 ? '⚠️ ลิงก์ค่อนข้างยาว QR จะแน่น ถ้าสแกนยาก ให้แสดง QR ให้ใหญ่เต็มจอ หรือลดข้อความลง' : 'ให้นักเรียนสแกน QR หรือส่งลิงก์ทาง LINE / Google Classroom'} · ลิงก์ยาว ${url.length} ตัวอักษร</p>`;
    out.querySelector('#shareCopy').addEventListener('click', async () => {
      const input = out.querySelector('#shareUrl');
      try { await navigator.clipboard.writeText(url); api.toast('คัดลอกลิงก์แล้ว'); }
      catch (e) { input.select(); api.toast('เลือกลิงก์ให้แล้ว กด Ctrl+C เพื่อคัดลอก'); }
    });
    out.querySelector('#shareCopy').focus();
  }

  // ---------- Teacher test run ----------
  function renderTest(n) {
    loadDraft();
    const lv = draft.levels[n];
    if (!lv) { api.go('#/teach'); return; }
    cur = n;
    const def = { title: lv.title || `ด่าน ${n + 1}`, desc: lv.desc || 'ทดสอบด่านนี้ด้วยตัวเอง', hint: lv.hint || 'ลองแบ่งทางเป็นช่วง ๆ แล้วนับช่องดูนะ', map: lv.grid, blocks: lv.blocks, best: null };
    api.mountLevel({
      def, canType: () => true,
      head: `<div class="screen-head"><a href="#/teach" class="btn small ghost">← กลับไปแก้ด่าน</a><h1>🧪 คุณครูทดสอบ: ด่าน ${n + 1}</h1></div>
        <p class="note teach-note">เขียนโค้ดให้ผ่านด่านนี้ โปรแกรมของคุณครูจะเป็นเฉลย และจำนวนคำสั่งจะเป็นเป้าหมาย 3 ดาวของนักเรียน (ทำให้สั้นที่สุดนะ)</p>`,
      finish(stars, info) {
        loadDraft();
        const target = draft.levels[n];
        if (!target.best || info.blocks <= target.best) { target.solution = info.program; target.best = info.blocks; }
        saveDraft();
        return { href: '#/teach', label: `✓ ทดสอบผ่าน (${target.best} คำสั่ง) กลับไปที่ตัวสร้างด่าน` };
      }
    });
  }

  // ---------- Students: a shared pack ----------
  const cache = new Map(); // code → pack, or an Error
  function withPack(code, show) {
    const known = cache.get(code);
    if (known instanceof Error) { badLink(); return; }
    if (known) { show(known); return; }
    api.app.innerHTML = '<section class="screen"><p>กำลังเปิดชุดด่าน...</p></section>';
    const hash = location.hash;
    decodePack(code).then((pack) => { cache.set(code, pack); if (location.hash === hash) show(pack); })
      .catch(() => { cache.set(code, new Error('bad link')); if (location.hash === hash) badLink(); });
  }
  function badLink() {
    api.app.innerHTML = `<section class="screen"><div class="hero">${api.mascot('think')}<div class="bubble">
      <p>ลิงก์นี้เปิดไม่ได้ อาจคัดลอกมาไม่ครบ ลองขอลิงก์ใหม่จากคุณครูนะ</p></div></div>
      <a class="btn big primary" href="#/">🏠 ไปหน้าแรก</a></section>`;
  }
  const packId = (code) => api.hash(code);
  const packStars = (code) => (api.progress().packs || {})[packId(code)] || [];

  function renderPack(code) {
    withPack(code, (pack) => {
      const got = packStars(code);
      const tiles = pack.levels.map((def, i) => {
        const open = i === 0 || got[i - 1] > 0;
        const s = got[i] || 0;
        return open
          ? `<li><a class="lvl ${s ? 'done' : 'open'}" href="#/pack/${code}/${i}" aria-label="ด่าน ${i + 1}: ${api.esc(def.title)}${s ? ` ได้ ${s} ดาว` : ''}"><span class="lvl-num">${i + 1}</span><span class="lvl-stars">${api.stars(s)}</span></a></li>`
          : `<li><span class="lvl locked" aria-label="ด่าน ${i + 1} ล็อกอยู่">🔒<span class="lvl-num">${i + 1}</span></span></li>`;
      }).join('');
      const done = pack.levels.filter((_, i) => got[i]).length;
      api.app.innerHTML = `<section class="screen pack">
        <div class="hero">${api.mascot('wave')}<div class="bubble"><p>คุณครูส่งชุดด่านมาให้! เขียนโค้ดพาผมผ่านให้ครบทุกด่านนะ</p></div></div>
        ${window.Room.badge(code)}
        <article class="chapter"><h1 class="chapter-title">📦 ${api.esc(pack.title)} <span class="chapter-count">${done}/${pack.levels.length}</span></h1>
          <ol class="lvl-grid">${tiles}</ol></article>
        <p class="note">ชุดด่านนี้มาจากลิงก์ของคุณครู ดาวที่ได้เก็บไว้ในเบราว์เซอร์นี้เท่านั้น</p>
        <a class="btn" href="#/">🏠 ไปหน้าแรกของเกม</a>
      </section>`;
    });
  }
  function renderPackLevel(code, i) {
    withPack(code, (pack) => {
      const got = packStars(code);
      if (!pack.levels[i] || (i > 0 && !got[i - 1])) { api.go(`#/pack/${code}`); return; }
      window.Room.report(code, { type: 'at', level: i });
      api.mountLevel({
        def: pack.levels[i],
        head: `<div class="screen-head"><a href="#/pack/${code}" class="btn small ghost">← ชุดด่าน</a><h1>📦 ${api.esc(pack.title)} · ด่าน ${i + 1}/${pack.levels.length}</h1></div>${window.Room.badge(code)}`,
        finish(stars) {
          const p = api.progress();
          p.packs = p.packs || {};
          const arr = (p.packs[packId(code)] || []).slice();
          arr[i] = Math.max(arr[i] || 0, stars);
          p.packs[packId(code)] = arr;
          api.saveProgress();
          window.Room.report(code, { type: 'progress', level: i, stars: arr[i] });
          return i + 1 < pack.levels.length
            ? { href: `#/pack/${code}/${i + 1}`, label: 'ด่านต่อไป ▶' }
            : { href: `#/pack/${code}`, label: '🎉 ครบทุกด่านแล้ว! กลับไปดูชุดด่าน' };
        }
      });
    });
  }

  // called by the router in app.js
  function route(screen, parts) {
    if (screen === 'teach') {
      if (parts[0] === 'test') renderTest(parseInt(parts[1], 10) || 0); else renderEditor();
      return true;
    }
    if (screen === 'pack' && parts[0]) {
      if (parts[1] !== undefined && parts[1] !== '') renderPackLevel(parts[0], parseInt(parts[1], 10) || 0); else renderPack(parts[0]);
      return true;
    }
    return false;
  }

  return { init(a) { api = a; }, route, encodePack, decodePack };
})();
