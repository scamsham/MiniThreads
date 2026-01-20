import { eq } from "drizzle-orm";
import { usersTable } from "../db";
import { db } from "../db/client";
import { cacheGetOrSetJson } from "../infra/redis/cache";

type PrivacyFlag = { isPrivate: boolean };

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
      const [u] = await db
        .select({ isPrivate: usersTable.isPrivate })
        .from(usersTable)
        .where(eq(usersTable.id, ownerId))
        .limit(1);

      return { isPrivate: u?.isPrivate ?? false };
    }
  );

  // for public accounts, we let everyone view
  if (!isAccountPrivate.isPrivate) return true;

  // return defult deny for private accounts
  return false;
}
