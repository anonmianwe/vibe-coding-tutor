# เรียนโค้ดกับน้องบิต (Learn to code with Bit)

A game for learning programming: write real **Python or C** code to move the robot Bit across a grid to the flag.
Students learn algorithm basics and the syntax of a real language at the same time.
It also works for students who struggle: slow readers, students with poor eyesight, and students who aren't fluent in Thai.
Entry for the KMUTNB ComEdu Open House 2027 Vibe Coding Challenge, Topic 4: ห้องเรียนสนุกด้วยเกม.

**Live app:** https://&lt;username&gt;.github.io/vibe-coding-tutor/ (fill in after enabling GitHub Pages)

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
- **Rewards:** stars for short programs, XP and levels (300 XP each), and 8 badges, including ⌨️ typing your own code and 🌏 winning in both languages.
- **Help:** a hint after every failed run, and a solution button after 2 fails, so no one gets stuck.
- **Accessibility:**
  - 🔊 Read aloud in Thai (Web Speech API)
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
| `js/content/chapter-1.js` … `chapter-6.js` | One file per chapter: levels and tips. **`chapter-1.js` explains the format.** |
| `js/puzzle.js` | The game engine: grid, running programs, code in Python and C, the parsers for typed code, the editor |
| `js/app.js` | Screens and routes (language picker, map, level), settings, read aloud, saving, stars, XP and badges |
| `tests/play-test.html` | Automated test: checks every level, the parsers, and plays all 18 levels on screen |

## Run locally
```
python3 -m http.server 8000
```
Then open http://localhost:8000. Read aloud needs a Thai voice in the browser; Chrome or Edge on Windows, Mac or Android usually have one.

## Test
With the server running, open http://localhost:8000/tests/play-test.html and read the RESULT line. All checks must pass.

## Deploy (GitHub Pages)
Push to GitHub, then go to Settings → Pages → Deploy from branch → `main` / root.

## Credits
Some activity ideas come from [CS Unplugged](https://classic.csunplugged.org/) and [CS50](https://cs50.harvard.edu/x/) (both CC BY-NC-SA 4.0). All text in the app is written by the team.
All names and examples are made up. There is no real student data.
