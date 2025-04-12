import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ດຶງຂໍ້ມູນລາຍການ Todo ທັງໝົດ
export const getTodos = query({
  handler: async (ctx) => {
    return await ctx.db.query("todos").order("desc").collect();
  },
});

// ເພີ່ມລາຍການ Todo ໃໝ່
export const addTodo = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const { text } = args;
    await ctx.db.insert("todos", {
      text,
      completed: false,
      createdAt: Date.now(),
    });
  },
});

// ປ່ຽນສະຖານະຂອງ Todo
export const toggleTodo = mutation({
  args: { id: v.id("todos"), completed: v.boolean() },
  handler: async (ctx, args) => {
    const { id, completed } = args;
    await ctx.db.patch(id, { completed });
  },
});

// ລຶບລາຍການ Todo
export const deleteTodo = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const { id } = args;
    await ctx.db.delete(id);
  },
}); 