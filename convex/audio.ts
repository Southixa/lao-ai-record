import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * ດຶງຂໍ້ມູນຟາຍສຽງທັງໝົດ
 */
export const getAllAudio = query({
  handler: async (ctx) => {
    return await ctx.db.query("audio").order("desc").collect();
  },
});

/**
 * ດຶງຂໍ້ມູນຟາຍສຽງດ້ວຍ ID
 */
export const getAudioById = query({
  args: { audioId: v.id("audio") },
  handler: async (ctx, args) => {
    const { audioId } = args;
    return await ctx.db.get(audioId);
  },
});

/**
 * ດຶງຂໍ້ມູນຟາຍສຽງດ້ວຍ conversationId
 */
export const getAudioByConversationId = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const { conversationId } = args;
    const audioFiles = await ctx.db
      .query("audio")
      .filter((q) => q.eq(q.field("conversationId"), conversationId))
      .order("desc")
      .collect();
    return audioFiles;
  },
});

/**
 * ສ້າງຟາຍສຽງໃໝ່
 */
export const createAudio = mutation({
  args: {
    conversationId: v.id("conversations"),
    processedStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { conversationId, processedStatus = "pending" } = args;
    
    const now = Date.now();
    const audioId = await ctx.db.insert("audio", {
      conversationId,
      totalChunks: 0,
      processedChunks: 0,
      isComplete: false,
      processedStatus,
      createdAt: now,
      updatedAt: now,
    });
    
    return { audioId };
  },
});

/**
 * ອັບເດດຟາຍສຽງ
 */
export const updateAudio = mutation({
  args: {
    audioId: v.id("audio"),
    totalChunks: v.optional(v.number()),
    processedChunks: v.optional(v.number()),
    isComplete: v.optional(v.boolean()),
    combinedTranscript: v.optional(v.string()),
    processedStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { audioId, ...updates } = args;
    
    const existingAudio = await ctx.db.get(audioId);
    if (!existingAudio) {
      throw new Error("Audio not found");
    }
    
    await ctx.db.patch(audioId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return { success: true, audioId };
  },
});

/**
 * ລຶບຟາຍສຽງ
 */
export const deleteAudio = mutation({
  args: { audioId: v.id("audio") },
  handler: async (ctx, args) => {
    const { audioId } = args;
    
    // ລຶບຟາຍສຽງ
    await ctx.db.delete(audioId);
    
    // ລຶບ chunks ທີ່ກ່ຽວຂ້ອງ
    const audioChunks = await ctx.db
      .query("audioChunks")
      .filter((q) => q.eq(q.field("audioId"), audioId))
      .collect();
    
    for (const chunk of audioChunks) {
      await ctx.db.delete(chunk._id);
    }
    
    return { success: true };
  },
});

/**
 * ດຶງຂໍ້ມູລ audio ດ້ວຍ ID ພ້ອມລວມ transcript ຈາກ chunks
 */
export const getAudioWithCombinedTranscript = mutation({
  args: { audioId: v.id("audio") },
  handler: async (ctx, args) => {
    const { audioId } = args;
    
    // ດຶງ audio ຈາກ ID
    const audio = await ctx.db.get(audioId);
    if (!audio) {
      throw new Error("Audio not found");
    }
    
    // ດຶງຂໍ້ມູນທຸກ chunks ທີ່ຕິດພັນກັບ audio ນີ້
    const audioChunks = await ctx.db
      .query("audioChunks")
      .filter((q) => q.eq(q.field("audioId"), audioId))
      .collect();
    
    // ຈັດລຽງຕາມ chunkIndex
    audioChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    
    // ລວມເອົາແຕ່ formattedContent ຈາກທຸກ chunks
    const combinedTranscriptArray = audioChunks
      .filter(chunk => chunk.formattedContent && typeof chunk.formattedContent === 'string') // ກັ່ນຕອງເອົາສະເພາະ chunks ທີ່ມີ formattedContent ເປັນ string
      .map(chunk => {
        try {
          // ພະຍາຍາມແປງ formattedContent ຈາກ string ເປັນ object
          return JSON.parse(chunk.formattedContent as string);
        } catch (error) {
          console.error("Error parsing formattedContent:", error);
          return [];
        }
      });
    
    // ລວມເປັນ array ດຽວ
    const flattenedTranscript = combinedTranscriptArray.flat();
    
    // ແປງເປັນ string ແລະ ອັບເດດ audio
    const combinedTranscript = JSON.stringify(flattenedTranscript);
    
    // ອັບເດດ audio ດ້ວຍ combinedTranscript
    await ctx.db.patch(audioId, {
      combinedTranscript,
      processedStatus: "completed",
      updatedAt: Date.now()
    });
    
    // ດຶງ audio ອີກຄັ້ງເພື່ອເອົາຂໍ້ມູນລ່າສຸດ
    const updatedAudio = await ctx.db.get(audioId);
    
    return updatedAudio;
  },
});

/**
 * ເພີ່ມ audio chunk
 */
export const addAudioChunk = mutation({
  args: {
    audioId: v.id("audio"),
    chunkIndex: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    filePath: v.string(),
    storageId: v.optional(v.string()),
    processedStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { audioId, chunkIndex, startTime, endTime, duration, filePath, storageId, processedStatus = "pending" } = args;
    
    const now = Date.now();
    const chunkId = await ctx.db.insert("audioChunks", {
      audioId,
      chunkIndex,
      startTime,
      endTime,
      duration,
      filePath,
      storageId,
      processedStatus,
      createdAt: now,
      updatedAt: now,
    });
    
    // ອັບເດດຈຳນວນ chunks ໃນຟາຍສຽງຫຼັກ
    const audio = await ctx.db.get(audioId);
    if (audio) {
      await ctx.db.patch(audioId, {
        totalChunks: audio.totalChunks + 1,
        updatedAt: now,
      });
    }
    
    return { success: true, chunkId };
  },
}); 