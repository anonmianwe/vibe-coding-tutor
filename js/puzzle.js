// Code Puzzle engine: the student writes a program in Python or C (by tapping blocks, or by typing)
// and runs it to move Bit on a grid.
//
// Inside, a program is a list of blocks (nodes):
//   { t: "move" | "left" | "right" | "pick" }
//   { t: "repeat", n: 3, body: [...] }
//   { t: "if", cond: "wall" | "gem", then: [...], else: [...] }
// The same blocks are shown as Python or C code (toCode), and typed code is turned back into blocks
// (parsePython / parseC). The game understands only these commands:
//   move  turn_left  turn_right  pick_gem  ·  for loops with a fixed count  ·  if wall_ahead() / gem_here(), with optional else
// Chapter files write programs as short text (see chapter-1.js): "3{M R M L}", "?wall{R}{M}".
//
// app.js calls Puzzle.mount(ctx) and gets back { refresh() } to call when the language changes. ctx has:
//   el, def (this level), head (HTML for the top of the screen), tipHtml, index, total, esc, speak(text, btn), mascot(mood),
//   mascotSvg, stars(n), motion(), lang() ("python" or "c"), canType(), finish(stars, info) -> { href, label }
// Puzzle.simulate(def, programText) runs a program without drawing (used by the automated test).
window.Puzzle = (() => {
  'use strict';

  // ---------- Blocks ----------
  const TH = { move: 'เดินหน้า', left: 'หันซ้าย', right: 'หันขวา', pick: 'เก็บเพชร', repeat: 'ทำซ้ำ', ifwall: 'ถ้าข้างหน้าตัน', ifgem: 'ถ้ามีเพชรตรงนี้' };
  const CALLS = { move: 'move', left: 'turn_left', right: 'turn_right', pick: 'pick_gem' };
  const CONDS = { wall: 'wall_ahead', gem: 'gem_here' };
  const CALL_OF = { move: 'move', turn_left: 'left', turn_right: 'right', pick_gem: 'pick' };
  const COND_OF = { wall_ahead: 'wall', gem_here: 'gem' };
  const LOOP_VARS = ['i', 'j', 'k', 'm'];
  const blockKey = (n) => (n.t === 'if' ? 'if' + n.cond : n.t);

  let uid = 0;
  const node = (t, extra) => Object.assign({ id: 'b' + (++uid), t }, extra);
  function newBlock(type) {
    if (type === 'repeat') return node('repeat', { n: 3, body: [] });
    if (type === 'ifwall') return node('if', { cond: 'wall', then: [], else: [] });
    if (type === 'ifgem') return node('if', { cond: 'gem', then: [], else: [] });
    return node(type);
  }

  // number of blocks, counting blocks inside loops and ifs
  const count = (list) => list.reduce((n, b) => n + 1 + (b.body ? count(b.body) : 0) + (b.then ? count(b.then) + count(b.else) : 0), 0);

  // ---------- Short program text used in the chapter files: "3{M R M L}" ----------
  function parseDsl(src) {
    const s = String(src).replace(/\s+/g, '');
    let i = 0;
    const expect = (ch) => { if (s[i] !== ch) throw new Error(`program "${src}": expected ${ch} at ${i}`); i++; };
    function list(end) {
      const out = [];
      while (i < s.length && s[i] !== end) {
        const c = s[i];
        if ('MLRP'.includes(c)) { out.push(node({ M: 'move', L: 'left', R: 'right', P: 'pick' }[c])); i++; }
        else if (/\d/.test(c)) {
          let n = '';
          while (/\d/.test(s[i])) n += s[i++];
          expect('{'); const body = list('}'); expect('}');
          out.push(node('repeat', { n: Number(n), body }));
        } else if (c === '?') {
          i++;
          const cond = s.startsWith('wall', i) ? 'wall' : s.startsWith('gem', i) ? 'gem' : null;
          if (!cond) throw new Error(`program "${src}": unknown condition`);
          i += cond.length;
          expect('{'); const yes = list('}'); expect('}');
          expect('{'); const no = list('}'); expect('}');
          out.push(node('if', { cond, then: yes, else: no }));
        } else throw new Error(`program "${src}": unexpected ${c}`);
      }
      return out;
    }
    return list(undefined);
  }

  // ---------- Blocks → Python or C code ----------
  // Returns lines: [{ text, id }] where id is the block that starts on that line.
  function toCode(program, lang) {
    const out = [];
    const ind = (d) => '    '.repeat(d);
    const py = lang === 'python';
    function walk(list, d, loops) {
      if (py && d > 0 && !list.length) out.push({ text: ind(d) + 'pass' }); // Python needs something inside
      for (const b of list) {
        if (b.t === 'repeat') {
          const v = LOOP_VARS[loops] || `i${loops}`;
          out.push({ id: b.id, text: ind(d) + (py ? `for ${v} in range(${b.n}):` : `for (int ${v} = 0; ${v} < ${b.n}; ${v}++) {`) });
          walk(b.body, d + 1, loops + 1);
          if (!py) out.push({ text: ind(d) + '}' });
        } else if (b.t === 'if') {
          const c = CONDS[b.cond];
          out.push({ id: b.id, text: ind(d) + (py ? `if ${c}():` : `if (${c}()) {`) });
          walk(b.then, d + 1, loops);
          if (b.else.length) {
            out.push({ text: ind(d) + (py ? 'else:' : '} else {') });
            walk(b.else, d + 1, loops);
          }
          if (!py) out.push({ text: ind(d) + '}' });
        } else {
          out.push({ id: b.id, text: ind(d) + CALLS[b.t] + (py ? '()' : '();') });
        }
      }
    }
    walk(program, 0, 0);
    return out;
  }
  const codeText = (program, lang) => toCode(program, lang).map((l) => l.text).join('\n');

  // ---------- Typed code → blocks ----------
  // Errors are thrown as { line, msg } with a Thai message for students.
  const fail = (line, msg) => { throw { line, msg }; };
  function unknownName(name) {
    const low = name.toLowerCase();
    if (CALL_OF[low] || COND_OF[low]) return `ใช้ตัวพิมพ์เล็กทั้งหมด: ${low}`;
    if (['int', 'main', 'void', 'return', 'include', 'def', 'print', 'printf'].includes(low)) {
      return `ในเกมนี้ไม่ต้องเขียน ${name} เขียนเฉพาะคำสั่งของบิต`;
    }
    return `ไม่รู้จักคำสั่ง ${name} ใช้ได้: move, turn_left, turn_right, pick_gem`;
  }

  function parsePython(text) {
    const lines = [];
    text.replace(/\t/g, '    ').split('\n').forEach((raw, i) => {
      const code = raw.replace(/#.*$/, '');
      if (!code.trim()) return;
      lines.push({ n: i + 1, indent: code.match(/^ */)[0].length, s: code.trim() });
    });
    let p = 0;

    function block(indent) {
      const out = [];
      while (p < lines.length) {
        const L = lines[p];
        if (L.indent < indent) break;
        if (L.indent > indent) fail(L.n, 'ย่อหน้าเกินมา บรรทัดนี้ควรย่อหน้าเท่ากับบรรทัดก่อนหน้า');
        const s = stmt(L, indent);
        if (s) out.push(s);
      }
      return out;
    }
    // the indented lines under a line ending with ":"
    function inner(L, indent) {
      p++;
      const next = lines[p];
      if (!next || next.indent <= indent) fail(L.n, 'หลังบรรทัดที่จบด้วย : ต้องมีคำสั่งที่ย่อหน้าเข้าไป (4 ช่องว่าง)');
      return block(next.indent);
    }
    function stmt(L, indent) {
      const s = L.s.replace(/;$/, '');
      let m;
      if (s === 'pass') { p++; return null; }
      if ((m = s.match(/^(\w+)\s*\(\s*\)$/))) {
        const t = CALL_OF[m[1]];
        if (!t) fail(L.n, COND_OF[m[1]] ? `${m[1]}() เป็นคำถาม ต้องใช้กับ if เช่น if ${m[1]}():` : unknownName(m[1]));
        p++;
        return node(t, { line: L.n });
      }
      if ((m = s.match(/^for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:$/))) {
        const n = Number(m[2]);
        if (n < 1 || n > 50) fail(L.n, 'จำนวนรอบควรอยู่ระหว่าง 1 ถึง 50');
        return node('repeat', { n, body: inner(L, indent), line: L.n });
      }
      if ((m = s.match(/^if\s+(\w+)\s*\(\s*\)\s*:$/))) {
        const cond = COND_OF[m[1]];
        if (!cond) fail(L.n, `ไม่รู้จักเงื่อนไข ${m[1]}() ใช้ได้: wall_ahead() หรือ gem_here()`);
        const then = inner(L, indent);
        let other = [];
        const nx = lines[p];
        if (nx && nx.indent === indent && /^else\s*:$/.test(nx.s)) other = inner(nx, indent);
        return node('if', { cond, then, else: other, line: L.n });
      }
      // friendly errors for common mistakes
      if (/^else\b/.test(s)) fail(L.n, /:$/.test(s) ? 'else ต้องอยู่ต่อจากคำสั่งใน if และย่อหน้าตรงกับ if' : 'ลืมเครื่องหมาย : หลัง else');
      if (/^(for|if|while)\b/.test(s) && !/:$/.test(s)) fail(L.n, 'ลืมเครื่องหมาย : ท้ายบรรทัด');
      if (/^for\b/.test(s)) fail(L.n, 'เขียน for แบบนี้: for i in range(3):');
      if (/^while\b/.test(s)) fail(L.n, 'เกมนี้ยังไม่มี while ใช้ for i in range(...): แทน');
      if (/^if\b/.test(s)) fail(L.n, 'เขียน if แบบนี้: if wall_ahead():');
      if (/^\w+$/.test(s)) fail(L.n, CALL_OF[s] ? `ลืมวงเล็บ () หลัง ${s}` : unknownName(s));
      if ((m = s.match(/^(\w+)\s*\(/))) fail(L.n, CALL_OF[m[1]] ? `${m[1]}() ไม่ต้องใส่อะไรในวงเล็บ และต้องปิดด้วย )` : unknownName(m[1]));
      fail(L.n, 'อ่านบรรทัดนี้ไม่ออก ลองดูตัวอย่างในกล่องบทเรียนด้านบน');
    }
    return block(0);
  }

  function tokenizeC(text) {
    const toks = [];
    let i = 0;
    let line = 1;
    while (i < text.length) {
      const ch = text[i];
      if (ch === '\n') { line++; i++; continue; }
      if (/\s/.test(ch)) { i++; continue; }
      if (text.startsWith('//', i)) { while (i < text.length && text[i] !== '\n') i++; continue; }
      if (text.startsWith('/*', i)) {
        const e = text.indexOf('*/', i + 2);
        const end = e < 0 ? text.length : e + 2;
        line += (text.slice(i, end).match(/\n/g) || []).length;
        i = end;
        continue;
      }
      const rest = text.slice(i);
      let m;
      if ((m = /^[A-Za-z_]\w*/.exec(rest))) { toks.push({ v: m[0], k: 'id', line }); i += m[0].length; continue; }
      if ((m = /^\d+/.exec(rest))) { toks.push({ v: m[0], k: 'num', line }); i += m[0].length; continue; }
      const two = text.substr(i, 2);
      if (['++', '<=', '+=', '==', '!='].includes(two)) { toks.push({ v: two, k: 'op', line }); i += 2; continue; }
      if ('(){};<=+'.includes(ch)) { toks.push({ v: ch, k: 'op', line }); i++; continue; }
      if (ch === '#') fail(line, 'ในเกมนี้ไม่ต้องเขียน #include เขียนเฉพาะคำสั่งของบิต');
      fail(line, `ไม่รู้จักเครื่องหมาย ${ch}`);
    }
    return toks;
  }

  function parseC(text) {
    const toks = tokenizeC(text);
    let p = 0;
    const peek = () => toks[p];
    const prevLine = () => (toks[p - 1] || { line: 1 }).line;
    function expect(v, msg) {
      const t = toks[p];
      if (!t || t.v !== v) fail(!t || v === ';' ? prevLine() : t.line, msg || `ควรมี ${v}${t ? ` แต่เจอ ${t.v}` : ''}`);
      p++;
      return t;
    }
    function stmts(insideBraces) {
      const out = [];
      while (p < toks.length) {
        if (toks[p].v === '}') {
          if (insideBraces) break;
          fail(toks[p].line, 'มี } เกินมา (ไม่มี { คู่ของมัน)');
        }
        const s = stmt();
        if (s) out.push(s);
      }
      if (insideBraces && p >= toks.length) fail(prevLine(), 'ลืมปิด } ให้ครบทุกคู่');
      return out;
    }
    function block(what) {
      expect('{', `${what} ต้องมี { เปิด ก่อนคำสั่งข้างใน`);
      const b = stmts(true);
      expect('}');
      return b;
    }
    function stmt() {
      const t = toks[p];
      if (t.v === ';') { p++; return null; }
      if (t.v === 'for') return forStmt();
      if (t.v === 'if') return ifStmt();
      if (t.v === 'else') fail(t.line, 'else ต้องอยู่ต่อจาก } ของ if');
      if (t.v === 'while') fail(t.line, 'เกมนี้ยังไม่มี while ใช้ for (int i = 0; i < 3; i++) แทน');
      if (t.k === 'id') {
        const kind = CALL_OF[t.v];
        if (!kind) fail(t.line, COND_OF[t.v] ? `${t.v}() เป็นคำถาม ต้องใช้กับ if เช่น if (${t.v}())` : unknownName(t.v));
        p++;
        if (!peek() || peek().v !== '(') fail(t.line, `ลืมวงเล็บ () หลัง ${t.v}`);
        p++;
        expect(')', `${t.v}() ไม่ต้องใส่อะไรในวงเล็บ และต้องปิดด้วย )`);
        expect(';', `ลืม ; ท้ายคำสั่ง ${t.v}()`);
        return node(kind, { line: t.line });
      }
      fail(t.line, `อ่านไม่ออกตรง ${t.v}`);
    }
    function forStmt() {
      const line = toks[p].line;
      p++;
      expect('(', 'หลัง for ต้องมีวงเล็บ ( เช่น for (int i = 0; i < 3; i++)');
      if (peek() && peek().v === 'int') p++;
      const v = peek();
      if (!v || v.k !== 'id') fail(line, 'ต้องมีตัวแปรนับรอบ เช่น int i = 0');
      p++;
      expect('=', `ต้องให้ค่าเริ่มต้น เช่น ${v.v} = 0`);
      const start = peek();
      if (!start || start.k !== 'num') fail(line, `ค่าเริ่มต้นต้องเป็นตัวเลข เช่น ${v.v} = 0`);
      p++;
      expect(';', 'ส่วนแรกของ for ต้องจบด้วย ; เช่น int i = 0;');
      const v2 = peek();
      if (!v2 || v2.v !== v.v) fail(line, `ส่วนที่สองต้องเทียบ ${v.v} เช่น ${v.v} < 3`);
      p++;
      const op = peek();
      if (!op || (op.v !== '<' && op.v !== '<=')) fail(line, `ส่วนที่สองใช้ < หรือ <= เช่น ${v.v} < 3`);
      p++;
      const end = peek();
      if (!end || end.k !== 'num') fail(line, `ส่วนที่สองต้องเทียบกับตัวเลข เช่น ${v.v} < 3`);
      p++;
      expect(';', 'ส่วนที่สองของ for ต้องจบด้วย ;');
      const sameVar = () => { const x = peek(); if (!x || x.v !== v.v) fail(line, `ส่วนที่สามต้องเพิ่มค่า ${v.v} เช่น ${v.v}++`); p++; };
      const one = () => { const x = peek(); if (!x || x.v !== '1') fail(line, 'ให้เพิ่มทีละ 1'); p++; };
      if (peek() && peek().v === '++') { p++; sameVar(); }
      else {
        sameVar();
        const o = peek();
        if (o && o.v === '++') p++;
        else if (o && o.v === '+=') { p++; one(); }
        else if (o && o.v === '=') { p++; sameVar(); expect('+', `เขียนแบบนี้: ${v.v} = ${v.v} + 1`); one(); }
        else fail(line, `ส่วนที่สามต้องเพิ่มค่า เช่น ${v.v}++`);
      }
      expect(')', 'for ต้องปิดวงเล็บ )');
      const n = op.v === '<' ? Number(end.v) - Number(start.v) : Number(end.v) - Number(start.v) + 1;
      if (n < 1 || n > 50) fail(line, `ลูปนี้วน ${Math.max(n, 0)} รอบ ควรอยู่ระหว่าง 1 ถึง 50`);
      return node('repeat', { n, body: block('for'), line });
    }
    function ifStmt() {
      const line = toks[p].line;
      p++;
      expect('(', 'เงื่อนไขต้องอยู่ในวงเล็บ เช่น if (wall_ahead())');
      const c = peek();
      const cond = c && COND_OF[c.v];
      if (!cond) fail(line, c ? `ไม่รู้จักเงื่อนไข ${c.v} ใช้ได้: wall_ahead() หรือ gem_here()` : 'ต้องมีเงื่อนไข เช่น wall_ahead()');
      p++;
      expect('(', `ลืม () หลัง ${c.v}`);
      expect(')', `ลืม ) หลัง ${c.v}(`);
      expect(')', 'ลืม ) ปิดเงื่อนไขของ if');
      const then = block('if');
      let other = [];
      if (peek() && peek().v === 'else') { p++; other = block('else'); }
      return node('if', { cond, then, else: other, line });
    }
    return stmts(false);
  }

  function parseCode(text, lang) {
    try {
      return { ok: true, program: lang === 'python' ? parsePython(text) : parseC(text) };
    } catch (e) {
      if (e && e.msg) return { ok: false, line: e.line, msg: e.msg };
      throw e;
    }
  }

  // ---------- The world (one map) ----------
  const DIRS = { U: [-1, 0], R: [0, 1], D: [1, 0], L: [0, -1] };
  const CW = ['U', 'R', 'D', 'L'];
  const turn = (face, step) => CW[(CW.indexOf(face) + step + 4) % 4];
  const MAX_STEPS = 300;

  function makeWorld(rows) {
    const grid = rows.map((r) => r.split(''));
    const w = { rows: grid.length, cols: grid[0].length, grid, face: 'R', gems: new Set(), got: 0, steps: 0, stop: false, win: false, crash: null };
    grid.forEach((row, r) => row.forEach((ch, c) => {
      if (ch === 'S') w.pos = [r, c];
      if (ch === 'G') w.goal = [r, c];
      if (ch === '*') w.gems.add(`${r},${c}`);
    }));
    w.need = w.gems.size;
    w.trail = new Set([w.pos.join(',')]);
    return w;
  }
  const outside = (w, r, c) => r < 0 || c < 0 || r >= w.rows || c >= w.cols;
  const blocked = (w, r, c) => outside(w, r, c) || w.grid[r][c] === '#';
  const ahead = (w) => [w.pos[0] + DIRS[w.face][0], w.pos[1] + DIRS[w.face][1]];
  const atGoal = (w) => w.pos[0] === w.goal[0] && w.pos[1] === w.goal[1];

  function check(cond, w) {
    if (cond === 'wall') { const [r, c] = ahead(w); return blocked(w, r, c); }
    return w.gems.has(w.pos.join(','));
  }

  function act(t, w) {
    if (++w.steps > MAX_STEPS) { w.crash = 'บิตทำงานนานเกินไป ลองลดจำนวนรอบดูนะ'; w.stop = true; return; }
    if (t === 'left') w.face = turn(w.face, -1);
    else if (t === 'right') w.face = turn(w.face, 1);
    else if (t === 'move') {
      const [r, c] = ahead(w);
      if (blocked(w, r, c)) {
        w.crash = outside(w, r, c) ? 'บิตเกือบตกขอบแผนที่!' : 'บิตชนหิน 🪨!';
        w.stop = true;
        return;
      }
      w.pos = [r, c];
      w.trail.add(`${r},${c}`);
      if (atGoal(w) && w.got === w.need) { w.win = true; w.stop = true; } // reaching the flag ends the run
    } else if (t === 'pick') {
      const k = w.pos.join(',');
      if (!w.gems.has(k)) { w.crash = 'ตรงนี้ไม่มีเพชร 💎'; w.stop = true; return; }
      w.gems.delete(k);
      w.got++;
    }
  }

  // Runs the program one action at a time. Each yield = one thing to show on screen.
  function* exec(list, w) {
    for (const b of list) {
      if (w.stop) return;
      if (b.t === 'repeat') {
        for (let k = 0; k < b.n && !w.stop; k++) yield* exec(b.body, w);
      } else if (b.t === 'if') {
        const yes = check(b.cond, w);
        yield { b, cond: yes };
        yield* exec(yes ? b.then : b.else, w);
      } else {
        act(b.t, w);
        yield { b };
      }
    }
  }

  function outcome(w) {
    if (w.win) return { ok: true };
    if (w.crash) return { ok: false, msg: w.crash };
    if (atGoal(w) && w.got < w.need) return { ok: false, msg: `ถึงธงแล้ว แต่เก็บเพชรได้ ${w.got} จาก ${w.need} เม็ด` };
    if (w.got < w.need) return { ok: false, msg: `คำสั่งหมดแล้ว เก็บเพชรได้ ${w.got} จาก ${w.need} เม็ด และยังไม่ถึงธง 🏁` };
    return { ok: false, msg: 'คำสั่งหมดแล้ว แต่บิตยังไปไม่ถึงธง 🏁' };
  }

  const mapsOf = (def) => def.maps || [def.map];

  // For the test: run a program (short text) on every map without drawing.
  function simulate(def, programText) {
    return runAll(def, parseDsl(programText));
  }
  function runAll(def, program) {
    const maps = mapsOf(def);
    for (let m = 0; m < maps.length; m++) {
      const w = makeWorld(maps[m]);
      for (const _ of exec(program, w)) { /* run to the end */ }
      const res = outcome(w);
      if (!res.ok) return { ok: false, map: m, msg: res.msg };
    }
    return { ok: true, blocks: count(program) };
  }

  // ---------- Screen ----------
  const ROT = { U: -90, R: 0, D: 90, L: 180 };
  const ARROW = '<svg class="pz-face" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h9V4l6 6-6 6v-4H3z"/></svg>';
  const FACE_NAMES = { U: 'ขึ้น', R: 'ขวา', D: 'ลง', L: 'ซ้าย' };

  // what a palette button shows in each language
  function paletteCode(type, lang) {
    const py = lang === 'python';
    if (CALLS[type]) return CALLS[type] + (py ? '()' : '();');
    if (type === 'repeat') return py ? 'for i in range(3):' : 'for (...; i < 3; ...)';
    const c = CONDS[type === 'ifwall' ? 'wall' : 'gem'];
    return py ? `if ${c}():` : `if (${c}())`;
  }
  // what gets typed when a palette button is tapped in typing mode
  function snippet(type, lang) {
    const py = lang === 'python';
    if (CALLS[type]) return CALLS[type] + (py ? '()' : '();');
    if (type === 'repeat') return py ? 'for i in range(3):\n    ' : 'for (int i = 0; i < 3; i++) {\n    \n}';
    const c = CONDS[type === 'ifwall' ? 'wall' : 'gem'];
    return py ? `if ${c}():\n    ` : `if (${c}()) {\n    \n}`;
  }

  function mount(ctx) {
    const { def, esc } = ctx;
    const maps = mapsOf(def);
    const needs = maps.map((m) => makeWorld(m).need);
    const lang = () => ctx.lang();
    const st = {
      program: def.start ? parseDsl(def.start) : [],
      target: 'root',
      mode: 'tap', // 'tap' or 'type'
      fails: 0,
      usedSolution: false,
      running: false,
      map: 0
    };

    const goalText = needs.some((n) => n > 0)
      ? (maps.length > 1 ? 'เก็บเพชร 💎 ให้ครบทุกเม็ด แล้วไปที่ธง 🏁' : `เก็บเพชร 💎 ให้ครบ ${needs[0]} เม็ด แล้วไปที่ธง 🏁`)
      : 'พาน้องบิตไปที่ธง 🏁';
    const speakIntro = `${def.title}. ${def.desc}. ${goalText}`;

    ctx.el.innerHTML = `<section class="screen puzzle" id="pzRoot">
      ${ctx.head}
      ${ctx.tipHtml || ''}
      <article class="card reading pz-brief">
        <h2 class="pz-title">${def.start ? '🐞 ' : ''}${esc(def.title)}</h2>
        <p>${esc(def.desc)}</p>
        <p class="pz-goal">🎯 ${goalText}</p>
        <div class="card-tools"><button type="button" class="btn small" id="pzRead" aria-pressed="false">🔊 ฟัง</button></div>
      </article>
      ${def.flow ? flowHtml(def.flow, esc) : ''}
      ${maps.length > 1 ? `<div class="pz-maps" role="group" aria-label="เลือกดูแผนที่">โปรแกรมเดียว ต้องผ่าน ${maps.length} แผนที่:
        ${maps.map((_, i) => `<button type="button" class="btn small" data-map="${i}" aria-pressed="${i === 0}">แผนที่ ${i + 1}</button>`).join('')}</div>` : ''}
      <div class="pz-stage">
        <div class="pz-board" id="pzBoard"></div>
        <div class="pz-vars" id="pzVars"></div>
      </div>
      <div class="pz-editor" id="pzEditor">
        <div class="pz-modes" role="group" aria-label="วิธีเขียนโปรแกรม">
          <button type="button" class="seg-btn" data-mode="tap" aria-pressed="true">👆 แตะบล็อก</button>
          <button type="button" class="seg-btn" data-mode="type" aria-pressed="false" id="pzTypeTab"></button>
        </div>
        <p class="g-label" id="pzPalLabel"></p>
        <div class="pz-palette" id="pzPalette"></div>
        <p class="g-label">โปรแกรมของบิต <span class="pz-lang" id="pzLang"></span> <span id="pzCount"></span></p>
        <div class="pz-prog code" id="pzProg" lang="en"></div>
        <div class="pz-typebox" id="pzTypeBox" hidden>
          <textarea id="pzText" class="pz-text code" lang="en" spellcheck="false" autocapitalize="off" autocomplete="off" rows="8" aria-label="พิมพ์โค้ดที่นี่"></textarea>
          <pre class="pz-codeview code" id="pzCodeView" lang="en" hidden></pre>
          <div class="pz-typetools">
            <button type="button" class="btn small" id="pzIndent">⇥ ย่อหน้า 4 ช่อง</button>
            <span class="note">แตะปุ่มคำสั่งด้านบน เพื่อพิมพ์ให้อัตโนมัติ</span>
          </div>
          <p class="pz-error" id="pzError" role="alert" hidden></p>
        </div>
      </div>
      <div class="pz-run">
        <button type="button" class="btn big primary" id="pzGo">▶ เริ่ม</button>
        <button type="button" class="btn big" id="pzClear">🗑 ล้าง</button>
        <button type="button" class="btn big" id="pzSolve" hidden>💡 ดูเฉลย</button>
      </div>
      <div class="coach">${ctx.mascot('think')}<div class="bubble" id="pzCoach" aria-live="polite" tabindex="-1"><p>${
        def.start ? 'โปรแกรมนี้มีบั๊ก! กด ▶ เริ่ม เพื่อดูว่าผิดตรงไหน แล้วแก้ไข' : 'แตะคำสั่งเพื่อสร้างโปรแกรม แล้วกด ▶ เริ่ม'}</p></div></div>
      <div id="pzResult"></div>
    </section>`;

    const root = ctx.el.querySelector('#pzRoot');
    const $ = (s) => root.querySelector(s);
    const alive = () => document.body.contains(root);

    // ----- board -----
    function drawBoard(w, activeMap) {
      const cells = [];
      for (let r = 0; r < w.rows; r++) {
        for (let c = 0; c < w.cols; c++) {
          const k = `${r},${c}`;
          const ch = w.grid[r][c];
          const cls = ['pz-cell'];
          let inner = '';
          if (ch === '#') { cls.push('rock'); inner = '🪨'; }
          else if (w.goal[0] === r && w.goal[1] === c) { cls.push('goal'); inner = '🏁'; }
          if (w.gems.has(k)) inner = '💎';
          if (w.trail.has(k) && ch !== '#') cls.push('trail');
          if (w.pos[0] === r && w.pos[1] === c) {
            cls.push('bit');
            inner = `<span class="pz-bit">${ctx.mascotSvg}<span class="pz-dir" style="--rot:${ROT[w.face]}deg">${ARROW}</span></span>`;
          }
          cells.push(`<div class="${cls.join(' ')}">${inner}</div>`);
        }
      }
      const board = $('#pzBoard');
      board.style.setProperty('--cols', w.cols);
      board.setAttribute('role', 'img');
      board.setAttribute('aria-label', `แผนที่ ${activeMap + 1}: บิตอยู่แถว ${w.pos[0] + 1} ช่อง ${w.pos[1] + 1} หันไปทาง${FACE_NAMES[w.face]}`);
      board.innerHTML = cells.join('');
      $('#pzVars').innerHTML = w.need > 0
        ? `<div class="g-box"><span class="g-box-val">${w.got}</span><span class="g-box-tag">gems</span></div><p class="pz-need">ต้องเก็บ ${w.need} เม็ด</p>`
        : '';
    }
    function showMap(m) {
      st.map = m;
      root.querySelectorAll('[data-map]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.map) === m)));
      drawBoard(makeWorld(maps[m]), m);
    }

    // ----- tap editor: blocks shown as real code -----
    function find(id, list = st.program) {
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        if (b.id === id) return { b, list, i };
        for (const kid of [b.body, b.then, b.else]) {
          if (kid) { const f = find(id, kid); if (f) return f; }
        }
      }
      return null;
    }
    function listByKey(key) {
      if (key === 'root') return st.program;
      const [id, part] = key.split('.');
      const f = find(id);
      return f ? f.b[part] : null;
    }

    function listHtml(list, key, loops) {
      const on = st.target === key;
      return `<ol class="pz-list ${on ? 'target' : ''}">${list.map((b, i) => nodeHtml(b, i, loops)).join('')}
        <li class="pz-slot"><button type="button" class="pz-slot-btn" data-target="${key}" aria-pressed="${on}">${on ? '👉 คำสั่งใหม่จะมาที่นี่' : '＋ ใส่คำสั่งที่นี่'}</button></li></ol>`;
    }
    function nodeHtml(b, i, loops) {
      const py = lang() === 'python';
      const th = TH[blockKey(b)];
      let code;
      if (b.t === 'repeat') {
        const v = LOOP_VARS[loops] || `i${loops}`;
        code = py ? `for ${v} in range(<b>${b.n}</b>):` : `for (int ${v} = 0; ${v} &lt; <b>${b.n}</b>; ${v}++) {`;
      } else if (b.t === 'if') {
        code = py ? `if ${CONDS[b.cond]}():` : `if (${CONDS[b.cond]}()) {`;
      } else code = CALLS[b.t] + (py ? '()' : '();');
      const tools = `
        ${b.t === 'repeat' ? `<button type="button" class="pz-tool" data-act="minus" data-id="${b.id}" aria-label="ลดจำนวนรอบ">−</button><button type="button" class="pz-tool" data-act="plus" data-id="${b.id}" aria-label="เพิ่มจำนวนรอบ">+</button>` : ''}
        ${i > 0 ? `<button type="button" class="pz-tool" data-act="up" data-id="${b.id}" aria-label="ย้าย ${th} ขึ้น">▲</button>` : ''}
        <button type="button" class="pz-tool del" data-act="del" data-id="${b.id}" aria-label="ลบ ${th}">✕</button>`;
      const close = py ? '' : '<div class="pz-close">}</div>';
      let kids = '';
      if (b.t === 'repeat') kids = listHtml(b.body, `${b.id}.body`, loops + 1) + close;
      if (b.t === 'if') {
        kids = `${listHtml(b.then, `${b.id}.then`, loops)}<div class="pz-close pz-else">${py ? 'else:' : '} else {'} <span class="pz-th">ไม่อย่างนั้น</span></div>
          ${listHtml(b.else, `${b.id}.else`, loops)}${close}`;
      }
      return `<li class="pz-node t-${b.t}" data-id="${b.id}"><div class="pz-line"><code class="pz-code">${code}</code><span class="pz-th">${th}</span><span class="pz-tools">${tools}</span></div>${kids}</li>`;
    }

    function drawPalette() {
      const typing = st.mode === 'type';
      $('#pzPalLabel').textContent = typing ? 'แตะเพื่อพิมพ์คำสั่ง:' : 'แตะคำสั่งเพื่อเพิ่ม:';
      $('#pzPalette').innerHTML = def.blocks.map((b) =>
        `<button type="button" class="btn pz-add" data-add="${b}"><code>${esc(paletteCode(b, lang()))}</code><small>${TH[b]}</small></button>`).join('');
    }
    function drawProgram() {
      if (!listByKey(st.target)) st.target = 'root';
      $('#pzProg').innerHTML = listHtml(st.program, 'root', 0);
      $('#pzCount').textContent = `(${count(st.program)} คำสั่ง · ดีที่สุด ${def.best})`;
    }
    function drawLang() {
      $('#pzLang').textContent = lang() === 'python' ? '🐍 Python' : '🅲 C';
      const tab = $('#pzTypeTab');
      tab.textContent = ctx.canType() ? '⌨️ พิมพ์โค้ด' : '⌨️ พิมพ์โค้ด 🔒';
      tab.disabled = !ctx.canType();
      tab.title = ctx.canType() ? '' : 'ผ่านบทที่ 1 ก่อน เพื่อปลดล็อก';
    }
    function drawEditor() {
      drawLang();
      drawPalette();
      const typing = st.mode === 'type';
      root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === st.mode)));
      $('#pzProg').hidden = typing;
      $('#pzTypeBox').hidden = !typing;
      if (!typing) drawProgram();
      else $('#pzCount').textContent = `(ดีที่สุด ${def.best} คำสั่ง)`;
    }

    // ----- typing mode -----
    const textArea = () => $('#pzText');
    function showError(res) {
      const box = $('#pzError');
      if (!res) { box.hidden = true; box.textContent = ''; return; }
      box.hidden = false;
      box.textContent = `บรรทัด ${res.line}: ${res.msg}`;
    }
    function setMode(mode) {
      if (mode === st.mode || st.running) return;
      if (mode === 'type') {
        if (!ctx.canType()) return;
        textArea().value = codeText(st.program, lang());
        st.mode = 'type';
        showError(null);
      } else {
        const res = parseCode(textArea().value, lang());
        if (!res.ok) {
          showError(res);
          say(`แก้ข้อผิดพลาดในโค้ดก่อน จึงจะกลับไปโหมดแตะบล็อกได้<br>บรรทัด ${res.line}: ${esc(res.msg)}`, 'think');
          return;
        }
        st.program = res.program;
        st.target = 'root';
        st.mode = 'tap';
      }
      drawEditor();
      clearResult();
    }
    function insertText(text) {
      const ta = textArea();
      const s = ta.selectionStart;
      const e = ta.selectionEnd;
      // start a new line if the cursor is in the middle of one
      const before = ta.value.slice(0, s);
      const lineStart = before.slice(before.lastIndexOf('\n') + 1);
      const indent = lineStart.match(/^ */)[0];
      const needNewLine = lineStart.trim().length > 0;
      const piece = (needNewLine ? '\n' + indent : '') + text.replace(/\n/g, '\n' + indent);
      ta.value = before + piece + ta.value.slice(e);
      // put the cursor at the end of the inserted text, or inside an empty { } block
      const inside = piece.indexOf('\n' + indent + '    \n');
      const pos = inside >= 0 ? s + inside + indent.length + 5 : s + piece.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
      showError(null);
      clearResult();
    }

    function setBusy(busy) {
      st.running = busy;
      root.querySelectorAll('.pz-editor button, #pzClear, #pzSolve, [data-map]').forEach((b) => { b.disabled = busy; });
      textArea().readOnly = busy;
      $('#pzGo').textContent = busy ? '⏳ กำลังทำงาน...' : '▶ เริ่ม';
      $('#pzGo').disabled = busy;
      if (!busy) drawLang();
    }

    function say(html, mood, speakText) {
      const box = $('#pzCoach');
      box.innerHTML = `<p>${html}</p>${speakText ? '<button type="button" class="btn small" id="pzSay" aria-pressed="false">🔊 ฟัง</button>' : ''}`;
      root.querySelector('.coach .mascot').className = `mascot ${mood || ''}`;
      if (speakText) $('#pzSay').addEventListener('click', (e) => ctx.speak(speakText, e.currentTarget));
    }

    // ----- events -----
    $('#pzRead').addEventListener('click', (e) => ctx.speak(speakIntro, e.currentTarget));
    root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    $('#pzIndent').addEventListener('click', () => {
      const ta = textArea();
      const s = ta.selectionStart;
      ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(ta.selectionEnd);
      ta.focus();
      ta.setSelectionRange(s + 4, s + 4);
    });
    textArea().addEventListener('input', () => { showError(null); clearResult(); });
    $('#pzPalette').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add]');
      if (!btn || st.running) return;
      if (st.mode === 'type') { insertText(snippet(btn.dataset.add, lang())); return; }
      const list = listByKey(st.target) || st.program;
      const b = newBlock(btn.dataset.add);
      list.push(b);
      if (b.t === 'repeat') st.target = `${b.id}.body`; // new blocks go inside the new loop
      if (b.t === 'if') st.target = `${b.id}.then`;
      drawProgram();
      clearResult();
    });
    $('#pzProg').addEventListener('click', (e) => {
      if (st.running) return;
      const slot = e.target.closest('[data-target]');
      if (slot) { st.target = slot.dataset.target; drawProgram(); return; }
      const tool = e.target.closest('[data-act]');
      if (!tool) return;
      const f = find(tool.dataset.id);
      if (!f) return;
      const act = tool.dataset.act;
      if (act === 'del') f.list.splice(f.i, 1);
      if (act === 'up' && f.i > 0) [f.list[f.i - 1], f.list[f.i]] = [f.list[f.i], f.list[f.i - 1]];
      if (act === 'plus') f.b.n = Math.min(20, f.b.n + 1);
      if (act === 'minus') f.b.n = Math.max(1, f.b.n - 1);
      drawProgram();
      clearResult();
      const again = root.querySelector(`[data-act="${act}"][data-id="${tool.dataset.id}"]`);
      if (again) again.focus();
    });
    $('#pzClear').addEventListener('click', () => {
      st.program = [];
      st.target = 'root';
      textArea().value = '';
      showError(null);
      drawEditor();
      showMap(0);
      clearResult();
    });
    $('#pzSolve').addEventListener('click', () => {
      st.program = parseDsl(def.solution);
      st.usedSolution = true;
      st.target = 'root';
      if (st.mode === 'type') textArea().value = codeText(st.program, lang());
      showError(null);
      drawEditor();
      say('นี่คือเฉลย กด ▶ เริ่ม เพื่อดูว่าทำงานอย่างไร (ใช้เฉลยแล้ว ด่านนี้จะได้ 1 ดาว)', 'think', 'นี่คือเฉลย กด เริ่ม เพื่อดูว่าทำงานอย่างไร');
    });
    root.querySelectorAll('[data-map]').forEach((b) => b.addEventListener('click', () => { if (!st.running) showMap(Number(b.dataset.map)); }));
    $('#pzGo').addEventListener('click', run);

    function clearResult() { $('#pzResult').innerHTML = ''; }
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const delay = () => (window.PUZZLE_DELAY != null ? window.PUZZLE_DELAY : ctx.motion() ? 380 : 160);

    // highlight the running block (tap mode) or the running line (typing mode)
    function mark(b, cls) {
      root.querySelectorAll('.pz-node.now, .pz-ln.now').forEach((n) => n.classList.remove('now'));
      if (!b) return;
      if (st.mode === 'type') {
        const ln = root.querySelector(`.pz-ln[data-line="${b.line}"]`);
        if (ln) ln.classList.add(cls);
      } else {
        const n = root.querySelector(`.pz-node[data-id="${b.id}"]`);
        if (n) n.classList.add(cls);
      }
    }
    function showCodeView(on) {
      const view = $('#pzCodeView');
      if (on) {
        view.innerHTML = textArea().value.split('\n').map((l, i) => `<span class="pz-ln" data-line="${i + 1}">${esc(l) || ' '}</span>`).join('');
      }
      view.hidden = !on;
      textArea().hidden = on;
    }

    async function run() {
      if (st.running) return;
      if (st.mode === 'type') {
        const res = parseCode(textArea().value, lang());
        if (!res.ok) {
          showError(res);
          say(`โค้ดยังมีข้อผิดพลาด<br>บรรทัด ${res.line}: ${esc(res.msg)}`, 'think', `บรรทัด ${res.line}: ${res.msg}`);
          return;
        }
        st.program = res.program;
        showError(null);
      }
      if (!st.program.length) { say('ยังไม่มีคำสั่งเลย แตะปุ่มคำสั่งด้านบนก่อนนะ', 'think'); return; }
      clearResult();
      root.querySelectorAll('.pz-node.bad').forEach((n) => n.classList.remove('bad'));
      setBusy(true);
      if (st.mode === 'type') showCodeView(true);
      say('กำลังทำตามโปรแกรม... ดูบรรทัดสีเหลือง 👀', 'think');
      for (let m = 0; m < maps.length; m++) {
        showMap(m);
        const w = makeWorld(maps[m]);
        let last = null;
        await sleep(delay());
        for (const ev of exec(st.program, w)) {
          if (!alive()) return;
          last = ev.b;
          mark(ev.b, 'now');
          drawBoard(w, m);
          await sleep(delay());
        }
        if (!alive()) return;
        const res = outcome(w);
        if (!res.ok) {
          mark(null);
          if (st.mode === 'type') showCodeView(false);
          else if (w.crash && last) mark(last, 'bad');
          failRun(res.msg, m, w.crash && last && st.mode === 'type' ? last.line : null);
          return;
        }
        if (m < maps.length - 1) { say(`แผนที่ ${m + 1} ผ่านแล้ว! ต่อไปแผนที่ ${m + 2}...`, 'happy'); await sleep(delay() * 2); }
      }
      mark(null);
      if (st.mode === 'type') showCodeView(false);
      win();
    }

    function failRun(msg, m, line) {
      setBusy(false);
      st.fails++;
      const where = (maps.length > 1 ? `แผนที่ ${m + 1}: ` : '') + (line ? `(บรรทัด ${line}) ` : '');
      say(`${where}${esc(msg)}<br>💡 <b>คำใบ้:</b> ${esc(def.hint)}`, 'think', `${where}${msg}. คำใบ้: ${def.hint}`);
      if (st.fails >= 2) $('#pzSolve').hidden = false;
    }

    function win() {
      setBusy(false);
      const n = count(st.program);
      const stars = st.usedSolution ? 1 : n <= def.best ? 3 : n <= def.best + 2 ? 2 : 1;
      const next = ctx.finish(stars, { fails: st.fails, usedSolution: st.usedSolution, typed: st.mode === 'type' });
      const msg = stars === 3 ? 'สุดยอด! สั้นที่สุดแล้ว ⚡' : st.usedSolution ? 'ผ่านด้วยเฉลย ลองเขียนเองอีกครั้งเพื่อเก็บดาวเพิ่มนะ' : `ผ่านแล้ว! ลองทำให้สั้นลงเหลือ ${def.best} คำสั่ง เพื่อรับ 3 ดาว`;
      say(`<b>${msg}</b>`, 'happy', msg);
      $('#pzResult').innerHTML = `<div class="pz-win">
        <p class="big-stars" aria-label="ได้ ${stars} จาก 3 ดาว">${ctx.stars(stars)}</p>
        <p>ใช้ ${n} คำสั่ง · ดีที่สุด ${def.best} คำสั่ง</p>
        <div class="finish-actions">
          <a class="btn big primary" href="${next.href}" id="pzNext">${next.label}</a>
          <button type="button" class="btn big" id="pzAgain">↻ เล่นด่านนี้อีกครั้ง</button>
        </div></div>`;
      $('#pzAgain').addEventListener('click', () => { clearResult(); showMap(0); say('แก้โปรแกรมให้สั้นลง แล้วกด ▶ เริ่ม อีกครั้ง', 'think'); });
      $('#pzNext').focus();
    }

    drawEditor();
    showMap(0);

    return {
      // called by app.js after the language changes: show the same program in the new language
      refresh(oldLang) {
        if (st.running) return;
        if (st.mode === 'type') {
          const res = parseCode(textArea().value, oldLang);
          if (res.ok) { st.program = res.program; textArea().value = codeText(st.program, lang()); showError(null); }
          else say('โค้ดเดิมยังมีข้อผิดพลาด จึงแปลงเป็นภาษาใหม่ไม่ได้ แก้ก่อน หรือกด 🗑 ล้าง', 'think');
        }
        drawEditor();
      }
    };
  }

  function flowHtml(flow, esc) {
    return `<div class="pz-flow" role="img" aria-label="ผังงาน: ${esc(flow.join(' แล้ว '))}">
      ${flow.map((s, i) => `${i ? '<span class="fc-arrow" aria-hidden="true">↓</span>' : ''}<span class="fc ${i === 0 || i === flow.length - 1 ? 'fc-oval' : 'fc-rect'}">${esc(s)}</span>`).join('')}
    </div>`;
  }

  return { mount, simulate, runAll, parseDsl, parseCode, toCode, codeText, count };
})();
