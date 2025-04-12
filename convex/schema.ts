import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * ປະເພດຂໍ້ມູນທີ່ສາມາດໃຊ້ໄດ້ໃນ Convex Schema:
 * ----------------------------------------------
 * 
 * v.id(tableName) - ໃຊ້ສຳລັບລະຫັດອ້າງອີງໄປຍັງຕາຕະລາງອື່ນ (foreign key)
 * v.string() - ຂໍ້ຄວາມ
 * v.number() - ຕົວເລກ (ທັງຈຳນວນເຕັມແລະທົດສະນິຍມ)
 * v.boolean() - ຄ່າ true/false
 * v.array(type) - ອາເລຂອງປະເພດຂໍ້ມູນທີ່ລະບຸ, ເຊັ່ນ v.array(v.string())
 * v.object({...}) - ອອບເຈັກທີ່ມີໂຄງສ້າງແນ່ນອນ
 * v.map() - ອອບເຈັກທີ່ມີຄີຍ໌ເປັນຂໍ້ຄວາມແລະຄ່າເປັນປະເພດຂໍ້ມູນທີ່ກຳນົດ
 * v.bytes() - ຂໍ້ມູນໄບນາຣີ (binary data)
 * v.float64() - ຕົວເລກຄວາມລະອຽດສູງ
 * v.int64() - ຕົວເລກຈຳນວນເຕັມຂະໜາດໃຫຍ່
 * v.null() - ຄ່າ null
 * v.union([...]) - ຊະນິດສະຫະພາບ, ເຊັ່ນ v.union([v.string(), v.number()])
 * v.literal(value) - ຄ່າຕາຍຕົວ, ເຊັ່ນ v.literal("pending")
 * 
 * Modifiers:
 * ----------
 * v.optional(type) - ກຳນົດວ່າຟີລນີ້ບໍ່ຈຳເປັນຕ້ອງມີຄ່າ
 * v.default(value) - ກຳນົດຄ່າເລີ່ມຕົ້ນ
 * 
 * ຕົວຢ່າງການໃຊ້:
 * --------------
 * - ຟີລບໍ່ຈຳເປັນ: v.optional(v.string())
 * - ອາເລຂອງຂໍ້ຄວາມ: v.array(v.string())
 * - ອອບເຈັກທີ່ມີໂຄງສ້າງແນ່ນອນ: v.object({ name: v.string(), age: v.number() })
 * - ຢູນຽນໄທບ໌: v.union([v.string(), v.number()])
 */

export default defineSchema({
  // ຕາຕະລາງສຳລັບເກັບລາຍການ Todo
  todos: defineTable({
    text: v.string(), // ຂໍ້ຄວາມຂອງ Todo
    completed: v.boolean(), // ສະຖານະວ່າເຮັດສຳເລັດຫຼືຍັງ
    createdAt: v.number(), // ເວລາທີ່ສ້າງ
  }),
  
  // ຕາຕະລາງສຳລັບເກັບຂໍ້ມູນຜູ້ໃຊ້ເພີ່ມເຕີມ
  users: defineTable({
    userId: v.string(), // Clerk User ID
    name: v.optional(v.string()), // ຊື່ຜູ້ໃຊ້ (ບໍ່ຈຳເປັນເພາະ Clerk ມີແລ້ວ)
    email: v.optional(v.string()), // ອີເມວ (ບໍ່ຈຳເປັນເພາະ Clerk ມີແລ້ວ)
    createdAt: v.number(), // ເວລາສ້າງບັນຊີໃນລະບົບ Convex
    lastLogin: v.optional(v.number()), // ເວລາເຂົ້າສູ່ລະບົບຄັ້ງລ່າສຸດ
    preferences: v.optional(v.object({})), // ການຕັ້ງຄ່າຜູ້ໃຊ້ (ໃຊ້ v.any() ສຳລັບ JSON)
  }),
  
  // ຕາຕະລາງ Audio Files
  audioFiles: defineTable({
    userId: v.string(), // ລະຫັດອ້າງອີງກັບ Clerk User ID
    fileName: v.string(), // ຊື່ໄຟລ໌
    filePath: v.string(), // ທີ່ຢູ່ເກັບໄຟລ໌
    fileSize: v.number(), // ຂະໜາດຂອງໄຟລ໌ (bytes)
    duration: v.optional(v.number()), // ຄວາມຍາວເປັນວິນາທີ
    format: v.string(), // ຮູບແບບໄຟລ໌ (mp3, wav, etc)
    uploadedAt: v.number(), // ເວລາອັບໂຫຼດ
    processedStatus: v.string(), // ສະຖານະການປະມວນຜົນ (pending, processing, completed, failed)
    storageId: v.optional(v.string()), // ID ຂອງໄຟລ໌ໃນ storage
  }),
  
  // ຕາຕະລາງ Audio Transcripts
  audioTranscripts: defineTable({
    audioId: v.id("audioFiles"), // ລະຫັດເຊື່ອມໂຍງກັບໄຟລ໌ສຽງ
    segmentStart: v.optional(v.number()), // ເວລາເລີ່ມຕົ້ນຂອງຊ່ວງສຽງ (ວິນາທີ)
    segmentEnd: v.optional(v.number()), // ເວລາສິ້ນສຸດຂອງຊ່ວງສຽງ (ວິນາທີ)
    speaker: v.optional(v.string()), // ຜູ້ເວົ້າ (ຖ້າລະບຸໄດ້)
    content: v.string(), // ເນື້ອຫາການຖອດຄວາມ
    createdAt: v.number(), // ເວລາສ້າງການຖອດຄວາມ
    confidence: v.optional(v.number()), // ຄວາມເຊື່ອໝັ້ນຂອງການຖອດຄວາມ (0-1)
  }),
  
  // ຕາຕະລາງ Summaries
  summaries: defineTable({
    audioId: v.id("audioFiles"), // ລະຫັດເຊື່ອມໂຍງກັບໄຟລ໌ສຽງ
    summaryText: v.string(), // ເນື້ອຫາສະຫຼຸບທັງໝົດ
    language: v.string(), // ພາສາຂອງການສະຫຼຸບ
    createdAt: v.number(), // ເວລາສ້າງການສະຫຼຸບ
    modelUsed: v.optional(v.string()), // ໂມເດລ AI ທີ່ໃຊ້ໃນການສະຫຼຸບ
  }),
  
  // ຕາຕະລາງການສົນທະນາ (Conversations)
  conversations: defineTable({
    userId: v.string(), // ລະຫັດອ້າງອີງກັບ Clerk User ID
    audioId: v.optional(v.id("audioFiles")), // ລະຫັດເຊື່ອມໂຍງກັບໄຟລ໌ສຽງ (ຖ້າມີ)
    title: v.string(), // ຫົວຂໍ້ການສົນທະນາ
    createdAt: v.number(), // ເວລາສ້າງການສົນທະນາ
    updatedAt: v.number(), // ເວລາອັບເດດລ່າສຸດ
  }),
  
  // ຕາຕະລາງຂໍ້ຄວາມ (Messages)
  messages: defineTable({
    conversationId: v.id("conversations"), // ລະຫັດເຊື່ອມໂຍງກັບການສົນທະນາ
    role: v.string(), // ບົດບາດຂອງຜູ້ສົ່ງ (user, assistant, system)
    content: v.string(), // ເນື້ອຫາຂໍ້ຄວາມ
    references: v.optional(v.string()), // ອ້າງອີງເຖິງຊ່ວງເວລາໃນ transcript (JSON string)
    timestamp: v.number(), // ເວລາສົ່ງຂໍ້ຄວາມ
  }),
}); 