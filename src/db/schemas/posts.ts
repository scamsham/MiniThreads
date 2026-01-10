import {} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import {
  pgTable,
  integer,
  text,
  timestamp,
  boolean,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { varchar } from "drizzle-orm/pg-core";

export const postsTable = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    authorUsername: varchar("author_username", { length: 32 }).references(
      () => usersTable.username,
      { onDelete: "cascade" }
    ),
    content: text("content").notNull(),
    isEdited: boolean("is_edited").default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    postsAuthorCreatedIdx: index("posts_author_created_idx").on(table.authorId),
    postsCreatedIdx: index("posts_created_idx").on(table.createdAt),
  })
);
