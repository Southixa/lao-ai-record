import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ດຶງຂໍ້ມູນຜູ້ໃຊ້ທັງໝົດ
export const getUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// ດຶງຂໍ້ມູນຜູ້ໃຊ້ດ້ວຍ clerkId
export const getUserByClerkId = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { clerkId } = args;
    if (!clerkId) return null;
    
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkId))
      .collect();
    
    return users[0] || null;
  },
});

// ດຶງຂໍ້ມູນຜູ້ໃຊ້ດ້ວຍ userId
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { userId } = args;
    return await ctx.db.get(userId);
  },
});

// ສ້າງຂໍ້ມູນຜູ້ໃຊ້ໃໝ່
export const createUser = mutation({
  args: { 
    clerkId: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { clerkId, name, email } = args;
    
    const userId = await ctx.db.insert("users", {
      clerkId,
      name,
      email,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      preferences: {}
    });
    
    return { userId };
  },
});

// ອັບເດດຂໍ້ມູນຜູ້ໃຊ້
export const updateUser = mutation({
  args: { 
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    preferences: v.optional(v.object({}))
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    // ເພີ່ມເວລາຄັ້ງສຸດທ້າຍທີ່ມີການອັບເດດ
    const updatedUser = {
      ...updates,
      lastLogin: Date.now()
    };
    
    await ctx.db.patch(userId, updatedUser);
    return { success: true };
  },
});

// ລຶບຂໍ້ມູນຜູ້ໃຊ້
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { userId } = args;
    await ctx.db.delete(userId);
    return { success: true };
  },
}); 