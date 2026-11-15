# เรียนโค้ดกับน้องบิต (Learn to code with Bit)

A game for learning programming: write real **Python or C** code to move the robot Bit across a grid to the flag.
Students learn algorithm basics and the syntax of a real language at the same time.
It also works for students who struggle: slow readers, students with poor eyesight, and students who aren't fluent in Thai.
Entry for the KMUTNB ComEdu Open House 2027 Vibe Coding Challenge, Topic 4: ห้องเรียนสนุกด้วยเกม.

**Live app:** https://anonmianwe.github.io/vibe-coding-tutor/
**Code:** https://github.com/anonmianwe/vibe-coding-tutor

## For AI agents helping with the submission (read this first)
This repo is a finished, working prototype. The team's second member writes the **project proposal (max 3 A4 pages), the slides (talk up to 10 minutes) and the demo video (max 3 minutes)**. If you are helping with those, use the facts below and **don't change the app code** unless the team asks.

**Read these files, in this order:**
1. `CLAUDE.md`: the competition rules, deadlines, topic, game design, and what to submit.
2. This README: what the app does (sections below).
3. `docs/AI-content-and-tools.md`: every tool used, everything AI made, the content review, and the team's checking list.
4. `docs/AI-usage-log.md`: the AI usage log, which is a required deliverable worth 10 points (16 key prompts, problems and fixes).
5. `docs/agent-plan.md`: technical handoff notes (only needed for code changes).
6. `docs/demo-video-script.md`: the 3-minute demo video script (Thai narration, shot by shot, with prep steps).

The organizers' rules PDF is **not** in the repo (it's their document). `CLAUDE.md` summarizes it, and the rules are on page 4 of the PDF the team has locally.

**Key facts to use (all true today):**
- **Topic 4 "ห้องเรียนสนุกด้วยเกม"** (a fun classroom with games). The topic's first example idea is "เกมตอบคำถามแข่งกันในห้องพร้อมตารางคะแนน" (a class quiz battle with a scoreboard), which the live classroom matches. The accessibility features come from Topic 3 and are a strength.
- **Problem:** beginners find programming dry and abstract, and many struggle (slow readers, poor eyesight, not fluent in Thai). **Idea:** learn real Python or C by programming a robot in a game, with short tips instead of long reading.
- **Numbers:**
  - 2 languages (Python, C)
  - 6 chapters: sequence, variables, loops, if/else, linear search, debugging
  - 18 levels + 6 challenge levels, and 12 short tips
  - 211 pre-made audio files (male Thai voice)
  - 9 badges
  - teacher packs of up to 8 levels
  - 243 + 22 automated test checks, all passing
- **Learning path:** tap code blocks first (each block is a real line of code); typing real code unlocks after chapter 1, with Thai error messages and line numbers. Step mode runs one line at a time and explains it.
- **For teachers:** make a level pack, test it, and share by link or QR code (no server). Or open a **live classroom**: students join with a room code and a nickname, and the teacher sees a live ranking by points (stars + speed bonus + first-to-3-stars bonus) and a first-finishers board for real-class rewards.
- **Rules it follows:**
  - a public link (GitHub Pages)
  - Thai UI
  - no API keys or passwords in the code
  - no real personal data (nicknames only, never saved)
  - only free libraries (MIT licensed)
  - AI-made audio listed in the AI log

**Don't claim things that aren't true:**
- There is **no AI inside the app** (no chatbot). AI was used to build it, which the rules allow.
- The Python and C are a **small teaching subset** running in the game's own interpreter, not a real compiler.
- The voice is **pre-generated** with edge-tts (Microsoft Edge text-to-speech); the app only plays mp3 files.
- The live classroom needs **internet**, and some school networks block it; the pack link still works then.
- The team has **not finished checking** all AI-made content yet (see the checklist in `docs/AI-content-and-tools.md`).

**Demo tips (live demo is 5 minutes by screen share, final round on Nov 21):**
- **Fresh browser:** first visit → choose a language → level 1 with a tip → tap blocks → run.
- **Show the language switch:** ⚙ → C ⇄ Python, and the same program is redrawn.
- **Typing mode:** make a deliberate mistake (missing `;` or `:`) to show the Thai error message.
- **Step mode:** needs 5 ⭐. **Challenge levels:** need 2 ⭐ per level on average in a chapter. Prepare a browser that already has stars.
- **Live classroom:** needs a second device (a phone) visible in the screen share. Have the pack link ready as a backup.
- **Accessibility:** Aa (text size), ◐ (themes), 🔊 (read aloud), ✨ (simple Thai), EN (English).

**Still to do for the submission:** the proposal, the slides, the demo video, the team's content check, and the "what we checked" column of the AI log. Submit at https://kmutnb.link/register-vibecode.

## How it plays
- **First screen:** choose 🐍 Python or 🅲 C. Each option shows the same program in that language. You can switch anytime in ⚙; the program on screen is redrawn in the new language.
- **18 levels in 6 chapters:**
  1. Sequence (algorithms, flowcharts)
  2. Variables (`gems`)
  3. Loops (`for`)
  4. If/else (`wall_ahead()`)
  5. Linear search (`gem_here()`, one program for several maps)
  6. Debugging (levels that start with a buggy program)

  Levels unlock in order.
- **Short tip:** the first level of each new idea starts with a tip. It has an example in the chosen language and a note on that language's syntax (C needs `;` and `{ }`, Python needs `:` and indentation). Tips include hard-word pop-ups, simple Thai, English and read aloud.
- **👆 Tap mode:** every block is a real line of code, like `for (int i = 0; i < 3; i++) {` or `for i in range(3):`.
- **⌨️ Typing mode** unlocks after chapter 1. Students type real code.
  - Tapping a block types it for you.
  - Mistakes show the line number and a Thai explanation, like "ลืม ; ท้ายคำสั่ง" (missing `;`) or "ลืมเครื่องหมาย :" (missing `:`).
  - The running line is highlighted.
  - Tap and type stay in sync.
- **Rewards:** stars for short programs, XP and levels (300 XP each), and 9 badges, including ⌨️ typing your own code and 🌏 winning in both languages.
- **🎁 Star rewards** (stars count toward milestones and are never spent):
  - 👣 **Step mode** at 5 ⭐: run one line at a time. Bit explains each step, for example "`gem_here()` is true ✓, so do the `if` part". You can run the rest or stop at any time.
  - 🎨 **Bit colors:** purple, then green 8 ⭐, orange 15, pink 22, blue 30, gold 40. The high-contrast theme always keeps Bit in the theme color.
  - ⭐ **Challenge levels:** one per chapter, unlocked with 2 stars per level on average in that chapter. They never block the main path. The loops challenge introduces nested loops; the debugging challenge has two bugs.
  - Hints, the solution button, read aloud and all accessibility settings are always free.
- **🏫 Teacher mode** (home screen → "สำหรับคุณครู"):
  - Build a pack of up to 8 levels: draw the map (start, flag, rocks, gems), choose the allowed blocks, and write a title, task and hint.
  - The teacher must **solve each level first**. That program becomes the solution, and its length becomes the 3-star target, so an unsolvable level can never be shared.
  - Share as a **link or QR code**. The whole pack is compressed into the link (`#/pack/<code>`), so nothing is stored online. A 2-level pack is about 270 characters.
  - Students open the link and play the pack in order, in their chosen language. Their stars stay in their own browser. Broken or edited links are rejected.
  - Teacher-written text has no pre-made audio, so the browser's Thai voice reads it, if the device has one.
- **🏫 Live classroom** (like Blooket or Quizizz, but with no server or accounts):
  - From the share box, the teacher opens a room and gets a **6-digit room code and a QR code**.
  - Students tap "🙋 เข้าห้องเรียน" (join a classroom) or scan the QR, then type a **nickname**. The screen tells them not to use their real name.
  - The teacher's screen shows a **live ranking by points**: rank, nickname, current level, stars, points, and online or offline.
  - **Points:** 100 per star; a **speed bonus** of up to +50 that shrinks to 0 over 5 minutes after opening a level (the teacher can switch it off); and **+100 / +50 / +25** for the first three students to get 3 stars on a level.
  - A **"🏅 ผู้ทำได้ก่อน" board** (first finishers) shows the 🥇🥈🥉 of each level, so the teacher knows whom to reward in the real class. Students get a popup when they place, and see their own points and rank.
  - There is **no countdown clock** on students' screens; speed only adds a bonus, so slow readers still get full star points.
  - It runs **peer-to-peer (WebRTC, PeerJS)**. The teacher's browser is the host, and PeerJS's free public server only introduces the browsers. There is no API key and no database. Nicknames live only in the teacher's open tab and are never saved.
  - If a network blocks WebRTC (some school Wi-Fi does), students can still play the same pack from its link, just without the live list.
- **Help:** a hint after every failed run, and a solution button after 2 fails, so no one gets stuck.
- **Accessibility:**
  - 🔊 Read aloud in Thai with **pre-made audio** (male voice, works on every device, with a speed setting). The browser's own voice is only a fallback
  - Aa text size S/M/L/XL, and ◐ normal, high-contrast and dark themes
  - An easier-to-read font, and an animations on/off switch
  - No timers
- Settings and progress are saved in localStorage. No login, no server, no API keys.

## The code the game understands
| | Python | C |
|---|---|---|
| Commands | `move()` `turn_left()` `turn_right()` `pick_gem()` | `move();` `turn_left();` `turn_right();` `pick_gem();` |
| Loop | `for i in range(3):` + indented lines | `for (int i = 0; i < 3; i++) { ... }` (also `i <= n`, `i += 1`, `i = i + 1`) |
| If/else | `if wall_ahead():` / `else:` | `if (wall_ahead()) { ... } else { ... }` |
| Questions | `wall_ahead()` `gem_here()` | same |
Comments (`#` in Python, `//` and `/* */` in C) are allowed.

## Files
| File | What it does |
|---|---|
| `index.html` | Page shell: header, word pop-up, settings dialog (including the language) |
| `css/style.css` | Themes, text sizes, map, editor, animations |
| `js/content/words.js` | The hard-word list and the badges |
| `js/content/chapter-1.js` … `chapter-6.js` | One file per chapter: levels, a challenge level and tips. **`chapter-1.js` explains the format.** |
| `js/puzzle.js` | The game engine: grid, running programs, code in Python and C, the parsers for typed code, the editor |
| `js/teacher.js` | Teacher mode: level-pack editor, test runs, link/QR sharing, and playing a shared pack |
| `js/room.js` | Live classroom: the teacher's room and player list, and students joining with a nickname |
| `js/vendor/peerjs.min.js` | PeerJS 1.5.4 (MIT), copied into the repo |
| `js/vendor/qrcode.min.js` | QR code library (qrcode-generator 1.4.4, MIT), copied into the repo so it works without internet access to a CDN |
| `js/app.js` | Screens and routes (language picker, map, level), settings, read aloud, saving, stars, XP and badges |
| `audio/` | Pre-made voice files (mp3) and `manifest.js` |
| `tools/speech-list.html`, `tools/make_audio.py` | List every spoken sentence, and make the missing audio files |
| `tests/room-test.html` | Live classroom test with a real teacher and students (needs internet) |
| `tests/play-test.html` | Automated test: checks every level and challenge, the parsers, step mode and Bit colors, and plays all 24 levels on screen |

## Read aloud (pre-made audio)
Every sentence the app can read aloud (211 now) has its own mp3 in `audio/`, made with **edge-tts** (Microsoft Edge text-to-speech), male Thai voice **th-TH-NiwatNeural**.
- `audio/manifest.js` lists the files. Each file is named by a short code made from the sentence's text, so a changed sentence gets a new file.
- Code words are said in a readable way first (`turn_right()` → "turn right", a lone `;` → "เซมิโคลอน", `{ }` → "วงเล็บปีกกา"); see `spoken()` in `js/app.js`.
- If a sentence has no file, the browser's Thai voice reads it, if the device has one.

**After you change any text, make the missing files again:**
```
python3 -m venv /tmp/ttsenv && /tmp/ttsenv/bin/pip install edge-tts      # once
python3 -m http.server 8000                                              # in another terminal
google-chrome --headless=new --virtual-time-budget=10000 --dump-dom http://localhost:8000/tools/speech-list.html > /tmp/speech.html
/tmp/ttsenv/bin/python tools/make_audio.py /tmp/speech.html
```
This sends only our lesson text to Microsoft's online service. The test fails if any sentence is missing its file.

## Run locally
```
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Test
With the server running, open http://localhost:8000/tests/play-test.html and read the RESULT line. All checks must pass.
The live classroom has its own test, http://localhost:8000/tests/room-test.html, which needs internet access.

## Deploy (GitHub Pages)
Push to GitHub, then go to Settings → Pages → Deploy from branch → `main` / root.

## Credits
Some activity ideas come from [CS Unplugged](https://classic.csunplugged.org/) and [CS50](https://cs50.harvard.edu/x/) (both CC BY-NC-SA 4.0). All text in the app is written by the team.
Live classroom: [PeerJS](https://github.com/peers/peerjs) (MIT License).
QR codes: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase (MIT License).
All names and examples are made up. There is no real student data.
