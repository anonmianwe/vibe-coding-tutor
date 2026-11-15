// Chapter 5: Linear search (format: see chapter-1.js)
CONTENT.CHAPTERS.push({
  id: "search", icon: "🔎", title: "ค้นหา", en: "Linear search",
  levels: [
    { title: "ตามหาเพชร", desc: "เพชรอยู่คนละที่ใน 3 แผนที่ โปรแกรมเดียวต้องเก็บได้ทุกแผนที่",
      maps: [["S*....G"], ["S...*.G"], ["S....*G"]], blocks: ["move", "pick", "repeat", "ifgem"], solution: "6{M ?gem{P}{}}", best: 4,
      hint: "ในลูป: move แล้วใช้ if gem_here ใส่ pick_gem ไว้ในส่วน if ส่วน else ปล่อยว่างไว้",
      tip: {
        text: "{ค้นหา}แบบเชิงเส้น (linear search) คือ ดูทีละช่อง จากช่องแรกไปเรื่อย ๆ ไม่รู้ว่าของอยู่ไหน จึงต้องเช็กทุกช่อง ถ้ามีข้อมูล n ช่อง แย่ที่สุดต้องดูครบ n ช่อง",
        simple: "ดูทีละช่อง ทุกช่อง ถ้าเจอ เก็บ",
        en: "Linear search checks one slot at a time from the start. We don't know where the item is, so we check every slot: n slots means up to n checks.",
        code: { python: "for i in range(6):\n    move()\n    if gem_here():\n        pick_gem()", c: "for (int i = 0; i < 6; i++) {\n    move();\n    if (gem_here()) {\n        pick_gem();\n    }\n}" },
        notes: {
          python: "if ไม่จำเป็นต้องมี else ถ้าเงื่อนไขเป็นเท็จ ก็ข้ามไปเฉย ๆ",
          c: "if ไม่จำเป็นต้องมี else ถ้าเงื่อนไขเป็นเท็จ ก็ข้ามไปเฉย ๆ"
        }
      } },
    { title: "เพชรหลายเม็ด", desc: "บางแผนที่มีเพชร 2 เม็ด บางแผนที่มีเม็ดเดียว",
      maps: [["S.*..*.G"], ["S*.....G"], ["S....**G"]], blocks: ["move", "pick", "repeat", "ifgem"], solution: "7{M ?gem{P}{}}", best: 4,
      hint: "วิธีเดิม แต่ทางยาวขึ้น ต้องวน 7 รอบ" }
  ],
  challenge: { title: "ค้นหาสองแถว", desc: "เพชรซ่อนอยู่ใน 2 แถว เดินไปแถวบน แล้ววกกลับแถวล่าง โปรแกรมเดียวต้องเก็บได้ทั้ง 3 แผนที่",
    maps: [["S.*..", "G.*.."], ["S...*", "G*..."], ["S*...", "G..*."]],
    blocks: ["move", "left", "right", "pick", "repeat", "ifgem"], solution: "2{4{M ?gem{P}{}} R M R}", best: 8,
    hint: "หนึ่งแถว = ลูป 4 รอบของ (move แล้วเช็กเพชร) จบแถวแล้ว หันขวา เดินลง หันขวา ทำแบบนี้ 2 รอบ" }
});
