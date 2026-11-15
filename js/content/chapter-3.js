// Chapter 3: Loops (format: see chapter-1.js)
CONTENT.CHAPTERS.push({
  id: "loop", icon: "🔁", title: "วนซ้ำ", en: "Loops",
  levels: [
    { title: "ทางยาว", desc: "ทางตรงยาว 7 ช่อง ใช้ลูปแทนการเขียน move 7 บรรทัด",
      map: ["S......G"], blocks: ["move", "left", "right", "repeat"], solution: "7{M}", best: 2,
      hint: "แตะ for แล้วแตะ move ให้เข้าไปอยู่ในลูป จากนั้นกด + จนเป็น 7 รอบ",
      tip: {
        text: "{วนซ้ำ} (loop) คือ การทำคำสั่งเดิมหลายรอบ เขียนครั้งเดียว ให้ทำกี่รอบก็ได้ โปรแกรมสั้นลง และแก้ง่ายขึ้น",
        simple: "ลูป = เขียนครั้งเดียว ทำหลายรอบ",
        en: "A loop repeats the same commands. Write them once and run them as many times as you like: shorter code that's easier to change.",
        code: { python: "for i in range(7):\n    move()", c: "for (int i = 0; i < 7; i++) {\n    move();\n}" },
        notes: {
          python: "range(7) นับ 0, 1, ..., 6 รวม 7 รอบ หลัง for ต้องมี : และคำสั่งในลูปต้อง{ย่อหน้า}เข้าไป 4 ช่อง",
          c: "for มี 3 ส่วน: เริ่ม i = 0; ทำต่อเมื่อ i < 7; และ i++ เพิ่ม i ทีละ 1 ทุกรอบ คำสั่งในลูปอยู่ใน { }"
        }
      } },
    { title: "บันได", desc: "ทางเป็นขั้นบันได ลวดลายเดิมซ้ำกัน 3 รอบ",
      map: ["S.##", "#..#", "##..", "###G"], blocks: ["move", "left", "right", "repeat"], solution: "3{M R M L}", best: 5,
      hint: "หนึ่งรอบคือ move, turn_right, move, turn_left ใส่ทั้งหมดในลูป 3 รอบ",
      tip: {
        text: "ในลูปใส่ได้หลายคำสั่ง ทุกคำสั่งข้างในจะทำครบ 1 ชุด แล้วจึงเริ่มรอบใหม่ หาลวดลายที่ซ้ำกันให้เจอ แล้วใส่ลวดลายนั้นในลูป",
        simple: "หาส่วนที่ซ้ำ ใส่ไว้ในลูป",
        en: "A loop can hold many commands; it runs the whole set, then starts the next round. Find the repeating pattern and put it in the loop.",
        code: { python: "for i in range(3):\n    move()\n    turn_right()", c: "for (int i = 0; i < 3; i++) {\n    move();\n    turn_right();\n}" },
        notes: {
          python: "ทุกบรรทัดที่ย่อหน้าเท่ากันใต้ for อยู่ในลูปเดียวกัน",
          c: "ทุกคำสั่งระหว่าง { กับ } อยู่ในลูปเดียวกัน การย่อหน้าใน C ไม่บังคับ แต่ช่วยให้อ่านง่าย"
        }
      } },
    { title: "เก็บเพชรเป็นจังหวะ", desc: "เพชรวางห่างกันเท่า ๆ กัน ใช้ลูปเก็บให้ครบ",
      map: ["S*.*.*G"], blocks: ["move", "left", "right", "pick", "repeat"], solution: "3{M P M}", best: 4,
      hint: "หนึ่งรอบคือ move, pick_gem, move ทำซ้ำ 3 รอบ" }
  ]
});
