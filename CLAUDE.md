# Vibe Coding Tutor — project context

Entry for the **KMUTNB ComEdu Open House 2027 Vibe Coding Challenge**.
The full rules are in `docs/competition-rules.pdf` (in Thai).

## Deadlines (2026)
- **Qualifying submission closes Nov 15**
- Finalists announced Nov 18
- Final round on Nov 21: live on Facebook. 5 min pitch, 5 min live demo, 5 min Q&A

## Topic
**Main: Topic 4, a fun classroom with games** (ห้องเรียนสนุกด้วยเกม): make students want to learn and pay attention.
Switched from Topic 3 on 2026-11-15. We still keep the Topic 3 accessibility features (read aloud, text size, themes, hard-word pop-ups, simple Thai) as a strength.
The rules don't limit what kind of game. Keep it tied to the lesson, with no timers in learning mode, and working with the accessibility settings.

## Game design
Changed again on 2026-11-15 after the user tested the Puzzle + Boss version ("the way it's introduced doesn't work"). Now: **grid gameplay only**, in a real programming language.
- **Start:** the student chooses **Python or C**, and can switch anytime in ⚙ (the program on screen is redrawn in the new language).
- **18 levels in 6 chapters:** sequence (incl. flowcharts), variables (`gems`), loops, if/else, linear search (one program for many maps), debugging (buggy start programs). Levels unlock in order.
- **No reading cards and no boss.** The first level of each new idea has a short tip: text plus an example in the chosen language plus a syntax note for that language. Hard-word pop-ups, simple Thai, English and read aloud stay.
- **Tap first, type later:** tap mode shows every block as a real code line. Typing mode unlocks after chapter 1, with real Python/C parsers for a small subset and Thai error messages with line numbers.
- Stars (shortest program), XP and levels (300 each), 9 badges. Hints after failed runs; a solution after 2 fails.
- **Star rewards** (milestones, stars are never spent): step mode at 5 ⭐, Bit colors (8/15/22/30/40 ⭐), and one challenge level per chapter (unlocks at 2 stars per level on average; never blocks the main path). Help and accessibility always stay free.
- **Teacher mode, step 1 (built):** a level-pack editor (`js/teacher.js`). The teacher draws maps, picks blocks, and must solve each level (that sets the solution and 3-star target). The pack is shared as a link/QR with everything compressed into the link; no server.
- **Teacher mode, step 2 (built):** a live classroom room over WebRTC (PeerJS public broker, no API key). Students join with a room code and a nickname, and the teacher sees a live player list (like Blooket/Quizizz). Nicknames only, kept in the teacher's open tab. The link/QR pack stays as the fallback if the network blocks WebRTC.
- Removed: lesson cards, the Bug Boss, the 10-lesson track. Competitive mode: skipped.

## Reference course
Based on the first topics of KMUTNB course **020413101 Computer Programming** (CED-2569 curriculum), simplified for high school students. Activity ideas come from CS Unplugged and CS50 (CC BY-NC-SA 4.0, credited in the README); all text is our own.

## Must-have features
- One short tip per new idea, with progress shown on the map
- Read aloud in Thai with a speed setting: **pre-made audio** (edge-tts, male voice th-TH-NiwatNeural, one mp3 per sentence in `audio/`), with the browser voice (Web Speech API) as a fallback. Regenerate after any text change (see README)
- Text size S/M/L/XL, plus normal, high-contrast and dark themes
- Underlined hard words: tap one to see a pop-up with the simple meaning, the English word, an example and a read-aloud button (from a built-in word list)
- Hints after each failed run, and the solution after 2 fails
- Settings and progress saved in localStorage (no login)
- Rewards: stars, badges, and lessons that unlock in order

**Nice-to-have:** a "simple Thai" toggle, an animations on/off switch, a font that's easier to read, quiz difficulty that adapts to the student.
**Not doing:** a live AI chatbot, user accounts.

## UI
- Layout: **level map → level screen** (Aa and ◐ buttons in the header)
- Style: **fun and game-like**, with a mascot, stars and badges. Keep the reading area plain and high contrast for accessibility, and let students turn off animations.
- Screens: Choose language (first visit) → Map of chapters and levels → Level (tip + grid + code editor)

## Tech
Plain **HTML, CSS and JavaScript**: no framework and no build step. Hosted on **GitHub Pages**.

## Rules to follow (from the competition)
- It must open from a public link, and the UI must be in Thai or support Thai
- **No API keys or passwords** in any code
- **Fake data only**: no real student, teacher or parent information (Thailand's PDPA 2019)
- Don't use a ready-made template without changing it, and nothing copyrighted or harmful
- Check that all AI-written lesson content is correct
- Both team members must be able to explain how the code works

## What to submit
- [ ] 1. Project proposal, max 3 A4 pages
- [ ] 2. Link to the working app (GitHub Pages)
- [ ] 3. Demo video, max 3 minutes (unlisted YouTube or shared Drive)
- [ ] 4. AI Usage Log: `docs/AI-usage-log.md`. **Add key prompts as you go.**
- [ ] 5. Slides for a talk of up to 10 minutes

Register and submit at: https://kmutnb.link/register-vibecode

## Scoring, qualifying round (100 points)
Problem clarity and fit with the topic 25 · Creativity 25 · Prototype works 25 · Practical to use 15 · AI log 10. A team needs an average of at least 60.
