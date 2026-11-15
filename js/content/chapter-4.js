// Chapter 4: If/else (format: see chapter-1.js)
CONTENT.CHAPTERS.push({
  id: "if", icon: "☂️", title: "เงื่อนไข", en: "If / else",
  levels: [
    { title: "ทางเลี้ยว", desc: "ให้บิตดูทางเองทุกก้าว ใช้คำสั่งให้น้อยที่สุด",
      map: ["S...", "###.", "G..."], blocks: ["move", "left", "right", "repeat", "ifwall"], solution: "10{?wall{R}{M}}", best: 4,
      hint: "ใส่ if wall_ahead ไว้ในลูป: ถ้าจริง turn_right ถ้าไม่จริง (else) move แล้วตั้งให้วน 10 รอบ",
      tip: {
        text: "{เงื่อนไข} คือ คำถามที่ตอบได้ว่า {จริง} หรือ {เท็จ} wall_ahead() ถามว่า ข้างหน้าตันไหม ถ้าจริง ทำส่วน if ถ้าเท็จ ทำส่วน else ใส่ไว้ในลูป บิตจะเช็กทุกก้าว",
        simple: "ทุกก้าว: ตัน หันขวา ไม่ตัน เดินหน้า",
        en: "A condition is a question that is true or false. wall_ahead() asks if the way is blocked. True runs the if part, false runs else. Inside a loop, Bit checks every step.",
        code: { python: "if wall_ahead():\n    turn_right()\nelse:\n    move()", c: "if (wall_ahead()) {\n    turn_right();\n} else {\n    move();\n}" },
        notes: {
          python: "หลัง if และ else ต้องมี : และคำสั่งข้างในต้องย่อหน้า",
          c: "เงื่อนไขต้องอยู่ในวงเล็บ ( ) และคำสั่งข้างในอยู่ใน { }"
        }
      } },
    { title: "สองแผนที่ โปรแกรมเดียว", desc: "โปรแกรมเดียวกัน ต้องพาบิตถึงธงได้ทั้ง 2 แผนที่",
      maps: [["S....", "####.", "#G..."], ["S..", "##.", "G.."]], blocks: ["move", "left", "right", "repeat", "ifwall"], solution: "11{?wall{R}{M}}", best: 4,
      hint: "ใช้วิธีเดียวกับด่านที่แล้ว แต่แผนที่แรกยาวกว่า ต้องวน 11 รอบ ถึงธงแล้ว บิตจะหยุดเอง",
      tip: {
        text: "โปรแกรมที่ดี ใช้ได้กับหลายสถานการณ์ ถ้าเขียนแบบจำทาง (move move turn ...) จะใช้ได้แค่แผนที่เดียว แต่ถ้าใช้เงื่อนไขให้บิตดูเอง จะใช้ได้ทุกแผนที่ที่มีลักษณะเดียวกัน",
        simple: "ใช้ if ให้บิตคิดเอง โปรแกรมเดียวใช้ได้หลายแผนที่",
        en: "A good program works in many situations. Memorizing the path only fits one map; letting Bit decide with a condition works on every similar map.",
        code: { python: "for i in range(11):\n    if wall_ahead():\n        turn_right()\n    else:\n        move()", c: "for (int i = 0; i < 11; i++) {\n    if (wall_ahead()) {\n        turn_right();\n    } else {\n        move();\n    }\n}" },
        notes: {
          python: "if ที่อยู่ในลูป ต้องย่อหน้า 4 ช่อง และคำสั่งใน if ย่อหน้าอีก 4 ช่อง (รวม 8)",
          c: "{ } ซ้อนกันได้ ทุก { ต้องมี } ปิดคู่กันเสมอ"
        }
      } },
    { title: "เลี้ยวซ้าย", desc: "คราวนี้ทางเลี้ยวซ้าย ใช้ได้ทั้ง 2 แผนที่",
      maps: [["#G..", "###.", "S..."], ["G...", "###.", "S..."]], blocks: ["move", "left", "right", "repeat", "ifwall"], solution: "10{?wall{L}{M}}", best: 4,
      hint: "เหมือนด่านก่อน แต่ถ้าข้างหน้าตัน ให้ turn_left" }
  ]
});
