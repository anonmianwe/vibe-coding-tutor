# Handoff plan for the next agent

Last updated: 2026-11-15 (the qualifying deadline). Read `CLAUDE.md` first; it has the competition rules, topic and game design.

## Where things stand
- **Third version, all built on Nov 15:**
  1. Tutor with cards and a quiz.
  2. Cards + puzzle + Bug Boss over 10 lessons.
  3. Now: **grid gameplay only, in Python or C.**

  The user tested version 2 and said the way it was introduced didn't work.
- **Kept the whole time:** the theme (CSS tokens, 3 themes, text sizes, motion, fonts, mascot), the settings dialog, read-aloud and hard-word pop-ups.
- **The game now:**
  - The student chooses Python or C first and can switch anytime in ⚙.
  - 18 levels in 6 chapters: sequence, variables, loops, if/else, linear search, debugging.
  - The first level of each new idea has a short tip with code in the chosen language and a syntax note.
  - Tap mode shows blocks as real code. Typing mode unlocks after chapter 1.
- **Star rewards (added after the user's request):** step mode (5 ⭐), Bit colors, and 6 challenge levels (`challenge` in each chapter file, route `#/challenge/<chapter index>`).
- **Test:** `tests/play-test.html` has 216 checks, all passing. It covers:
  - every solution and its `best` count
  - the buggy start programs really failing
  - a Python and C round-trip of every solution
  - tip examples parsing
  - parser error messages
  - all 18 levels played on screen, including typed code and a language switch mid-level
- **Public repo:** https://github.com/anonmianwe/vibe-coding-tutor, live at https://anonmianwe.github.io/vibe-coding-tutor/. A push to `main` updates the live site within about a minute, so commit and push only when the user asks. Commits use the GitHub noreply email (set in this repo's git config). The organizers' rules PDF is in `.gitignore` and must stay private.
- **Team:** the user tests the app. Their partner writes the proposal, slides and demo video.

## Decisions the user made (don't reopen without asking)
- Grid gameplay only. No reading cards, no boss.
- Language picked at the start (Python or C), switchable anytime.
- Tap first, type later (typing unlocks after chapter 1: `TYPING_UNLOCK` in `app.js`).
- Keep: short tips, stars/XP/badges, hard-word pop-ups.
- Competitive mode: skipped.
- TTS audio: **don't start** until the user says the gameplay is finished.
- **Teacher's create mode:** the user's idea, to discuss **after TTS**. Don't build it before talking to the user.

## Files
| File | What it does |
|---|---|
| `js/content/words.js` | Defines `window.CONTENT` (`WORDS`, `CHAPTERS: []`, `BADGES`) |
| `js/content/chapter-N.js` | One chapter each. **`chapter-1.js` documents the level and tip format**, including the short program text (`M L R P`, `3{...}`, `?wall{}{}`, `?gem{}{}`) |
| `js/puzzle.js` | Engine. `toCode`/`codeText` (blocks → Python/C), `parseCode` (typed Python/C → blocks; errors are `{ line, msg }` in Thai), `simulate`/`runAll`, `mount` (screen; returns `{ refresh(oldLang) }`) |
| `js/app.js` | Routes `#/`, `#/start`, `#/level/<n>`, plus settings (incl. `lang`), speech, progress (`vct3-progress`: stars by level id like `loop-2`), XP, badges |

The game's language subset: `move turn_left turn_right pick_gem`, `for` with a fixed count, `if wall_ahead()` / `if gem_here()` with optional `else`. No `while`, no variables of the student's own. The parsers give a friendly message for those.

## Ideas for next steps (ask the user first)
1. More levels, especially harder ones per chapter.
2. `while` loops (for example `while not at_flag():`): the parsers, `toCode`, a block, and a chapter.
3. Puzzles for lists, sorting and binary search: these need new world features (crates with numbers).
4. Polish: show the level on phones (the level chip is hidden under 420px), and keyboard shortcuts.
5. TTS audio (blocked: see the decisions above).

## Content still needs a human check
All tips, levels and code examples were written by AI, and the AI log has a TODO for the team to check them. Don't mark them as checked yourself.

## When you finish a task
1. Run `tests/play-test.html` and extend it. All checks must pass. Also look at screenshots: a CSS bug once passed the test and was caught only in a screenshot.
2. Take screenshots at 400px wide in normal, contrast and dark themes.
3. Update `README.md`, `CLAUDE.md` (if the design changed), and `docs/AI-usage-log.md`.
