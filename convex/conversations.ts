import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ດຶງຂໍ້ມູນການສົນທະນາທັງໝົດ
export const getConversations = query({
  handler: async (ctx) => {
    return await ctx.db.query("conversations").order("desc").collect();
  },
});

// ດຶງຂໍ້ມູນການສົນທະນາຂອງຜູ້ໃຊ້
export const getConversationsByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { userId } = args;
    return await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();
  },
});

// ດຶງຂໍ້ມູນການສົນທະນາດ້ວຍ ID
export const getConversationById = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const { conversationId } = args;
    return await ctx.db.get(conversationId);
  },
});

// ສ້າງການສົນທະນາໃໝ່
export const createConversation = mutation({
  args: { 
    userId: v.optional(v.id("users")),
    title: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { userId, title } = args;
    
    // ສ້າງຊື່ການສົນທະນາອັດຕະໂນມັດຖ້າບໍ່ມີການລະບຸ
    const defaultTitle = `ການສົນທະນາໃໝ່ ${new Date().toLocaleDateString('lo-LA')}`;
    
    const now = Date.now();
    const conversationData: any = {
      title: title || defaultTitle,
      createdAt: now,
      updatedAt: now
    };
    
    // ເພີ່ມ userId ຖ້າມີ
    if (userId !== undefined) {
      conversationData.userId = userId;
    }
    
    const conversationId = await ctx.db.insert("conversations", conversationData);
    
    return { conversationId };
  },
});

// ອັບເດດການສົນທະນາ
export const updateConversation = mutation({
  args: { 
    conversationId: v.id("conversations"),
    title: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { conversationId, title } = args;
    
    const updates: any = {
      updatedAt: Date.now()
    };
    
    if (title !== undefined) {
      updates.title = title;
    }
    
    await ctx.db.patch(conversationId, updates);
    return { success: true };
  },
});

// ລຶບການສົນທະນາ
export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const { conversationId } = args;
    await ctx.db.delete(conversationId);
    return { success: true };
  },
}); 