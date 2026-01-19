import { pgTable } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { bigint, primaryKey, index, timestamp } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";

export const followStatusEnum = pgEnum("follow_status", [
  "pending",
  "accepted",
]);

export const followsTable = pgTable(
  "follows",
  {
    followerId: bigint("follower_id", { mode: "number" })
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      }),
    followeeId: bigint("followee_id", { mode: "number" })
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      }),
    status: followStatusEnum("status").notNull().default("accepted"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.followerId, table.followeeId] }),
    followerIdx: index("follower_idx").on(table.followerId),
    followeeIdx: index("followee_idx").on(table.followeeId),
  })
);
