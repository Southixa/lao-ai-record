import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Add these interface definitions below the imports
interface TranscriptionResult {
  success: boolean;
  error?: string;
  transcript?: string;
  formattedTranscript?: Array<{timecode: string; speaker: string; text: string}>;
  language?: string;
}

interface ChunkResult {
  chunkId: Id<"audioChunks">;
}

interface CreateAudioChunkWithTranscribeResult {
  success: boolean;
  error?: string;
  chunkId?: Id<"audioChunks">;
  transcript?: string;
  formattedTranscript?: Array<{timecode: string; speaker: string; text: string}>;
}

/**
 * ດຶງຂໍ້ມູນ audioChunks ທັງໝົດ
 */
export const getAllAudioChunks = query({
  handler: async (ctx) => {
    return await ctx.db.query("audioChunks").order("desc").collect();
  },
});

/**
 * ດຶງຂໍ້ມູນ audioChunk ດ້ວຍ ID
 */
export const getAudioChunkById = query({
  args: { chunkId: v.id("audioChunks") },
  handler: async (ctx, args) => {
    const { chunkId } = args;
    return await ctx.db.get(chunkId);
  },
});

/**
 * ດຶງຂໍ້ມູນ audioChunks ດ້ວຍ audioId
 */
export const getAudioChunksByAudioId = query({
  args: { audioId: v.id("audio") },
  handler: async (ctx, args) => {
    const { audioId } = args;
    return await ctx.db
      .query("audioChunks")
      .filter((q) => q.eq(q.field("audioId"), audioId))
      .filter((q) => q.gte(q.field("chunkIndex"), 0))
      .collect()
      .then(chunks => chunks.sort((a, b) => a.chunkIndex - b.chunkIndex));
  },
});

/**
 * ສ້າງ audioChunk ໃໝ່
 */
export const createAudioChunk = mutation({
  args: {
    audioId: v.id("audio"),
    chunkIndex: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    filePath: v.string(),
    storageId: v.optional(v.string()),
    processedStatus: v.optional(v.string()),
    formattedContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { audioId, chunkIndex, startTime, endTime, duration, filePath, storageId, processedStatus = "pending", formattedContent } = args;
    
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
      formattedContent,
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
    
    return { chunkId };
  },
});

/**
 * ອັບເດດ audioChunk
 */
export const updateAudioChunk = mutation({
  args: {
    chunkId: v.id("audioChunks"),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    filePath: v.optional(v.string()),
    storageId: v.optional(v.string()),
    processedStatus: v.optional(v.string()),
    formattedContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { chunkId, ...updates } = args;
    
    const existingChunk = await ctx.db.get(chunkId);
    if (!existingChunk) {
      throw new Error("Audio chunk not found");
    }
    
    await ctx.db.patch(chunkId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    // ອັບເດດສະຖານະການປະມວນຜົນຂອງ audio ຫຼັກ
    if (updates.processedStatus === "completed") {
      const audioId = existingChunk.audioId;
      const audio = await ctx.db.get(audioId);
      const allChunks = await ctx.db
        .query("audioChunks")
        .filter((q) => q.eq(q.field("audioId"), audioId))
        .collect();
      
      const completedChunks = allChunks.filter(chunk => chunk.processedStatus === "completed");
      
      await ctx.db.patch(audioId, {
        processedChunks: completedChunks.length,
        updatedAt: Date.now(),
        isComplete: completedChunks.length === allChunks.length,
      });
    }
    
    return { success: true, chunkId };
  },
});

/**
 * ລຶບ audioChunk
 */
export const deleteAudioChunk = mutation({
  args: { chunkId: v.id("audioChunks") },
  handler: async (ctx, args) => {
    const { chunkId } = args;
    
    const chunk = await ctx.db.get(chunkId);
    if (!chunk) {
      throw new Error("Audio chunk not found");
    }
    
    // ລຶບ audioChunk
    await ctx.db.delete(chunkId);
    
    // ອັບເດດຈຳນວນ chunks ໃນຟາຍສຽງຫຼັກ
    const audioId = chunk.audioId;
    const audio = await ctx.db.get(audioId);
    if (audio) {
      await ctx.db.patch(audioId, {
        totalChunks: Math.max(0, audio.totalChunks - 1),
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * ລຶບ audioChunks ທັງໝົດຂອງ audio
 */
export const deleteAudioChunksByAudioId = mutation({
  args: { audioId: v.id("audio") },
  handler: async (ctx, args) => {
    const { audioId } = args;
    
    const chunks = await ctx.db
      .query("audioChunks")
      .filter((q) => q.eq(q.field("audioId"), audioId))
      .collect();
    
    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }
    
    // ອັບເດດຈຳນວນ chunks ໃນຟາຍສຽງຫຼັກ
    const audio = await ctx.db.get(audioId);
    if (audio) {
      await ctx.db.patch(audioId, {
        totalChunks: 0,
        processedChunks: 0,
        updatedAt: Date.now(),
      });
    }
    
    return { success: true, deletedCount: chunks.length };
  },
});

/**
 * ອັບໂຫຼດ audioChunk ໄປຍັງ storage
 */
export const updateAudioChunkStorageId = mutation({
  args: {
    chunkId: v.id("audioChunks"),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const { chunkId, storageId } = args;
    
    const existingChunk = await ctx.db.get(chunkId);
    if (!existingChunk) {
      throw new Error("Audio chunk not found");
    }
    
    await ctx.db.patch(chunkId, {
      storageId,
      updatedAt: Date.now(),
    });
    
    return { success: true, chunkId };
  },
});

/**
 * ສ້າງ audioChunk ພ້ອມກັບການຖອດຄວາມສຽງແບບອັດຕະໂນມັດ
 * ຟັງຊັນນີ້ຈະເອີ້ນໃຊ້ transcribeAudio ແລ້ວຕໍ່ດ້ວຍ createAudioChunk
 */
export const createAudioChunkWithTranscribe = action({
  args: {
    // args ຈາກ createAudioChunk
    audioId: v.id("audio"),
    chunkIndex: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    filePath: v.string(),
    storageId: v.optional(v.string()),
    processedStatus: v.optional(v.string()),
    // args ຈາກ transcribeAudio
    audioData: v.string(), // ຂໍ້ມູນສຽງເປັນຮູບແບບ base64
    language: v.optional(v.string()), // ພາສາຂອງສຽງ
  },
  handler: async (ctx, args): Promise<CreateAudioChunkWithTranscribeResult> => {
    try {
      // ແຍກພາລາມິເຕີ
      const { 
        audioId, chunkIndex, startTime, endTime, duration, 
        filePath, storageId, processedStatus,
        audioData, language 
      } = args;

      // 1. ເອີ້ນໃຊ້ transcribeAudio ກ່ອນ
      const transcriptionResult: TranscriptionResult = await ctx.runAction(api.transcribe.transcribeAudio, {
        audioData: audioData,
        language: language || "lo"
      });

      // ກວດສອບຜົນລັບຂອງການຖອດຄວາມ
      if (!transcriptionResult.success) {
        throw new Error(`ການຖອດຄວາມສຽງລົ້ມເຫລວ: ${transcriptionResult.error}`);
      }

      // ກຳນົດສະຖານະໃຫ້ສຳເລັດເມື່ອຖອດຄວາມແລ້ວ
      const newProcessedStatus = "completed";

      // 2. ເອີ້ນໃຊ້ createAudioChunk ເພື່ອບັນທຶກຂໍ້ມູນ
      const chunkResult: ChunkResult = await ctx.runMutation(api.audioChunks.createAudioChunk, {
        audioId,
        chunkIndex,
        startTime,
        endTime,
        duration,
        filePath,
        storageId,
        processedStatus: newProcessedStatus, // ກຳນົດສະຖານະວ່າປະມວນຜົນແລ້ວ
        formattedContent: JSON.stringify(transcriptionResult.formattedTranscript)
      });

      // ສົ່ງຄືນຜົນລັບທັງສອງຢ່າງ
      return {
        success: true,
        chunkId: chunkResult.chunkId,
        transcript: transcriptionResult.transcript,
        formattedTranscript: transcriptionResult.formattedTranscript
      };
    } catch (error) {
      console.error("Error in createAudioChunkWithTranscribe:", error);
      return {
        success: false,
        error: String(error)
      };
    }
  }
}); 