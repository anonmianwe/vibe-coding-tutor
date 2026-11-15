# AI-made content and tools used

The competition rules (page 4) say: list the AI tools used, list any AI-made images, audio or icons, and **check AI-made content before using it**.
This file lists everything in the app that AI made, what the AI and the automated test already checked, and what **the team must still check by hand**.

Last updated: 2026-11-15.

## 1. Tools and services

| Tool / service | Type | What it was used for | Free / license | AI? |
|---|---|---|---|---|
| Claude Code (model Claude Opus 5.5) | AI coding agent | Planning, rule summary, all code, lesson content, tips, tests, docs | Paid account (the team's) | **Yes** |
| edge-tts 7.3.1 (Microsoft Edge text-to-speech), voice `th-TH-NiwatNeural` | AI text-to-speech | The 211 read-aloud audio files in `audio/` | Free; uses Microsoft's online service | **Yes** (AI voice) |
| Web Speech API (built into the browser) | Browser text-to-speech | Fallback voice when a sentence has no audio file (e.g. teacher-written text) | Built into the browser | Voice is made by the device |
| PeerJS 1.5.4 + PeerJS public server (`0.peerjs.com`) | Library + free service | Live classroom: connects the teacher's and students' browsers (WebRTC) | MIT License; free public server, no API key | No |
| qrcode-generator 1.4.4 (Kazuhiko Arase) | Library | QR codes for pack links and room links | MIT License | No |
| Google Fonts: Sarabun, Mitr, Noto Sans Thai Looped | Web fonts | Text, headings, the easier-to-read font option | SIL Open Font License | No |
| GitHub + GitHub Pages | Hosting | The public repo and the live site | Free | No |
| GitHub CLI (`gh`) | Command-line tool | Creating the repo, turning on Pages | Free | No |
| Google Chrome (headless) | Browser | Running the automated tests and taking screenshots | Free | No |
| Python 3 | Programming language | The audio generator (`tools/make_audio.py`) and the local test server | Free | No |

Emoji (🤖 🏁 🪨 💎 and others) are the device's standard Unicode emoji, not made by AI.

## 2. What AI made

| What | Where | How much | Already checked by AI / the test | The team must check |
|---|---|---|---|---|
| All program code (HTML, CSS, JavaScript) | `index.html`, `css/`, `js/` | about 3,200 lines | 243 automated checks (`tests/play-test.html`) + 22 live-room checks (`tests/room-test.html`) pass; screenshots in 3 themes at phone width | Both members can explain how it works (Q&A rule) |
| Level maps, solutions, hints | `js/content/chapter-1.js` … `chapter-6.js` | 18 levels + 6 challenge levels | The test runs every solution on every map, checks the 3-star target equals the solution length, and checks the buggy debug programs really fail | Levels are fair and not too hard for high school students; hints make sense |
| Short tips (lesson text) | `tip` in the chapter files | 12 tips, each in normal Thai, simple Thai and English | Content review below; the test checks every tip example is valid Python and C (except the variables tip, which shows `gems = 0`, not a game command) | Thai is natural; facts are right; English translations match |
| Code examples and syntax notes | `tip.code`, `tip.notes` | 12 × 2 languages | Content review below | Python and C facts are right |
| Hard-word list | `js/content/words.js` | 16 words: meaning, English, example | Every word used in a tip is in the list (tested) | Meanings and examples are right and simple |
| Coach messages and screen text | `js/puzzle.js` (`MSG`), `js/app.js`, `js/teacher.js`, `js/room.js` | all coach and screen messages | Shown in the tests and screenshots | Thai is natural and friendly |
| Typed-code error messages | `js/puzzle.js` (`parsePython`, `parseC`) | all parser error messages | 8 error cases are tested (missing `:`, missing `;`, wrong capital letters, `#include`, missing `}`, wrong indentation…) | Students understand them |
| Badges | `js/content/words.js` | 9 | Badges are awarded in the test | Names and descriptions read well |
| Mascot "น้องบิต" and diagrams | SVG inside `js/app.js` and `js/puzzle.js` | 1 mascot, small icons | Drawn as code (shapes), not copied from anywhere | Nothing |
| Read-aloud audio | `audio/*.mp3` | 211 files (male Thai voice) | The test checks every spoken sentence has a file; the team listened to samples, and "บิต" was spaced out after feedback | **Listen to more of them** and report any word said wrong |
| Documents | `README.md`, `CLAUDE.md`, `docs/agent-plan.md`, `docs/AI-usage-log.md`, this file | 5 files | — | The AI usage log's "what we checked" column must be filled in by the team |

## 3. AI content review (done by Claude Code on 2026-11-15)

**Checked and correct:**
- Python: `range(7)` counts 0 to 6 (7 rounds); `:` after `for` / `if` / `else`; indentation marks the loop and `if` body; `#` starts a comment; function names in snake_case (`turn_right`); `if` without `else` is fine.
- C: `for (int i = 0; i < 7; i++)` has 3 parts; `i <= 4` from 0 loops 5 times; `{ }` mark the body; `//` starts a comment; C is case-sensitive; `int` means integer; `gems++` is the same as `gems = gems + 1`.
- Ideas: algorithm = steps in order; flowchart shapes (oval = start/end, rectangle = step); variable = named box, `=` stores a value; loops and nested loops; if/else with true/false; linear search checks up to n slots; debugging and off-by-one bugs.
- Every level can be solved, and every example program is valid in both languages (proved by the test).

**Found and fixed:**
| Was | Problem | Now |
|---|---|---|
| C note, chapter 1: "ในภาษา C ทุกคำสั่งต้องจบด้วย ; เสมอ" (in C, every statement must always end with `;`) | Not true for `for`, `if` and `{ }` blocks, which come later | "คำสั่งแบบนี้ต้องจบด้วย ; เสมอ" (statements like this must always end with `;`) |
| Python note, chapter 3: "ต้องย่อหน้าเข้าไป 4 ช่อง" (must indent 4 spaces) | Python needs *consistent* indentation; 4 spaces is the convention, not a rule | "ต้องย่อหน้าเข้าไปเท่ากันทุกบรรทัด (นิยมใช้ 4 ช่องว่าง)" (indent every line the same; 4 spaces is the usual choice) |
| Python note, chapter 4: "ต้องย่อหน้า 4 ช่อง … (รวม 8)" (must indent 4 … 8 in total) | Same as above | Indentation described in levels, "ถ้าใช้ระดับละ 4 ช่อง ก็รวม 8 ช่อง" (if each level is 4 spaces, that's 8) |
| Language picker: Python "ใช้สอนในวิชาวิทยาการคำนวณ ม.ปลาย" (taught in the high school computing subject) | Not verified | "นิยมใช้สอนเขียนโปรแกรมในโรงเรียน" (often used to teach programming in schools) |

**Things to be honest about (for the proposal and Q&A):**
- The game's "Python" and "C" are a **small teaching subset**: `move()`, `turn_left()`, `turn_right()`, `pick_gem()`, `for` loops with a fixed count, and `if`/`else` on `wall_ahead()` / `gem_here()`. The syntax is real, but the code runs in our own interpreter, not in a real Python or C compiler. There is no `while` and there are no student-made variables yet.
- The audio is **pre-generated** with edge-tts, which uses Microsoft Edge's read-aloud service. The app itself never calls Microsoft; it only plays mp3 files.
- The live classroom needs internet, and some school networks block WebRTC. The pack link is the fallback.

## 4. Team checklist (tick when done, and note it in `docs/AI-usage-log.md`)

- [ ] Read all 12 tips in both languages (switch language in ⚙) and check the Thai is natural and the facts are right
- [ ] Check the 16 hard words (tap underlined words in the tips)
- [ ] Play all 18 levels and 6 challenge levels: fair difficulty? hints helpful?
- [ ] Try typing mistakes in both languages: are the error messages clear?
- [ ] Listen to at least 20 audio files (or press 🔊 in the app) and list any word said wrong
- [x] Test the live classroom with a real phone: **done by the team on 2026-11-15**, and it works (PeerJS connected)
- [ ] Test the live classroom on the **school's or venue's Wi-Fi** (still to do)
- [ ] Both members can explain: how levels are checked, how the Python/C parsers work, how the pack link works (no server), and how the live room works (WebRTC)
- [ ] Fill in the "What we checked or changed" column in `docs/AI-usage-log.md`
