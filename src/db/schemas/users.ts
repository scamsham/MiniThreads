import {
  boolean,
  uniqueIndex,
  pgEnum,
  bigserial,
  text,
  varchar,
  timestamp,
  pgTable,
} from "drizzle-orm/pg-core";

export const accountStatusEnum = pgEnum("account_status", [
  "active",
  "suspended",
  "deactivated",
  "shadowbanned",
]);

export const usersTable = pgTable(
  "users",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    username: varchar("username", { length: 32 }).notNull().unique(),
    name: varchar("name", { length: 32 }).notNull(),
    email: varchar("email", { length: 64 }).notNull(),
    passwordHash: text("password_hash"),
    address: text("address"),
    country: varchar("country", { length: 32 }),
    isPrivate: boolean("is_private").default(false).notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    bio: varchar("bio", { length: 240 }),
    displayPictureUrl: text("display_picture_url").default(""),
    accountStatus: accountStatusEnum().default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    usernameIdx: uniqueIndex("username_idx").on(table.username),
    emailIdx: uniqueIndex("emaid_idx").on(table.email),
  })
);
