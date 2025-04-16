import { v } from "convex/values";
import { query } from "./_generated/server";
import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation({
    handler: async (ctx) => {
      return await ctx.storage.generateUploadUrl();
    },
  });