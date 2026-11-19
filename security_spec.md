# Security Specification & Threat Model

## 1. Data Invariants
1. **Identity & PII Isolation**: `UserProfile` (`/users/{userId}`), `UserSave` (`/userSaves/{userId}`), and `UserEconomy` (`/userEconomy/{userId}`) can only be read or written by the authenticated owner whose `request.auth.uid == userId` AND `request.auth.token.email_verified == true`. Collection `list` on these private paths is disabled (`allow list: if false`).
2. **Non-PII Public Leaderboard**: `/leaderboard/{userId}` never stores emails, photos, or private credentials; it only exposes `uid`, `isPublic == true`, `nickname`, `equippedSkin`, and aggregate counts for verified players, and can only be mutated by `isOwner(userId)`.
3. **Participant-Scoped Trade Escrow**: `/trades/{tradeId}` can only be read, listed, or updated by its `senderUid` or `recipientUid` (`isVerifiedUser()`), must target an existing recipient in `/leaderboard`, and enforces action-based transitions + terminal state locking (`rejected`, `cancelled`, `completed`).
4. **Immutable Ownership & Temporal Integrity**: `uid`, `ownerId`, `tradeId`, `senderUid`, `recipientUid`, `offeredSkinId`, `requestedSkinId`, and `createdAt` can never change post-create; timestamps must equal `request.time`.
5. **Strict Payload Boundaries**: Every write enforces `hasAll` + `hasOnly` + `affectedKeys().hasOnly(...)`, regex ID guards (`^[a-zA-Z0-9_\\-]+$`), string `.size()` bounds, numeric min/max clamping, and bounded lists/maps.

## 2. Adversarial "Dirty Dozen" Payloads (All Must Return PERMISSION_DENIED)
1. Unauthenticated read/write to `/users/uid1`, `/userSaves/uid1`, `/userEconomy/uid1`, or `/trades/t1`.
2. User with `email_verified: false` creating `/userEconomy/uid1` or `/leaderboard/uid1`.
3. Cross-user write (`auth.uid = 'uid2'` mutating `/userEconomy/uid1` coins/skins or `/leaderboard/uid1`).
4. Collection `list` scrape on `/users`, `/userSaves`, or `/userEconomy`.
5. Shadow field injection (`isAdmin: true`, `email: 'leak@test.com'`) on `/leaderboard/uid1` or `/userEconomy/uid1`.
6. Negative or overflowed `spikeyCoins` (`-100` or `999999999`) in `/userEconomy/uid1`.
7. Invalid `equippedSkin` or `offeredSkinId` (> 48 chars or invalid regex characters).
8. Creating a self-trade (`/trades/t1` where `senderUid == recipientUid`) or targeting non-existent recipient.
9. Non-participant reading or listing `/trades/{tradeId}` where neither `senderUid` nor `recipientUid` matches `auth.uid`.
10. Sender attempting to accept their own trade (`status: 'accepted'` by `senderUid` instead of `recipientUid`).
11. Mutating `offeredSkinId` or `requestedSkinId` during a trade update, or modifying a `cancelled`/`rejected`/`completed` trade.
12. Unbounded array injection (`claimedSeasonLevels.size() > 50` or `transactions.size() > 40`).
