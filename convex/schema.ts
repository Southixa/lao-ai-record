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

  // ຕາຕະລາງສຳລັບເກັບລາຍການ Todo(ສຳັລບ test ຫ້າມລົບ)
  todos: defineTable({
    text: v.string(), // ຂໍ້ຄວາມຂອງ Todo
    completed: v.boolean(), // ສະຖານະວ່າເຮັດສຳເລັດຫຼືຍັງ
    createdAt: v.number(), // ເວລາທີ່ສ້າງ
  }),


  // ຕາຕະລາງສຳລັບເກັບຂໍ້ມູນຜູ້ໃຊ້
  users: defineTable({
    clerkId: v.optional(v.string()), // Clerk User ID (optional)
    name: v.optional(v.string()), // ຊື່ຜູ້ໃຊ້
    email: v.optional(v.string()), // ອີເມວ
    createdAt: v.number(), // ເວລາສ້າງບັນຊີໃນລະບົບ
    lastLogin: v.optional(v.number()), // ເວລາເຂົ້າສູ່ລະບົບຄັ້ງລ່າສຸດ
    preferences: v.optional(v.object({})), // ການຕັ້ງຄ່າຜູ້ໃຊ້
  }),
  
  // ຕາຕະລາງການສົນທະນາ (Conversations)
  conversations: defineTable({
    userId: v.id("users"), // ລະຫັດອ້າງອີງກັບຜູ້ໃຊ້
    title: v.string(), // ຫົວຂໍ້ການສົນທະນາ
    createdAt: v.number(), // ເວລາສ້າງການສົນທະນາ
    updatedAt: v.number(), // ເວລາອັບເດດລ່າສຸດ
  }),
  
  // ຕາຕະລາງຂໍ້ຄວາມ (Messages)
  messages: defineTable({
    conversationId: v.id("conversations"), // ລະຫັດເຊື່ອມໂຍງກັບການສົນທະນາ
    role: v.string(), // ບົດບາດຂອງຜູ້ສົ່ງ (user, assistant, system)
    content: v.string(), // ເນື້ອຫາຂໍ້ຄວາມ
    createdAt: v.number(), // ເວລາສ້າງຂໍ້ຄວາມ
    updatedAt: v.number(), // ເວລາອັບເດດລ່າສຸດ
  }),
  
  // ຕາຕະລາງ Audio Files
  audio: defineTable({
    conversationId: v.id("conversations"), // ລະຫັດເຊື່ອມໂຍງກັບການສົນທະນາ
    totalChunks: v.number(), // ຈຳນວນ chunks ທັງໝົດ
    processedChunks: v.number(), // ຈຳນວນ chunks ທີ່ປະມວນຜົນແລ້ວ
    isComplete: v.boolean(), // ບອກວ່າການປະມວນຜົນສຳເລັດທັງໝົດແລ້ວ
    combinedTranscript: v.optional(v.string()), // ຜົນລວມການຖອດຄວາມທັງໝົດ
    createdAt: v.number(), // ເວລາສ້າງ
    updatedAt: v.number(), // ເວລາອັບເດດລ່າສຸດ
    processedStatus: v.string(), // ສະຖານະການປະມວນຜົນ (pending, processing, completed, failed)
  }),
  
  // ຕາຕະລາງ Audio Chunks
  audioChunks: defineTable({
    audioId: v.id("audio"), // ລະຫັດອ້າງອີງກັບໄຟລ໌ສຽງຫຼັກ
    chunkIndex: v.number(), // ລຳດັບຊິ້ນສ່ວນ (0, 1, 2, ...)
    startTime: v.number(), // ເວລາເລີ່ມຕົ້ນໃນຟາຍຕົ້ນສະບັບ (ວິນາທີ)
    endTime: v.number(), // ເວລາສິ້ນສຸດໃນຟາຍຕົ້ນສະບັບ (ວິນາທີ)
    duration: v.number(), // ຄວາມຍາວຂອງຊິ້ນສ່ວນ (ວິນາທີ)
    filePath: v.string(), // ເສັ້ນທາງຂອງຟາຍຊິ້ນສ່ວນ
    processedStatus: v.string(), // ສະຖານະ (pending, processing, completed, failed)
    storageId: v.optional(v.string()), // ID ຂອງຊິ້ນສ່ວນໃນລະບົບເກັບຂໍ້ມູນ
    createdAt: v.number(), // ເວລາສ້າງຊິ້ນສ່ວນ
    updatedAt: v.number(), // ເວລາອັບເດດລ່າສຸດ
  }),
  
  // ຕາຕະລາງ Audio Chunks Transcripts
  audioChunksTranscripts: defineTable({
    audioChunkId: v.id("audioChunks"), // ລະຫັດອ້າງອີງກັບຊິ້ນສ່ວນສຽງ
    audioChunksTranscriptsIndex: v.number(), // ລຳດັບຂອງການຖອດຄວາມຊິ້ນສ່ວນ
    formattedContent: v.string(), // ເນື້ອຫາທີ່ຈັດຮູບແບບແລ້ວ
    createdAt: v.number(), // ເວລາສ້າງການຖອດຄວາມ
    updatedAt: v.number(), // ເວລາອັບເດດລ່າສຸດ
  }),
  
  // ຕາຕະລາງ Summaries
  sumaries: defineTable({
    audioId: v.id("audio"), // ລະຫັດເຊື່ອມໂຍງກັບໄຟລ໌ສຽງ
    summaryText: v.string(), // ເນື້ອຫາສະຫຼຸບທັງໝົດ
    language: v.string(), // ພາສາຂອງການສະຫຼຸບ
    createdAt: v.number(), // ເວລາສ້າງການສະຫຼຸບ
    updatedAt: v.number(), // ເວລາອັບເດດລ່າສຸດ
  }),
}); 