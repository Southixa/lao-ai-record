/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as audio from "../audio.js";
import type * as audioChunks from "../audioChunks.js";
import type * as conversations from "../conversations.js";
import type * as storage from "../storage.js";
import type * as todos from "../todos.js";
import type * as transcribe from "../transcribe.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  audio: typeof audio;
  audioChunks: typeof audioChunks;
  conversations: typeof conversations;
  storage: typeof storage;
  todos: typeof todos;
  transcribe: typeof transcribe;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
