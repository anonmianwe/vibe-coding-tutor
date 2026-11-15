// Chapter 2: Variables (format: see chapter-1.js)
CONTENT.CHAPTERS.push({
  id: "var", icon: "📦", title: "ตัวแปร", en: "Variables",
  levels: [
    { title: "เก็บเพชร", desc: "เก็บเพชร 💎 ให้ครบ แล้วไปที่ธง 🏁 ดูค่าในกล่อง gems เปลี่ยนไป",
      map: ["S*.*G"], blocks: ["move", "left", "right", "pick"], solution: "M P M M P M", best: 6,
      hint: "ต้องยืนบนช่องที่มีเพชร แล้วใช้ pick_gem",
      tip: {
        text: "{ตัวแปร} คือ กล่องที่มีชื่อ ใช้เก็บ{ค่า} บิตมีตัวแปรชื่อ gems เริ่มต้นเป็น 0 ทุกครั้งที่ pick_gem ค่าใน gems จะเพิ่มขึ้น 1",
        simple: "gems = กล่องนับเพชร เก็บ 1 เม็ด เพิ่ม 1",
        en: "A variable is a named box that stores a value. Bit has a variable called gems, starting at 0. Each pick_gem adds 1 to it.",
        code: { python: "gems = 0\ngems = gems + 1   # pick_gem() ทำแบบนี้", c: "int gems = 0;\ngems = gems + 1;  // pick_gem(); ทำแบบนี้" },
        notes: {
          python: "Python สร้างตัวแปรได้เลย ไม่ต้องบอก{ชนิดข้อมูล} เครื่องหมาย = แปลว่า เก็บค่าลงกล่อง ไม่ใช่ เท่ากับ",
          c: "ภาษา C ต้องบอก{ชนิดข้อมูล}ก่อนใช้ int แปลว่า จำนวนเต็ม gems = gems + 1; เขียนสั้น ๆ ได้ว่า gems++;"
        }
      } },
    { title: "เพชรสองชั้น", desc: "เพชรอยู่คนละแถว เก็บให้ครบก่อนถึงธง",
      map: ["S*.", "#*#", "..G"], blocks: ["move", "left", "right", "pick"], solution: "M P R M P M L M", best: 8,
      hint: "เก็บเพชรเม็ดแรก แล้ว turn_right เพื่อลงไปหาเม็ดที่สอง" }
  ]
});
