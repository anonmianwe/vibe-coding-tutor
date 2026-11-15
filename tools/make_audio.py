"""Make the pre-recorded voice files for the app.

Voice: th-TH-NiwatNeural (male Thai voice, Microsoft Edge TTS, via the edge-tts package).
The text is sent to Microsoft's online text-to-speech service; it is only our lesson text (no personal data).

Steps (from the repo root):
  1. python3 -m http.server 8000                     (in another terminal)
  2. google-chrome --headless=new --virtual-time-budget=10000 \
       --dump-dom http://localhost:8000/tools/speech-list.html > /tmp/speech.html
  3. python3 tools/make_audio.py /tmp/speech.html     (needs: pip install edge-tts)

It only makes files that are missing, and removes files no sentence uses any more.
Then it writes audio/manifest.js, the list the app checks before playing a file.
"""
import asyncio
import html
import json
import os
import re
import sys

import edge_tts

VOICE = "th-TH-NiwatNeural"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, "audio")


def read_list(path):
    raw = open(path, encoding="utf-8").read()
    m = re.search(r"SPEECH-JSON(.*?)END-JSON", raw, re.S)
    if not m:
        sys.exit("No sentence list found. Did speech-list.html load? " + raw[:200])
    return json.loads(html.unescape(m.group(1)))


async def make_one(item, sem):
    out = os.path.join(AUDIO, item["key"] + ".mp3")
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(item["text"], VOICE).save(out)
                return
            except Exception as e:  # network hiccup: try again
                if attempt == 2:
                    print("FAILED", item["key"], item["text"][:40], e)
                await asyncio.sleep(2)


async def main(path):
    items = read_list(path)
    os.makedirs(AUDIO, exist_ok=True)
    todo = [i for i in items if not os.path.exists(os.path.join(AUDIO, i["key"] + ".mp3"))]
    print(f"{len(items)} sentences, {len(todo)} to make")
    sem = asyncio.Semaphore(4)
    await asyncio.gather(*(make_one(i, sem) for i in todo))

    keys = {i["key"] for i in items}
    for name in os.listdir(AUDIO):  # remove files for sentences that no longer exist
        if name.endswith(".mp3") and name[:-4] not in keys:
            os.remove(os.path.join(AUDIO, name))
    have = sorted(k for k in keys if os.path.exists(os.path.join(AUDIO, k + ".mp3")))
    with open(os.path.join(AUDIO, "manifest.js"), "w", encoding="utf-8") as f:
        f.write("// List of pre-made audio files (made by tools/make_audio.py, voice " + VOICE + ").\n")
        f.write("window.AUDIO_FILES = {" + ",".join(f'"{k}":1' for k in have) + "};\n")
    print(f"done: {len(have)} files in audio/")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    asyncio.run(main(sys.argv[1]))
