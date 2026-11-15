// Chapter 1: Sequence (algorithms and flowcharts)
//
// HOW A CHAPTER FILE WORKS (the same for every chapter)
//   id, icon, title (Thai), en (English), levels: [...]
//   A level:
//     title, desc        what to do
//     map or maps        the grid. S = Bit's start (always facing right), G = goal 🏁, # = rock, * = gem 💎, . = empty
//                        "maps" = several grids: the SAME program must work on all of them
//     blocks             blocks the student can use: move left right pick repeat ifwall ifgem
//     solution           a working program (shown if the student asks for it, and checked by the test)
//     best               the fewest blocks possible (3 stars)
//     start              optional: a program already in the editor (debug levels)
//     flow               optional: a flowchart to follow (list of step names)
//     hint               shown after a failed run
//     tip                optional: a short lesson shown at the top, the first time a concept appears
//       text / simple / en          the tip in Thai, very simple Thai, and English. {คำ} = a hard word from words.js
//       code: { python, c }         example code in each language
//       notes: { python, c }        a note about that language's syntax
//   challenge: one extra, harder level in the same format. It unlocks when the student has
//     2 stars per level on average in this chapter, and it never blocks the next chapter.
//   Program text: M = move, L = turn left, R = turn right, P = pick up gem,
//     5{ ... } = repeat 5 times, ?wall{ then }{ else } = if the way ahead is blocked, ?gem{ }{ } = if there's a gem here
CONTENT.CHAPTERS.push({
  id: "seq", icon: "🧩", title: "ลำดับขั้นตอน", en: "Sequence",
  levels: [
    { title: "ก้าวแรกของบิต", desc: "พาน้องบิตไปที่ธง 🏁 บิตหันหน้าไปทางขวา",
      map: ["S..G"], blocks: ["move", "left", "right"], solution: "M M M", best: 3,
      hint: "ธงอยู่ข้างหน้า 3 ช่อง ใช้ move 3 ครั้ง",
      tip: {
        text: "{อัลกอริทึม} คือ {ขั้นตอน}ที่เรียงกันทีละข้อ ในเกมนี้เราเขียน{โปรแกรม}สั่งน้องบิต บิตจะทำตามทีละบรรทัด จากบนลงล่าง",
        simple: "เขียนคำสั่ง บิตทำตาม ทีละบรรทัด จากบนลงล่าง",
        en: "An algorithm is a list of steps in order. Here you write a program for Bit, who runs it one line at a time, top to bottom.",
        code: { python: "move()\nmove()", c: "move();\nmove();" },
        notes: {
          python: "move() คือการเรียกใช้{ฟังก์ชัน} ต้องมีวงเล็บ () ต่อท้ายชื่อเสมอ",
          c: "move(); คือการเรียกใช้{ฟังก์ชัน} ในภาษา C ทุกคำสั่งต้องจบด้วย ; (semicolon) เสมอ"
        }
      } },
    { title: "เลี้ยวหลบหิน", desc: "มีหิน 🪨 ขวางอยู่ ต้องเลี้ยวลงไปข้างล่าง",
      map: ["S..", "##.", "..G"], blocks: ["move", "left", "right"], solution: "M M R M M", best: 5,
      hint: "เดินหน้า 2 ครั้ง แล้ว turn_right บิตจะหันลงข้างล่าง",
      tip: {
        text: "turn_right หมุนตัวตามเข็มนาฬิกา turn_left หมุนทวนเข็ม หมุนแล้วยังไม่เดิน ต้องสั่ง move ต่อ ลูกศรสีเหลืองที่ตัวบิต บอกว่าหันไปทางไหน",
        simple: "หันขวา หันซ้าย แล้วค่อยเดิน ดูลูกศรเหลืองที่ตัวบิต",
        en: "turn_right turns clockwise, turn_left counter-clockwise. Turning doesn't move Bit; you still need move. The yellow arrow shows where Bit faces.",
        code: { python: "turn_right()\nmove()", c: "turn_right();\nmove();" },
        notes: {
          python: "ชื่อฟังก์ชันใน Python นิยมใช้ตัวเล็ก และคั่นคำด้วย _ เช่น turn_right",
          c: "ภาษา C แยกตัวพิมพ์เล็กใหญ่ Move(); กับ move(); ถือเป็นคนละชื่อกัน"
        }
      } },
    { title: "ทางอ้อม", desc: "กำแพงหินกั้นกลาง ต้องเดินอ้อมด้านล่าง",
      map: ["S.#G", "..#.", "...."], blocks: ["move", "left", "right"], solution: "R M M L M M M L M M", best: 10,
      hint: "ลงไปแถวล่างสุดก่อน แล้วเดินไปทางขวาจนสุด จึงขึ้นไปหาธง" },
    { title: "อ่านผังงาน 1", desc: "ทำตามผังงานทีละกล่อง จากบนลงล่าง",
      map: ["S..", "#.#", "#.G"], blocks: ["move", "left", "right"], solution: "M R M M L M", best: 6,
      flow: ["เริ่มต้น", "เดินหน้า", "หันขวา", "เดินหน้า", "เดินหน้า", "หันซ้าย", "เดินหน้า", "จบ"],
      hint: "เขียนคำสั่งให้ตรงกับกล่องสี่เหลี่ยมในผังงาน ทีละกล่อง (ไม่ต้องเขียน เริ่มต้น กับ จบ)",
      tip: {
        text: "{ผังงาน} คือ ภาพของอัลกอริทึม วงรี = เริ่มต้น/จบ สี่เหลี่ยม = คำสั่งหนึ่งข้อ ลูกศร = ไปทำข้อต่อไป นักเขียนโปรแกรมมักวาดผังงานก่อน แล้วค่อยแปลงเป็นโค้ด",
        simple: "ผังงาน = รูปวาดของขั้นตอน แปลงทีละกล่องเป็นโค้ด",
        en: "A flowchart is a picture of an algorithm: ovals for start/end, rectangles for steps, arrows for what's next. Programmers often draw one first, then turn it into code.",
        code: { python: "# เริ่มต้น\nmove()\nturn_right()\n# จบ", c: "// เริ่มต้น\nmove();\nturn_right();\n// จบ" },
        notes: {
          python: "บรรทัดที่ขึ้นต้นด้วย # คือ comment (คำอธิบาย) คอมพิวเตอร์จะข้ามไป",
          c: "ข้อความหลัง // คือ comment (คำอธิบาย) คอมพิวเตอร์จะข้ามไป"
        }
      } },
    { title: "อ่านผังงาน 2", desc: "ผังงานนี้พาบิตขึ้นไปหาธง",
      map: ["..G", ".#.", "S.."], blocks: ["move", "left", "right"], solution: "M M L M M", best: 5,
      flow: ["เริ่มต้น", "เดินหน้า", "เดินหน้า", "หันซ้าย", "เดินหน้า", "เดินหน้า", "จบ"],
      hint: "turn_left ตอนที่หันหน้าไปทางขวา จะทำให้หันขึ้นข้างบน" }
  ],
  // Challenge level: unlocks when the student has 2 stars per level on average in this chapter (see app.js)
  challenge: { title: "ทางคดเคี้ยว", desc: "ทางยาวที่เลี้ยวไปมาหลายครั้ง ใช้ได้แค่คำสั่งพื้นฐาน",
    map: ["S.#...", "#.#.#.", "#...#G"], blocks: ["move", "left", "right"], solution: "M R M M L M M L M M R M M R M M", best: 16,
    hint: "แบ่งเป็นช่วง ๆ: ลง → ขวา → ขึ้น → ขวา → ลง นับช่องแต่ละช่วงให้ดี" }
});
