// เรียนโค้ดกับน้องบิต: the app core. Plain JavaScript, no framework.
// The game: program the robot Bit on a grid, in Python or C. Levels are grouped into chapters,
// and the first level of each new idea starts with a short tip.
// Screens (hash routes):
//   #/            home (chapters and levels)
//   #/start       choose a language (shown first, until one is chosen)
//   #/level/<n>   level n (counting from 0 across all chapters)
(() => {
  'use strict';

  const { WORDS, CHAPTERS, BADGES } = window.CONTENT;
  const XP_PER_LEVEL = 300;
  const TYPING_UNLOCK = 'seq'; // typing mode unlocks after finishing this chapter
  const LANGS = { python: '🐍 Python', c: '🅲 C' };

  // every main level in one list, with its chapter. They unlock one after another.
  const LEVELS = [];
  CHAPTERS.forEach((ch) => ch.levels.forEach((def, k) => LEVELS.push({ def, ch, k, id: `${ch.id}-${k + 1}` })));
  // one optional challenge level per chapter: unlocks with 2 stars per level on average in that chapter
  const CHALLENGES = [];
  CHAPTERS.forEach((ch, ci) => { if (ch.challenge) CHALLENGES.push({ def: ch.challenge, ch, ci, id: `${ch.id}-c`, challenge: true }); });

  // ---------- Star rewards: stars count toward milestones, they are never spent ----------
  const STEP_NEED = 5; // step mode
  const BIT_COLORS = [
    { id: 'purple', name: 'ม่วง', color: null, need: 0 }, // null = the theme's own color
    { id: 'green', name: 'เขียว', color: '#1f9d55', need: 8 },
    { id: 'orange', name: 'ส้ม', color: '#e8710a', need: 15 },
    { id: 'pink', name: 'ชมพู', color: '#d6336c', need: 22 },
    { id: 'blue', name: 'ฟ้า', color: '#1c7ed6', need: 30 },
    { id: 'gold', name: 'ทอง', color: '#c99a06', need: 40 }
  ];

  // ---------- Saving (localStorage, no login) ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: ignore */ }
    }
  };

  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // lang stays null until the student picks one on the start screen
  const DEFAULT_SETTINGS = { size: 'M', theme: 'normal', rate: 0.9, simple: false, showEn: false, motion: !reduceMotion, font: 'sarabun', lang: null, bitColor: 'purple' };
  const settings = Object.assign({}, DEFAULT_SETTINGS, store.get('vct-settings', {}));
  // progress.stars[levelId] = best stars · progress.wins = { python: true, c: true } (languages used to win)
  const PROGRESS_KEY = 'vct3-progress';
  const freshProgress = () => ({ stars: {}, xp: 0, badges: [], words: [], listens: 0, wins: {} });
  let progress = Object.assign(freshProgress(), store.get(PROGRESS_KEY, {}));
  const saveSettings = () => store.set('vct-settings', settings);
  const saveProgress = () => store.set(PROGRESS_KEY, progress);

  const SIZES = ['S', 'M', 'L', 'XL'];
  const SIZE_NAMES = { S: 'เล็ก', M: 'กลาง', L: 'ใหญ่', XL: 'ใหญ่มาก' };
  const THEMES = ['normal', 'contrast', 'dark'];
  const THEME_NAMES = { normal: 'ปกติ', contrast: 'คอนทราสต์สูง', dark: 'โหมดมืด' };

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const app = $('#app');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // {คำ} → a tappable hard word. Only Thai words in the word list; other braces (C code like { }) stay as they are.
  const rich = (s) => esc(s).replace(/\{([฀-๿]+)\}/g, (m, w) =>
    WORDS[w] ? `<button type="button" class="word" data-word="${w}">${w}</button>` : m);
  // text for the speech engine: drop the word markers, keep code braces out of the spoken text
  const plain = (s) => String(s).replace(/\{([฀-๿]+)\}/g, '$1').replace(/[{}"]/g, ' ').replace(/→/g, ' แล้ว ').replace(/_/g, ' ');
  const starsOf = (i) => progress.stars[LEVELS[i].id] || 0;
  const isUnlocked = (i) => i === 0 || starsOf(i - 1) > 0;
  const chapterDone = (chId) => LEVELS.filter((l) => l.ch.id === chId).every((l) => progress.stars[l.id]);
  const canType = () => chapterDone(TYPING_UNLOCK);
  const totalStars = () => LEVELS.concat(CHALLENGES).reduce((n, l) => n + (progress.stars[l.id] || 0), 0);
  const canStep = () => totalStars() >= STEP_NEED;
  const chapterStars = (ch) => LEVELS.filter((l) => l.ch === ch).reduce((n, l) => n + (progress.stars[l.id] || 0), 0);
  const challengeNeed = (ch) => ch.levels.length * 2;
  const challengeOpen = (c) => chapterStars(c.ch) >= challengeNeed(c.ch);
  const level = () => Math.floor((progress.xp || 0) / XP_PER_LEVEL) + 1;
  const stars = (n, max = 3) => Array.from({ length: max }, (_, i) => `<span class="star ${i < n ? 'on' : ''}" aria-hidden="true">★</span>`).join('');

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ---------- Mascot (inline SVG, drawn in code) ----------
  const MASCOT = `<svg class="mascot-svg" viewBox="0 0 120 120" aria-hidden="true">
    <line x1="60" y1="10" x2="60" y2="26" class="m-line"/><circle cx="60" cy="10" r="7" class="m-accent"/>
    <rect x="8" y="50" width="12" height="22" rx="6" class="m-ear"/><rect x="100" y="50" width="12" height="22" rx="6" class="m-ear"/>
    <rect x="16" y="24" width="88" height="72" rx="24" class="m-head"/>
    <rect x="28" y="40" width="64" height="38" rx="15" class="m-face"/>
    <g class="m-eyes"><circle cx="46" cy="57" r="6.5" class="m-eye"/><circle cx="74" cy="57" r="6.5" class="m-eye"/></g>
    <path d="M49 68 q11 8 22 0" class="m-mouth"/>
    <circle cx="36" cy="70" r="4" class="m-cheek"/><circle cx="84" cy="70" r="4" class="m-cheek"/>
    <rect x="40" y="98" width="40" height="16" rx="8" class="m-head"/>
  </svg>`;
  const mascot = (mood = '') => `<div class="mascot ${mood}">${MASCOT}</div>`;

  // ---------- Read aloud (Web Speech API) ----------
  // TODO (after the gameplay is finished): play pre-made audio files first, fall back to this.
  const canSpeak = 'speechSynthesis' in window;
  let thaiVoice = null;
  let speakingBtn = null;
  function loadVoices() {
    if (!canSpeak) return;
    const voices = speechSynthesis.getVoices();
    thaiVoice = voices.find((v) => /^th/i.test(v.lang)) || null;
    const note = $('#voiceNote');
    if (note) note.textContent = thaiVoice ? `เสียงที่ใช้: ${thaiVoice.name}`
      : voices.length ? 'ไม่พบเสียงภาษาไทยในเครื่องนี้ ลองใช้ Chrome หรือ Edge หรือติดตั้งเสียงภาษาไทยในเครื่อง' : '';
  }
  if (canSpeak) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

  function resetSpeakBtn() {
    if (speakingBtn) { speakingBtn.classList.remove('speaking'); speakingBtn.setAttribute('aria-pressed', 'false'); }
    speakingBtn = null;
  }
  function stopSpeaking() { if (canSpeak) speechSynthesis.cancel(); resetSpeakBtn(); }
  function speak(text, btn, count = true) {
    if (!canSpeak) { toast('เบราว์เซอร์นี้อ่านออกเสียงไม่ได้ 😢'); return; }
    if (btn && btn === speakingBtn) { stopSpeaking(); return; } // press again = stop
    stopSpeaking();
    const u = new SpeechSynthesisUtterance(plain(text));
    u.lang = 'th-TH';
    if (thaiVoice) u.voice = thaiVoice;
    u.rate = settings.rate;
    if (btn) { speakingBtn = btn; btn.classList.add('speaking'); btn.setAttribute('aria-pressed', 'true'); }
    u.onend = u.onerror = () => { if (speakingBtn === btn) resetSpeakBtn(); };
    speechSynthesis.speak(u);
    if (count) {
      progress.listens = (progress.listens || 0) + 1;
      saveProgress();
    }
  }

  // ---------- Rewards: badges and XP ----------
  function award(id) {
    if (progress.badges.includes(id)) return false;
    progress.badges.push(id);
    saveProgress();
    const b = BADGES.find((x) => x.id === id);
    if (b) setTimeout(() => toast(`🏅 ได้เหรียญใหม่: ${b.icon} ${b.name}`), 300);
    return true;
  }
  function addXp(n) {
    if (n <= 0) return;
    const before = level();
    progress.xp = (progress.xp || 0) + n;
    saveProgress();
    if (level() > before) setTimeout(() => toast(`⬆️ เลเวลอัป! ตอนนี้ Lv.${level()}`), 1200);
    updateHeader();
  }
  function updateHeader() {
    $('#starTotal').textContent = totalStars();
    $('#levelNum').textContent = level();
  }

  // ---------- Settings ----------
  let currentPuzzle = null; // the level on screen, so a language change can redraw its code
  function applySettings() {
    const r = document.documentElement;
    r.dataset.size = settings.size;
    r.dataset.theme = settings.theme;
    r.dataset.motion = settings.motion ? 'on' : 'off';
    r.dataset.font = settings.font;
    // Bit's color (a star reward). The high-contrast theme ignores it in the CSS.
    const bit = BIT_COLORS.find((c) => c.id === settings.bitColor);
    if (bit && bit.color) r.style.setProperty('--bit', bit.color); else r.style.removeProperty('--bit');
    $('#btnSize').setAttribute('aria-label', `เปลี่ยนขนาดตัวอักษร (ตอนนี้: ${SIZE_NAMES[settings.size]})`);
    $('#btnTheme').setAttribute('aria-label', `เปลี่ยนสีหน้าจอ (ตอนนี้: ${THEME_NAMES[settings.theme]})`);
    syncSettingsForm();
  }
  function setSetting(key, value, rerender = false) {
    const old = settings[key];
    settings[key] = value;
    saveSettings();
    applySettings();
    if (key === 'lang' && old !== value) {
      if (currentPuzzle && app.querySelector('.puzzle')) {
        currentPuzzle.refresh(old);
        const tip = $('#tipBox');
        if (tip) tip.outerHTML = tipHtml(currentEntry.def.tip, tip.open);
        wireTip();
      } else if (app.querySelector('.home')) route();
      toast(`ภาษา: ${LANGS[value]}`);
    }
    if (rerender && app.querySelector('.home')) route();
    if (rerender && app.querySelector('.puzzle') && $('#tipBox')) { // simple Thai / English in the tip
      const tip = $('#tipBox');
      tip.outerHTML = tipHtml(currentEntry.def.tip, tip.open);
      wireTip();
    }
  }
  function buildSeg(el, values, names, key) {
    el.innerHTML = values.map((v) =>
      `<button type="button" data-v="${v}" aria-pressed="false" class="seg-btn ${key === 'size' ? 'size-' + v : ''}">${names[v]}</button>`).join('');
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (b) setSetting(key, b.dataset.v);
    });
  }
  function syncSettingsForm() {
    document.querySelectorAll('#segSize button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === settings.size)));
    document.querySelectorAll('#segTheme button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === settings.theme)));
    document.querySelectorAll('#segLang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === settings.lang)));
    $('#rate').value = settings.rate;
    $('#rateLabel').textContent = `${Number(settings.rate).toFixed(1)}×`;
    $('#optSimple').checked = settings.simple;
    $('#optEn').checked = settings.showEn;
    $('#optFont').checked = settings.font === 'looped';
    $('#optMotion').checked = settings.motion;
  }
  function initSettings() {
    buildSeg($('#segLang'), Object.keys(LANGS), LANGS, 'lang');
    buildSeg($('#segSize'), SIZES, SIZE_NAMES, 'size');
    buildSeg($('#segTheme'), THEMES, THEME_NAMES, 'theme');
    $('#rate').addEventListener('input', (e) => setSetting('rate', parseFloat(e.target.value)));
    $('#rateTest').addEventListener('click', (e) => speak('สวัสดีครับ ผมชื่อน้องบิต มาเขียนโปรแกรมด้วยกันนะ', e.currentTarget, false));
    $('#optSimple').addEventListener('change', (e) => setSetting('simple', e.target.checked, true));
    $('#optEn').addEventListener('change', (e) => setSetting('showEn', e.target.checked, true));
    $('#optFont').addEventListener('change', (e) => setSetting('font', e.target.checked ? 'looped' : 'sarabun'));
    $('#optMotion').addEventListener('change', (e) => setSetting('motion', e.target.checked));

    let resetArmed = false;
    $('#btnReset').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      if (!resetArmed) {
        resetArmed = true;
        btn.textContent = 'แน่ใจไหม? กดอีกครั้งเพื่อล้าง';
        setTimeout(() => { resetArmed = false; btn.textContent = 'ล้างความคืบหน้าทั้งหมด'; }, 4000);
        return;
      }
      resetArmed = false;
      btn.textContent = 'ล้างความคืบหน้าทั้งหมด';
      progress = freshProgress();
      saveProgress();
      $('#settingsDlg').close();
      toast('ล้างความคืบหน้าแล้ว เริ่มใหม่ได้เลย');
      location.hash = '#/';
      route();
    });

    $('#btnSize').addEventListener('click', () => {
      const next = SIZES[(SIZES.indexOf(settings.size) + 1) % SIZES.length];
      setSetting('size', next);
      toast(`ขนาดตัวอักษร: ${SIZE_NAMES[next]}`);
    });
    $('#btnTheme').addEventListener('click', () => {
      const next = THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length];
      setSetting('theme', next);
      toast(`สีหน้าจอ: ${THEME_NAMES[next]}`);
    });
    $('#btnSettings').addEventListener('click', () => { syncSettingsForm(); loadVoices(); $('#settingsDlg').showModal(); });

    // all dialogs: [data-close] buttons and a click on the backdrop close them
    document.querySelectorAll('dialog').forEach((d) => {
      d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
      d.addEventListener('close', stopSpeaking);
    });
  }

  // ---------- Word pop-up ----------
  let currentWord = null;
  function openWord(w) {
    const info = WORDS[w];
    if (!info) return;
    currentWord = w;
    $('#wordTitle').textContent = w;
    $('#wordEn').textContent = info.en;
    $('#wordMeaning').textContent = info.meaning;
    $('#wordExample').textContent = info.example;
    $('#wordDlg').showModal();
    if (!progress.words.includes(w)) {
      progress.words.push(w);
      saveProgress();
      if (progress.words.length >= 5) award('words');
    }
  }
  $('#wordSpeak').addEventListener('click', (e) => {
    const info = WORDS[currentWord];
    if (info) speak(`${currentWord}. ${info.meaning}. ตัวอย่าง: ${info.example}`, e.currentTarget);
  });
  document.addEventListener('click', (e) => {
    const w = e.target.closest('.word');
    if (w) openWord(w.dataset.word);
  });

  // ---------- Start: choose a language ----------
  const SAMPLE = 'for i in range(3):\n    move()\n    turn_right()';
  const SAMPLE_C = 'for (int i = 0; i < 3; i++) {\n    move();\n    turn_right();\n}';
  function renderStart() {
    const first = !settings.lang;
    app.innerHTML = `<section class="screen start">
      <div class="hero">${mascot('wave')}<div class="bubble"><p>สวัสดี! ผมชื่อน้องบิต 🤖 ผมเดินได้ตามโค้ดที่เธอเขียนเท่านั้น
        ${first ? 'ก่อนเริ่ม เลือกภาษาที่จะใช้เขียนโค้ดสั่งผมก่อนนะ' : 'จะเปลี่ยนภาษาไหม?'}</p></div></div>
      <h1 class="section-title">เลือกภาษาเขียนโปรแกรม</h1>
      <p class="note">ทั้งสองภาษาสั่งให้บิตทำแบบเดียวกัน: เดินหน้าแล้วหันขวา 3 รอบ ดูว่าเขียนต่างกันอย่างไร · เปลี่ยนได้ทุกเมื่อใน ⚙ ตั้งค่า</p>
      <div class="lang-pick">
        <button type="button" class="lang-card" data-lang="python" aria-pressed="${settings.lang === 'python'}">
          <span class="lang-name">🐍 Python</span>
          <span class="lang-desc">อ่านง่าย ใกล้ภาษาอังกฤษ ใช้การย่อหน้าแบ่งส่วนของโค้ด ใช้สอนในวิชาวิทยาการคำนวณ ม.ปลาย</span>
          <pre class="code" lang="en">${esc(SAMPLE)}</pre>
        </button>
        <button type="button" class="lang-card" data-lang="c" aria-pressed="${settings.lang === 'c'}">
          <span class="lang-name">🅲 C</span>
          <span class="lang-desc">ภาษาพื้นฐานของคอมพิวเตอร์ ใช้ ; จบคำสั่ง และ { } แบ่งส่วน หลายมหาวิทยาลัยใช้สอนวิชาเขียนโปรแกรมเบื้องต้น</span>
          <pre class="code" lang="en">${esc(SAMPLE_C)}</pre>
        </button>
      </div>
    </section>`;
    app.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
      setSetting('lang', b.dataset.lang);
      go(first ? '#/level/0' : '#/');
    }));
  }

  // ---------- Home: chapters and levels ----------
  function renderHome() {
    const solved = LEVELS.filter((l) => progress.stars[l.id]).length;
    const nextI = LEVELS.findIndex((l) => !progress.stars[l.id]);
    const greet = solved === 0 ? 'มาเริ่มกันเลย! กดด่าน 1 แล้วเขียนโค้ดพาผมไปที่ธง 🏁'
      : nextI < 0 ? 'สุดยอด! ผ่านครบทุกด่านแล้ว 🎉 ลองกลับไปเก็บ 3 ดาวทุกด่าน หรือลองอีกภาษาดูสิ'
      : `เก่งมาก! ผ่านไปแล้ว ${solved} ด่าน ต่อไป: ${LEVELS[nextI].ch.title} ด่าน ${LEVELS[nextI].k + 1}`;
    const xpIn = (progress.xp || 0) % XP_PER_LEVEL;
    let i = 0;
    const chapters = CHAPTERS.map((ch, ci) => {
      const tiles = ch.levels.map((def, k) => {
        const n = i++;
        const s = starsOf(n);
        if (!isUnlocked(n)) return `<li><span class="lvl locked" aria-label="ด่าน ${k + 1} ล็อกอยู่">🔒<span class="lvl-num">${k + 1}</span></span></li>`;
        return `<li><a class="lvl ${s ? 'done' : 'open'}" href="#/level/${n}" aria-label="ด่าน ${k + 1}: ${esc(def.title)}${s ? ` ได้ ${s} ดาว` : ''}">
          <span class="lvl-num">${def.start ? '🐞' : k + 1}</span><span class="lvl-stars">${stars(s)}</span></a></li>`;
      }).join('');
      // the chapter's challenge level
      const c = CHALLENGES.find((x) => x.ch === ch);
      let chal = '';
      if (c) {
        const s = progress.stars[c.id] || 0;
        chal = challengeOpen(c)
          ? `<li><a class="lvl challenge ${s ? 'done' : 'open'}" href="#/challenge/${ci}" aria-label="ด่านท้าทาย: ${esc(c.def.title)}${s ? ` ได้ ${s} ดาว` : ''}">
              <span class="lvl-num">⭐</span><span class="lvl-tag">ท้าทาย</span><span class="lvl-stars">${stars(s)}</span></a></li>`
          : `<li><span class="lvl challenge locked" aria-label="ด่านท้าทาย ล็อกอยู่ ต้องได้ ${challengeNeed(ch)} ดาวในบทนี้ ตอนนี้ได้ ${chapterStars(ch)}">
              🔒<span class="lvl-tag">ท้าทาย</span><span class="lvl-need">${chapterStars(ch)}/${challengeNeed(ch)}⭐</span></span></li>`;
      }
      const doneN = ch.levels.filter((_, k) => progress.stars[`${ch.id}-${k + 1}`]).length;
      return `<li class="chapter">
        <h2 class="chapter-title"><span aria-hidden="true">${ch.icon}</span> บทที่ ${ci + 1}: ${ch.title} <span class="chapter-en" lang="en">${ch.en}</span>
          <span class="chapter-count">${doneN}/${ch.levels.length}</span></h2>
        <ol class="lvl-grid">${tiles}${chal}</ol></li>`;
    }).join('');
    const badges = BADGES.map((b) => {
      const got = progress.badges.includes(b.id);
      return `<li class="badge ${got ? 'got' : ''}"><span class="badge-icon" aria-hidden="true">${got ? b.icon : '❔'}</span>
        <span class="badge-name">${b.name}</span><span class="badge-desc">${got ? 'ได้แล้ว!' : b.desc}</span>
        <span class="sr">${got ? 'ได้รับแล้ว' : 'ยังไม่ได้รับ'}</span></li>`;
    }).join('');

    app.innerHTML = `<section class="screen home">
      <div class="hero">${mascot('wave')}<div class="bubble"><p>${greet}</p>
        <button type="button" class="btn small" id="greetRead" aria-pressed="false">🔊 ฟัง</button></div></div>
      <div class="overall">
        <div class="xp-row"><span>🏅 เลเวล ${level()} · ⭐ ${totalStars()} ดาว</span><span>${xpIn} / ${XP_PER_LEVEL} XP</span></div>
        <div class="progress xp-bar" role="progressbar" aria-label="ค่าประสบการณ์ในเลเวลนี้" aria-valuemin="0" aria-valuemax="${XP_PER_LEVEL}" aria-valuenow="${xpIn}">
          <div class="bar" style="width:${(xpIn / XP_PER_LEVEL) * 100}%"></div></div>
        <p class="progress-text"><span>ผ่านแล้ว ${solved} / ${LEVELS.length} ด่าน</span>
          <a class="btn small" href="#/start">ภาษา: ${LANGS[settings.lang]} ⇄</a></p>
        <p class="note">${canType() ? '⌨️ ปลดล็อกโหมดพิมพ์โค้ดแล้ว!' : '⌨️ โหมดพิมพ์โค้ดเอง จะปลดล็อกเมื่อผ่านบทที่ 1'}</p>
      </div>
      ${rewardsHtml()}
      <ol class="chapters">${chapters}</ol>
      <h2 class="section-title">เหรียญรางวัล (${progress.badges.length}/${BADGES.length})</h2>
      <ul class="badge-shelf">${badges}</ul>
    </section>`;
    $('#greetRead').addEventListener('click', (e) => speak(greet, e.currentTarget));
    app.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => {
      setSetting('bitColor', b.dataset.color);
      app.querySelectorAll('[data-color]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      toast(`เปลี่ยนสีน้องบิตเป็นสี${b.dataset.name}แล้ว`);
    }));
  }

  // the "star rewards" panel on the home screen
  function rewardsHtml() {
    const have = totalStars();
    const goals = [STEP_NEED].concat(BIT_COLORS.map((c) => c.need)).filter((n) => n > have).sort((x, y) => x - y);
    const next = goals[0];
    const prevGoal = [0, STEP_NEED].concat(BIT_COLORS.map((c) => c.need)).filter((n) => n <= have).sort((x, y) => y - x)[0];
    const pct = next ? ((have - prevGoal) / (next - prevGoal)) * 100 : 100;
    const swatches = BIT_COLORS.map((c) => {
      const open = have >= c.need;
      const on = settings.bitColor === c.id;
      return `<button type="button" class="swatch" ${open ? `data-color="${c.id}" data-name="${c.name}"` : 'disabled'} aria-pressed="${on}"
        aria-label="สีน้องบิต: ${c.name}${open ? '' : ` ล็อกอยู่ ต้องมี ${c.need} ดาว`}" style="--sw:${c.color || 'var(--primary)'}">
        <span class="swatch-dot" aria-hidden="true">${open ? '' : '🔒'}</span><span class="swatch-name">${c.name}${open ? '' : ` ${c.need}⭐`}</span></button>`;
    }).join('');
    return `<section class="rewards" aria-labelledby="rewardsTitle">
      <h2 class="section-title" id="rewardsTitle">🎁 รางวัลดาว <span class="note">ดาวไม่ถูกใช้หมด สะสมไว้ปลดล็อก</span></h2>
      <div class="xp-row"><span>⭐ ${have} ดาว</span><span>${next ? `อีก ${next - have} ดาว ถึงรางวัลต่อไป` : 'ปลดล็อกครบทุกรางวัลแล้ว!'}</span></div>
      <div class="progress xp-bar" role="progressbar" aria-label="ดาวสู่รางวัลต่อไป" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}">
        <div class="bar" style="width:${pct}%"></div></div>
      <p class="reward-item ${canStep() ? 'got' : ''}">👣 <b>โหมดทีละขั้น</b> (${STEP_NEED}⭐): ${canStep()
        ? 'ปลดล็อกแล้ว! กด 👣 ทีละขั้น ในด่าน เพื่อรันทีละบรรทัด และดูว่าเงื่อนไขเป็นจริงหรือเท็จ'
        : 'รันโปรแกรมทีละบรรทัด และดูว่าเงื่อนไขเป็นจริงหรือเท็จ'}</p>
      <p class="reward-item">⭐ <b>ด่านท้าทาย</b>: ทุกบทมี 1 ด่าน ปลดล็อกเมื่อได้ดาวเฉลี่ย 2 ดวงต่อด่านในบทนั้น</p>
      <p class="g-label">🎨 สีน้องบิต</p>
      <div class="swatches" role="group" aria-label="เลือกสีน้องบิต">${swatches}</div>
    </section>`;
  }

  // ---------- Level ----------
  let currentEntry = null; // { def, ch, id, k? , challenge? }
  function tipHtml(tip, open) {
    if (!tip) return '';
    const lang = settings.lang;
    const text = settings.simple && tip.simple ? tip.simple : tip.text;
    return `<details class="tip-box card reading" id="tipBox" ${open ? 'open' : ''}>
      <summary>💡 บทเรียนสั้น ๆ</summary>
      <p class="card-text">${rich(text)}</p>
      <pre class="code" lang="en" aria-label="ตัวอย่างโค้ด ${LANGS[lang]}">${esc(tip.code[lang])}</pre>
      <p class="tip-note"><b>${LANGS[lang]}:</b> ${rich(tip.notes[lang])}</p>
      ${settings.showEn ? `<p class="card-en" lang="en">🇬🇧 ${esc(tip.en)}</p>` : ''}
      <div class="card-tools">
        <button type="button" class="btn small" id="tipRead" aria-pressed="false">🔊 อ่านให้ฟัง</button>
        <button type="button" class="btn small" id="tipSimple" aria-pressed="${settings.simple}">✨ ภาษาง่าย</button>
        <button type="button" class="btn small" id="tipEn" aria-pressed="${settings.showEn}">EN แปลอังกฤษ</button>
      </div>
      <p class="tip">💡 แตะ<span class="word-sample">คำที่มีเส้นใต้</span> เพื่อดูความหมาย</p>
    </details>`;
  }
  function wireTip() {
    const tip = currentEntry && currentEntry.def.tip;
    if (!tip || !$('#tipBox')) return;
    $('#tipRead').addEventListener('click', (e) => {
      const text = settings.simple && tip.simple ? tip.simple : tip.text;
      speak(`${text}. ${tip.notes[settings.lang]}`, e.currentTarget);
    });
    $('#tipSimple').addEventListener('click', () => { setSetting('simple', !settings.simple, true); $('#tipSimple').focus(); });
    $('#tipEn').addEventListener('click', () => { setSetting('showEn', !settings.showEn, true); $('#tipEn').focus(); });
  }

  // entry = a main level (index i) or a challenge level (i = null)
  function renderLevel(entry, i) {
    currentEntry = entry;
    const chapterNo = CHAPTERS.indexOf(entry.ch) + 1;
    const where = entry.challenge ? '⭐ ด่านท้าทาย' : `ด่าน ${entry.k + 1}/${entry.ch.levels.length}`;
    const head = `<div class="screen-head">
        <a href="#/" class="btn small ghost">← แผนที่ด่าน</a>
        <h1>${entry.ch.icon} บทที่ ${chapterNo}: ${entry.ch.title} · ${where}</h1>
      </div>`;
    currentPuzzle = window.Puzzle.mount({
      el: app, def: entry.def, head,
      tipHtml: tipHtml(entry.def.tip, !progress.stars[entry.id]), // open the tip until the level is solved
      esc, speak, mascot, mascotSvg: MASCOT, stars,
      motion: () => settings.motion,
      lang: () => settings.lang,
      canType, canStep, stepNeed: STEP_NEED,
      finish: (s, info) => finishLevel(entry, i, s, info)
    });
    wireTip();
  }

  function finishLevel(entry, i, s, info) {
    const typingBefore = canType();
    const stepBefore = canStep();
    const openBefore = CHALLENGES.filter(challengeOpen).length;
    const colorsBefore = BIT_COLORS.filter((c) => totalStars() >= c.need).length;
    const prev = progress.stars[entry.id] || 0;
    progress.stars[entry.id] = Math.max(prev, s);
    if (!info.usedSolution) progress.wins[settings.lang] = true;
    saveProgress();
    addXp((progress.stars[entry.id] - prev) * 30 + (prev ? 0 : 20)); // 20 XP for a first clear, 30 per new star

    award('first');
    if (info.fails > 0 && !info.usedSolution) award('persist');
    if (info.typed && !info.usedSolution) award('typist');
    if (progress.wins.python && progress.wins.c) award('bilingual');
    if (entry.challenge && !info.usedSolution) award('challenger');
    if (chapterDone('loop')) award('loop');
    if (LEVELS.concat(CHALLENGES).filter((l) => progress.stars[l.id] === 3).length >= 5) award('puzzle');
    if (LEVELS.every((l) => progress.stars[l.id])) award('all');
    // tell the student about anything new the stars unlocked
    const news = [];
    if (!typingBefore && canType()) news.push('⌨️ ปลดล็อกโหมดพิมพ์โค้ดแล้ว!');
    if (!stepBefore && canStep()) news.push('👣 ปลดล็อกโหมดทีละขั้นแล้ว!');
    if (CHALLENGES.filter(challengeOpen).length > openBefore) news.push('⭐ ปลดล็อกด่านท้าทายใหม่ ดูที่แผนที่ด่าน!');
    if (BIT_COLORS.filter((c) => totalStars() >= c.need).length > colorsBefore) news.push('🎨 ปลดล็อกสีน้องบิตใหม่ เลือกได้ที่หน้าแรก!');
    news.forEach((m, k) => setTimeout(() => toast(m), 2000 + k * 2800));
    updateHeader();

    if (entry.challenge) return { href: '#/', label: '🗺️ กลับแผนที่ด่าน' };
    const next = LEVELS[i + 1];
    if (!next) return { href: '#/', label: '🏆 ผ่านครบทุกด่าน! กลับแผนที่' };
    return next.ch === entry.ch
      ? { href: `#/level/${i + 1}`, label: 'ด่านต่อไป ▶' }
      : { href: `#/level/${i + 1}`, label: `บทใหม่: ${next.ch.icon} ${next.ch.title} ▶` };
  }

  // ---------- Router ----------
  let focusAfter = null;
  function go(hash, focusId) {
    focusAfter = focusId || null;
    if (location.hash === hash) route(); else location.hash = hash;
  }

  function route() {
    stopSpeaking();
    currentPuzzle = null;
    const [screen, n] = location.hash.replace(/^#\/?/, '').split('/');
    const i = parseInt(n, 10);
    if (!settings.lang || screen === 'start') renderStart();
    else if (screen === 'level' && LEVELS[i] && isUnlocked(i)) renderLevel(LEVELS[i], i);
    else if (screen === 'challenge' && CHALLENGES.find((c) => c.ci === i && challengeOpen(c))) renderLevel(CHALLENGES.find((c) => c.ci === i), null);
    else renderHome();
    updateHeader();
    const f = focusAfter && document.getElementById(focusAfter);
    if (f && !f.disabled) f.focus(); else if (focusAfter) app.focus();
    focusAfter = null;
    window.scrollTo(0, 0);
  }

  // ---------- Start ----------
  $('#brandMascot').innerHTML = MASCOT;
  initSettings();
  applySettings();
  window.addEventListener('hashchange', route);
  route();
})();
