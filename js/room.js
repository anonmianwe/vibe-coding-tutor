// Live classroom: the teacher opens a room, students join with a room code and a nickname,
// and the teacher sees a live player list (who is on which level, and their stars).
//
// How it works without a server of our own: PeerJS (WebRTC). The teacher's browser is the "host".
// The free public PeerJS server only helps the browsers find each other; after that they talk directly.
// There is no API key and no database. Nicknames live only in the teacher's open tab.
// If a school network blocks WebRTC, students can still play the same pack from the link/QR (no live list).
//
// Screens:
//   #/room/<packCode>   teacher: the room (code, QR, player list)
//   #/join[/<room>]     student: enter the room code and a nickname
// Messages (student → teacher): hello { name, stars } · at { level } · progress { level, stars }
// Messages (teacher → student): welcome { pack, name } · full
window.Room = (() => {
  'use strict';

  let api = null;
  const PREFIX = 'nongbit-room-'; // PeerJS ids are global, so room codes get a prefix
  const MAX_PLAYERS = 60;
  const NAME_MAX = 20;
  let host = null; // the teacher's room (stays open while the app is open)
  let student = null; // this student's connection

  const cleanName = (s) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  const peerOk = () => typeof window.Peer === 'function';

  // ---------- Teacher: host a room ----------
  function openRoom(packCode, pack) {
    closeRoom();
    host = { packCode, pack, code: null, peer: null, players: new Map(), error: null, tries: 0 };
    startPeer();
  }
  function startPeer() {
    const h = host;
    h.code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits, easy to type
    const peer = new window.Peer(PREFIX + h.code, { debug: 0 });
    h.peer = peer;
    peer.on('open', () => { h.error = null; drawRoom(); });
    peer.on('error', (e) => {
      if (e.type === 'unavailable-id' && h.tries++ < 5) { peer.destroy(); startPeer(); return; } // code taken: pick another
      h.error = e.type || 'error';
      drawRoom();
    });
    peer.on('disconnected', () => { if (host === h && !peer.destroyed) peer.reconnect(); });
    peer.on('connection', (conn) => {
      conn.on('data', (msg) => fromStudent(h, conn, msg));
      conn.on('close', () => { const p = h.players.get(conn.peer); if (p) { p.online = false; drawPlayers(); } });
    });
  }
  function closeRoom() {
    if (host && host.peer) host.peer.destroy();
    host = null;
  }
  function fromStudent(h, conn, msg) {
    if (!msg || typeof msg !== 'object') return;
    let p = h.players.get(conn.peer);
    if (msg.type === 'hello') {
      if (!p && h.players.size >= MAX_PLAYERS) { conn.send({ type: 'full' }); return; }
      let name = cleanName(msg.name) || 'นักเรียน';
      const taken = new Set([...h.players.values()].filter((x) => x !== p).map((x) => x.name));
      for (let n = 2; taken.has(name); n++) name = `${cleanName(msg.name).slice(0, NAME_MAX - 3)} ${n}`; // two students with the same nickname
      p = Object.assign(p || { at: 0, stars: [] }, { name, conn, online: true, joined: Date.now() });
      if (Array.isArray(msg.stars)) p.stars = msg.stars.slice(0, h.pack.levels.length).map((x) => Math.min(3, Number(x) || 0));
      h.players.set(conn.peer, p);
      conn.send({ type: 'welcome', pack: h.packCode, name });
    } else if (p && msg.type === 'at') {
      p.at = Math.max(0, Math.min(h.pack.levels.length - 1, Number(msg.level) || 0));
    } else if (p && msg.type === 'progress') {
      const i = Number(msg.level);
      if (i >= 0 && i < h.pack.levels.length) p.stars[i] = Math.max(p.stars[i] || 0, Math.min(3, Number(msg.stars) || 0));
    }
    drawPlayers();
  }

  const joinUrl = () => `${location.href.split('#')[0]}#/join/${host.code}`;
  function renderHost(packCode) {
    if (!peerOk()) { api.app.innerHTML = '<section class="screen"><p>เบราว์เซอร์นี้เปิดห้องเรียนสดไม่ได้</p></section>'; return; }
    if (host && host.packCode === packCode) { drawRoom(); return; }
    api.app.innerHTML = '<section class="screen"><p>กำลังเปิดห้อง...</p></section>';
    window.Teacher.decodePack(packCode)
      .then((pack) => { openRoom(packCode, pack); drawRoom(); })
      .catch(() => { api.app.innerHTML = '<section class="screen"><p>ชุดด่านนี้เปิดไม่ได้ กลับไปสร้างลิงก์ใหม่</p><a class="btn" href="#/teach">← ตัวสร้างด่าน</a></section>'; });
  }
  function drawRoom() {
    if (!host || !location.hash.startsWith('#/room/')) return;
    const { esc } = api;
    const ready = host.peer && host.peer.open && !host.error;
    let qr = '';
    if (ready) {
      try { const q = window.qrcode(0, 'M'); q.addData(joinUrl()); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true, alt: 'QR code สำหรับเข้าห้อง' }); } catch (e) { qr = ''; }
    }
    const packUrl = `${location.href.split('#')[0]}#/pack/${host.packCode}`;
    api.app.innerHTML = `<section class="screen room">
      <div class="screen-head"><a href="#/teach" class="btn small ghost">← ตัวสร้างด่าน</a><h1>🏫 ห้องเรียนสด: ${esc(host.pack.title)}</h1></div>
      <article class="card room-card">
        ${host.error ? `<p class="pz-error">เปิดห้องไม่ได้ (${esc(host.error)}) อาจเพราะอินเทอร์เน็ตหรือเครือข่ายโรงเรียนบล็อกไว้ ให้นักเรียนใช้ลิงก์ชุดด่านด้านล่างแทน</p>
            <button type="button" class="btn big primary" id="roomRetry">↻ ลองเปิดห้องอีกครั้ง</button>`
          : ready ? `<p class="room-label">รหัสห้อง</p><p class="room-code" aria-live="polite">${host.code}</p>
            <div class="qr-box">${qr}</div>
            <p class="note">ให้นักเรียนสแกน QR หรือเปิดเกม แล้วกด 🙋 เข้าห้องเรียน แล้วใส่รหัสห้อง</p>`
          : '<p>กำลังเปิดห้อง...</p>'}
      </article>
      <h2 class="section-title">นักเรียนในห้อง <span id="roomCount"></span></h2>
      <div id="roomPlayers"></div>
      <p class="note">🔒 ชื่อเล่นของนักเรียนอยู่บนหน้าจอนี้เท่านั้น ไม่ได้บันทึกไว้ที่ไหน ปิดห้องหรือปิดหน้านี้แล้วจะหายไป</p>
      <details class="card room-fallback"><summary>ถ้าเชื่อมต่อไม่ได้</summary>
        <p>เครือข่ายบางแห่งบล็อกการเชื่อมต่อแบบนี้ นักเรียนยังเล่นชุดด่านเดียวกันได้จากลิงก์นี้ (แต่จะไม่ขึ้นในรายชื่อ)</p>
        <label class="field">ลิงก์ชุดด่าน <input type="text" readonly value="${esc(packUrl)}"></label></details>
      <button type="button" class="btn big danger wide" id="roomClose">⏹ ปิดห้อง</button>
    </section>`;
    const retry = api.app.querySelector('#roomRetry');
    if (retry) retry.addEventListener('click', () => { const { packCode, pack } = host; openRoom(packCode, pack); drawRoom(); });
    api.app.querySelector('#roomClose').addEventListener('click', () => { closeRoom(); api.toast('ปิดห้องแล้ว'); api.go('#/teach'); });
    drawPlayers();
  }
  function drawPlayers() {
    const box = document.getElementById('roomPlayers');
    if (!host || !box) return;
    const n = host.pack.levels.length;
    const list = [...host.players.values()].map((p) => ({
      p, total: p.stars.reduce((a, b) => a + (b || 0), 0), solved: p.stars.filter(Boolean).length
    })).sort((a, b) => b.total - a.total || b.solved - a.solved || a.p.joined - b.p.joined);
    document.getElementById('roomCount').textContent = `(${list.filter((x) => x.p.online).length} คนออนไลน์)`;
    box.innerHTML = list.length ? `<ol class="room-list">${list.map(({ p, total, solved }, k) => `
      <li class="room-player ${p.online ? '' : 'off'}">
        <span class="room-rank">${k < 3 && total ? ['🥇', '🥈', '🥉'][k] : k + 1}</span>
        <span class="room-name">${api.esc(p.name)}</span>
        <span class="room-at">${solved === n ? '🏆 ครบ' : `ด่าน ${p.at + 1}/${n}`}</span>
        <span class="room-stars">⭐ ${total}</span>
        <span class="room-dot" aria-label="${p.online ? 'ออนไลน์' : 'หลุดการเชื่อมต่อ'}">${p.online ? '🟢' : '⚪'}</span>
      </li>`).join('')}</ol>` : '<p class="g-empty">ยังไม่มีนักเรียนเข้าห้อง</p>';
  }

  // ---------- Student: join a room ----------
  function renderJoin(room) {
    const { esc } = api;
    const saved = (() => { try { return sessionStorage.getItem('vct-nick') || ''; } catch (e) { return ''; } })();
    api.app.innerHTML = `<section class="screen join">
      <div class="hero">${api.mascot('wave')}<div class="bubble"><p>เข้าห้องเรียนของคุณครู แล้วแข่งเก็บดาวกับเพื่อน ๆ!</p></div></div>
      <form class="card join-card" id="joinForm">
        <label class="field">รหัสห้อง (6 หลัก) <input type="text" id="joinRoom" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required value="${esc(room || '')}" autocomplete="off"></label>
        <label class="field">ชื่อเล่น <input type="text" id="joinName" maxlength="${NAME_MAX}" required value="${esc(saved)}" autocomplete="off"></label>
        <p class="note">🔒 ใช้ชื่อเล่น ไม่ต้องใช้ชื่อจริงหรือนามสกุล ชื่อนี้จะขึ้นบนจอคุณครูเท่านั้น และไม่ถูกบันทึกไว้</p>
        <button type="submit" class="btn big primary wide" id="joinGo">🙋 เข้าห้อง</button>
        <p class="pz-error" id="joinError" role="alert" hidden></p>
      </form>
    </section>`;
    const form = api.app.querySelector('#joinForm');
    (room ? api.app.querySelector('#joinName') : api.app.querySelector('#joinRoom')).focus();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = api.app.querySelector('#joinRoom').value.trim();
      const name = cleanName(api.app.querySelector('#joinName').value);
      if (!/^\d{6}$/.test(code)) { joinError('รหัสห้องต้องเป็นตัวเลข 6 หลัก'); return; }
      if (!name) { joinError('ใส่ชื่อเล่นก่อนนะ'); return; }
      try { sessionStorage.setItem('vct-nick', name); } catch (err) { /* ignore */ }
      join(code, name);
    });
  }
  function joinError(msg) {
    const box = document.getElementById('joinError');
    const btn = document.getElementById('joinGo');
    if (btn) { btn.disabled = false; btn.textContent = '🙋 เข้าห้อง'; }
    if (box) { box.hidden = false; box.textContent = msg; }
  }
  function leave() {
    if (student && student.peer) student.peer.destroy();
    student = null;
  }
  function join(code, name) {
    if (!peerOk()) { joinError('เบราว์เซอร์นี้เข้าห้องเรียนสดไม่ได้ ขอลิงก์ชุดด่านจากคุณครูแทน'); return; }
    leave();
    const btn = document.getElementById('joinGo');
    if (btn) { btn.disabled = true; btn.textContent = 'กำลังเชื่อมต่อ...'; }
    const s = { room: code, name, peer: new window.Peer({ debug: 0 }), conn: null, pack: null, online: false };
    student = s;
    const timer = setTimeout(() => { if (student === s && !s.online) { leave(); joinError('เชื่อมต่อไม่ได้ ลองอีกครั้ง หรือขอลิงก์ชุดด่านจากคุณครูแทน'); } }, 15000);
    s.peer.on('error', (e) => {
      if (student !== s) return;
      clearTimeout(timer);
      if (!s.online) { leave(); joinError(e.type === 'peer-unavailable' ? 'ไม่พบห้องนี้ ตรวจรหัสห้องอีกครั้ง หรือคุณครูอาจปิดห้องแล้ว' : 'เชื่อมต่อไม่ได้ ลองอีกครั้ง หรือขอลิงก์ชุดด่านจากคุณครูแทน'); }
    });
    s.peer.on('open', () => {
      const conn = s.peer.connect(PREFIX + code, { reliable: true });
      s.conn = conn;
      conn.on('open', () => conn.send({ type: 'hello', name }));
      conn.on('data', (msg) => {
        if (student !== s || !msg) return;
        if (msg.type === 'full') { clearTimeout(timer); leave(); joinError('ห้องเต็มแล้ว'); return; }
        if (msg.type !== 'welcome') return;
        clearTimeout(timer);
        const wasOnline = s.online;
        s.online = true;
        s.pack = msg.pack;
        s.name = msg.name;
        // send stars this student already has in this pack (for example after a reload)
        const got = ((api.progress().packs || {})[api.hash(msg.pack)] || []);
        if (got.length) got.forEach((st, i) => { if (st) conn.send({ type: 'progress', level: i, stars: st }); });
        if (!wasOnline) { api.toast(`เข้าห้องแล้วในชื่อ ${msg.name}`); api.go(`#/pack/${msg.pack}`); }
      });
      conn.on('close', () => { if (student === s && s.online) { s.online = false; api.toast('หลุดจากห้อง แต่ยังเล่นต่อได้'); badgeRefresh(); } });
    });
  }

  // called by teacher.js while a student plays a pack
  function report(packCode, msg) {
    if (student && student.online && student.pack === packCode && student.conn && student.conn.open) student.conn.send(msg);
  }
  // a small "you are in room 123456 as Nick" line for pack screens
  function badge(packCode) {
    if (!student || student.pack !== packCode) return '';
    return `<p class="room-badge" id="roomBadge">${student.online ? '🟢' : '⚪'} ห้อง ${student.room} · ${api.esc(student.name)}${student.online ? '' : ' (หลุดการเชื่อมต่อ)'}</p>`;
  }
  function badgeRefresh() {
    const b = document.getElementById('roomBadge');
    if (b && student) b.outerHTML = badge(student.pack);
  }

  function route(screen, parts) {
    if (screen === 'room' && parts[0]) { renderHost(parts[0]); return true; }
    if (screen === 'join') { renderJoin(parts[0] || ''); return true; }
    return false;
  }

  return { init(a) { api = a; }, route, report, badge, isHosting: () => !!host };
})();
