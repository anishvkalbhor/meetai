
import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const user = pgTable("user", {
 id: text('id').primaryKey(),
 name: text('name').notNull(),
 email: text('email').notNull().unique(),
 emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
 image: text('image'),
 createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
 updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
});

export const session = pgTable("session", {
 id: text('id').primaryKey(),
 expiresAt: timestamp('expires_at').notNull(),
 token: text('token').notNull().unique(),
 createdAt: timestamp('created_at').notNull(),
 updatedAt: timestamp('updated_at').notNull(),
 ipAddress: text('ip_address'),
 userAgent: text('user_agent'),
 userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
 id: text('id').primaryKey(),
 accountId: text('account_id').notNull(),
 providerId: text('provider_id').notNull(),
 userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' }),
 accessToken: text('access_token'),
 refreshToken: text('refresh_token'),
 idToken: text('id_token'),
 accessTokenExpiresAt: timestamp('access_token_expires_at'),
 refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
 scope: text('scope'),
 password: text('password'),
 createdAt: timestamp('created_at').notNull(),
 updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
 id: text('id').primaryKey(),
 identifier: text('identifier').notNull(),
 value: text('value').notNull(),
 expiresAt: timestamp('expires_at').notNull(),
 createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
 updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date())
});

export const agents = pgTable("agents", {
    id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
    instructions: text("instructions").notNull(),
    aiProvider: text("ai_provider").notNull().default("openrouter"), // openrouter, gemini, llama, anthropic
    aiModel: text("ai_model").notNull().default("mistralai/mistral-7b-instruct"),
    temperature: text("temperature").notNull().default("0.7"),
    maxTokens: text("max_tokens").notNull().default("1000"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const meetingStatus = pgEnum("meeting_status", [
    "upcoming",
    "active",
    "completed",
    "processing",
    "cancelled"
])

export const meetings = pgTable("meetings", {
    id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
    agentId: text("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
    status: meetingStatus("status").notNull().default("upcoming"),
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    transcriptUrl: text("transcript_url"),
    recordingUrl: text("recording_url"),
    summary: text("summary"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const chatSessions = pgTable("chat_sessions", {
    id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
    userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
    agentId: text("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New Chat"),
    status: text("status").notNull().default("active"), // active, archived
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const chatMessages = pgTable("chat_messages", {
    id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
    sessionId: text("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // user, assistant
    content: text("content").notNull(),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
})