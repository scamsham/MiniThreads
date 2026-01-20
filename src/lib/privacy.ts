import { and, eq } from "drizzle-orm";
import { followsTable, usersTable } from "../db";
import { db } from "../db/client";
import { cacheGetOrSetJson } from "../infra/redis/cache";

type PrivacyFlag = { isPrivate: boolean };
type FollowFlag = { allowed: boolean };

/*
Note to self: Caching private content on cache is dangerous as it may lead to data leaks.
So we cache permission flags only, never the actual content.
*/
export async function canViewUserContent(
  viewerId: number,
  ownerId: number
): Promise<boolean> {
  // If viewer and owner are same then we allow obviously (for self obsessed individuals)
  if (viewerId === ownerId) return true;

  const privacyKey = `privacy:${ownerId}`;
  const { value: isAccountPrivate } = await cacheGetOrSetJson<PrivacyFlag>(
    privacyKey,
    60,
    async () => {
      const [user] = await db
        .select({ isPrivate: usersTable.isPrivate })
        .from(usersTable)
        .where(eq(usersTable.id, ownerId))
        .limit(1);

      return { isPrivate: user?.isPrivate ?? false };
    }
  );

  // for public accounts, we let everyone view
  if (!isAccountPrivate.isPrivate) return true;

  // cache relationship between viewer and the owner
  const followKey = `follow:${viewerId}:${ownerId}`;
  const { value: follow } = await cacheGetOrSetJson<FollowFlag>(
    followKey,
    30,
    async () => {
      const followCheck = await db
        .select({ followerId: followsTable.followerId })
        .from(followsTable)
        .where(
          and(
            eq(followsTable.followerId, viewerId),
            eq(followsTable.followeeId, ownerId),
            eq(followsTable.status, "accepted")
          )
        )
        .limit(1);

      return { allowed: followCheck.length > 0 ? true : false };
    }
  );

  return follow.allowed;
}
