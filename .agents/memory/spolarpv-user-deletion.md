---
name: SpolarPV user deletion / FK cascade
description: shared/schema.ts has no ON DELETE CASCADE on any users.id FK — deleting a user requires manual multi-table cleanup in a transaction.
---

`shared/schema.ts` defines many tables with `.references(() => users.id)` (userProducts, deposits, withdrawals, withdrawalWallets, userStakings, referralCommissions [userId + fromUserId], userTasks, transactions, giftCodes.createdBy, giftCodeClaims, adminAuditLog.adminId) but none declare `onDelete: "cascade"`. Postgres defaults to NO ACTION, so a bare `DELETE FROM users WHERE id = ...` throws a FK violation.

Admin "delete user" (`storage.deleteUser` in `server/storage.ts`) instead deletes dependent rows from every referencing table inside a `db.transaction`, in dependency order, before deleting the user row. Gift codes *created by* the deleted user are deleted (with their claims) rather than reassigned, since `giftCodes.createdBy` is NOT NULL. Admin audit-log rows where the deleted user was the *actor* (`adminId`) are deleted too; rows where the user was merely the *target* (`targetUserId`, not an FK) are left intact.

**Why:** the schema was never given cascade rules, and there's no soft-delete flag on `users`, so any hard-delete feature must replicate the cascade manually or it will 500 on the FK constraint.
**How to apply:** if adding a new table with `.references(() => users.id)`, either add `onDelete: "cascade"` there or add a corresponding cleanup line to `storage.deleteUser` — otherwise deleting a user with rows in that table will start failing.
