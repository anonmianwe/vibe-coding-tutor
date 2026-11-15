// Shared content: the hard-word list and the badges.
// The levels are in chapter-1.js ... chapter-6.js and add themselves to CONTENT.CHAPTERS.
// All names and examples are made up (no real people).
window.CONTENT = {
  // {คำ} in any tip text becomes a tappable word. The word must be listed here.
  WORDS: {
    "อัลกอริทึม": { meaning: "ขั้นตอนการทำงานที่เขียนเรียงกันทีละข้อ เพื่อแก้ปัญหา", en: "algorithm", example: "อัลกอริทึมการแปรงฟัน: บีบยาสีฟัน → แปรงฟัน → บ้วนปาก" },
    "ขั้นตอน": { meaning: "สิ่งที่ต้องทำ ทีละอย่าง", en: "step", example: "ขั้นตอนแรกของการต้มบะหมี่ คือ ต้มน้ำ" },
    "ลำดับ": { meaning: "การเรียงว่าอะไรมาก่อน อะไรมาหลัง", en: "order, sequence", example: "ต้องใส่ถุงเท้าก่อน แล้วค่อยใส่รองเท้า" },
    "โปรแกรม": { meaning: "ชุดคำสั่งที่เขียนให้คอมพิวเตอร์ทำตาม", en: "program", example: "เกมในมือถือก็เป็นโปรแกรมแบบหนึ่ง" },
    "ฟังก์ชัน": { meaning: "คำสั่งที่มีชื่อ เรียกใช้ด้วยชื่อตามด้วยวงเล็บ ()", en: "function", example: "move() คือการเรียกใช้ฟังก์ชันชื่อ move" },
    "ผังงาน": { meaning: "ภาพที่ใช้รูปทรงและลูกศร แสดงขั้นตอนการทำงาน", en: "flowchart", example: "วาดผังงานของการข้ามถนน" },
    "ตัวแปร": { meaning: "กล่องที่มีชื่อ ใช้เก็บข้อมูลในโปรแกรม", en: "variable", example: "ตัวแปร gems เก็บจำนวนเพชร" },
    "ค่า": { meaning: "ข้อมูลที่อยู่ในตัวแปร", en: "value", example: "ค่าของ gems ตอนเริ่มคือ 0" },
    "ชนิดข้อมูล": { meaning: "ประเภทของข้อมูล เช่น ตัวเลขจำนวนเต็ม (int)", en: "data type", example: "int gems = 0; บอกว่า gems เก็บจำนวนเต็ม" },
    "วนซ้ำ": { meaning: "ทำคำสั่งเดิมซ้ำหลายรอบ", en: "loop", example: "เดินหน้า 7 ก้าว = วนซ้ำคำสั่ง move 7 รอบ" },
    "ย่อหน้า": { meaning: "ช่องว่างหน้าบรรทัด ใน Python ใช้บอกว่าคำสั่งไหนอยู่ข้างในลูปหรือ if", en: "indentation", example: "เว้น 4 ช่องหน้า move() เพื่อให้อยู่ในลูป" },
    "เงื่อนไข": { meaning: "คำถามที่ตอบได้ว่า จริง หรือ เท็จ แล้วเลือกทำตามคำตอบ", en: "condition", example: "ถ้าข้างหน้าตัน ให้หันขวา" },
    "จริง": { meaning: "คำตอบว่า ใช่", en: "true", example: "ถ้าข้างหน้ามีหิน wall_ahead() เป็นจริง" },
    "เท็จ": { meaning: "คำตอบว่า ไม่ใช่", en: "false", example: "ถ้าข้างหน้าว่าง wall_ahead() เป็นเท็จ" },
    "ค้นหา": { meaning: "หาว่าข้อมูลที่ต้องการอยู่ตรงไหน", en: "search", example: "ดูทีละช่องว่ามีเพชรไหม คือการค้นหาแบบเชิงเส้น" },
    "บั๊ก": { meaning: "จุดผิดในโปรแกรม ที่ทำให้ผลลัพธ์ไม่ถูก", en: "bug", example: "วนลูปน้อยไป 2 รอบ บิตจึงไปไม่ถึงธง นี่คือบั๊ก" }
  },

  CHAPTERS: [],

  BADGES: [
    { id: "first", icon: "🌱", name: "ก้าวแรก", desc: "ผ่านด่านแรก" },
    { id: "typist", icon: "⌨️", name: "นักพิมพ์โค้ด", desc: "ผ่านด่านด้วยการพิมพ์โค้ดเอง" },
    { id: "bilingual", icon: "🌏", name: "สองภาษา", desc: "ผ่านด่านด้วยทั้ง Python และ C" },
    { id: "loop", icon: "🔁", name: "เจ้าแห่งลูป", desc: "ผ่านบทวนซ้ำครบทุกด่าน" },
    { id: "challenger", icon: "🌟", name: "ผู้พิชิต", desc: "ผ่านด่านท้าทายด้วยตัวเอง" },
    { id: "puzzle", icon: "⚡", name: "ทางลัดสายฟ้า", desc: "ได้ 3 ดาว 5 ด่าน" },
    { id: "persist", icon: "💪", name: "ไม่ยอมแพ้", desc: "ผิดแล้วลองใหม่ จนผ่านเอง" },
    { id: "words", icon: "📖", name: "นักล่าคำศัพท์", desc: "เปิดดูคำศัพท์ 5 คำ" },
    { id: "all", icon: "🏆", name: "นักเขียนโปรแกรมตัวจริง", desc: "ผ่านครบทุกด่าน" }
  ]
};
