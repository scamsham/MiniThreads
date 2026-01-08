import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { postsTable } from "./posts";
import { AnyPgColumn } from "drizzle-orm/pg-core";

export const commentsTable = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    postId: uuid("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),

    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    parentCommentId: uuid("parent_comment_id").references(
      (): AnyPgColumn => commentsTable.id,
      { onDelete: "cascade" }
    ),

    comment: text("comment").notNull(),
    isEdited: boolean("is_edited").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    commentsPostCreatedIdx: index("comments_post_created_idx").on(
      t.postId,
      t.createdAt
    ),
    commentsParentCreatedIdx: index("comments_parent_created_idx").on(
      t.parentCommentId,
      t.createdAt
    ),
    commentsAuthorCreatedIdx: index("comments_author_created_idx").on(
      t.authorId,
      t.createdAt
    ),
  })
);
