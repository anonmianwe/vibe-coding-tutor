// Chapter 6: Debugging (format: see chapter-1.js)
CONTENT.CHAPTERS.push({
  id: "debug", icon: "🐞", title: "ดีบัก", en: "Debugging",
  levels: [
    { title: "เลี้ยวผิดทาง", desc: "โปรแกรมนี้มีบั๊ก 1 จุด กด ▶ เริ่ม ดูก่อน แล้วแก้ให้ถึงธง",
      map: ["S..", "##.", "..G"], blocks: ["move", "left", "right"], start: "M M L M M", solution: "M M R M M", best: 5,
      hint: "ดูว่าบิตหันไปทางไหนหลังเดิน 2 ก้าว ลบคำสั่งที่ผิด เพิ่มคำสั่งที่ถูก แล้วใช้ ▲ ย้ายขึ้นไปแทนที่ (หรือพิมพ์แก้ในโหมดพิมพ์โค้ด)",
      tip: {
        text: "{บั๊ก} คือ จุดผิดในโปรแกรม การหาและแก้บั๊ก เรียกว่า ดีบัก (debug) วิธีดีบัก: รันดู สังเกตว่าบิตเริ่มผิดตอนไหน บรรทัดที่กำลังทำงานจะเป็นสีเหลือง แล้วแก้บรรทัดนั้น",
        simple: "รันดู หาบรรทัดที่ผิด แล้วแก้",
        en: "A bug is a mistake in a program; fixing it is debugging. Run it, watch where Bit goes wrong (the running line is yellow), and fix that line.",
        code: { python: "move()\nmove()\nturn_left()   # บั๊ก! ต้องเป็น turn_right()", c: "move();\nmove();\nturn_left();  // บั๊ก! ต้องเป็น turn_right();" },
        notes: {
          python: "บั๊กที่เจอบ่อยใน Python: ลืม : ย่อหน้าไม่ตรงกัน ลืม ()",
          c: "บั๊กที่เจอบ่อยใน C: ลืม ; ลืมปิด } สะกดชื่อตัวพิมพ์เล็กใหญ่ผิด"
        }
      } },
    { title: "นับรอบผิด", desc: "บิตเดินไม่ถึงธง ลูปวนน้อยไป",
      map: ["S...G"], blocks: ["move", "left", "right", "repeat"], start: "2{M}", solution: "4{M}", best: 2,
      hint: "ธงห่าง 4 ช่อง กด + ที่ลูปให้วนพอดี",
      tip: {
        text: "บั๊กยอดฮิต: วนเกินหรือขาดไป 1–2 รอบ (off-by-one) นับให้ดีว่าต้องการกี่รอบ แล้วตรวจตัวเลขในลูป",
        simple: "นับรอบให้ถูก",
        en: "A classic bug: looping one or two times too many or too few (off-by-one). Count how many rounds you need and check the loop's number.",
        code: { python: "for i in range(2):   # น้อยไป ต้องเป็น 4\n    move()", c: "for (int i = 0; i < 2; i++) {  // น้อยไป ต้องเป็น 4\n    move();\n}" },
        notes: {
          python: "range(4) วน 4 รอบ (0, 1, 2, 3) ไม่ใช่ 5",
          c: "i < 4 วน 4 รอบ (0, 1, 2, 3) ถ้าเขียน i <= 4 จะวน 5 รอบ"
        }
      } },
    { title: "เงื่อนไขกลับด้าน", desc: "บิตเดินวนไปผิดทาง แก้เงื่อนไขในลูป",
      map: ["S...", "###.", "G..."], blocks: ["move", "left", "right", "repeat", "ifwall"], start: "10{?wall{L}{M}}", solution: "10{?wall{R}{M}}", best: 4,
      hint: "ทางนี้ต้องเลี้ยวขวาตอนเจอทางตัน แต่โปรแกรมสั่ง turn_left ลบมันออก แล้วใส่ turn_right แทน" }
  ],
  challenge: { title: "บั๊กสองตัว", desc: "โปรแกรมลูปซ้อนนี้มีบั๊ก 2 จุด หาให้เจอทั้งคู่",
    map: ["S...###", "###.###", "###.###", "###....", "######.", "######.", "######G"],
    blocks: ["move", "left", "right", "repeat"], start: "2{3{M} L 3{M} R}", solution: "2{3{M} R 3{M} L}", best: 7,
    hint: "รันดูว่าบิตหันผิดทางตอนไหน ทิศของการหันสลับกันอยู่ทั้ง 2 จุด" }
});
