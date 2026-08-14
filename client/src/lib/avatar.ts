/**
 * Deterministic avatar assignment.
 * Each user gets a unique Chinese realistic avatar based on their ID.
 * 20 avatars total (10 female, 10 male) — spread evenly across all user IDs.
 */

const AVATAR_COUNT = 20;

// Filenames in order: f1..f10 then m1..m10
const AVATARS: string[] = [
  "/avatars/avatar-f1.png",
  "/avatars/avatar-f2.png",
  "/avatars/avatar-f3.png",
  "/avatars/avatar-f4.png",
  "/avatars/avatar-f5.png",
  "/avatars/avatar-f6.png",
  "/avatars/avatar-f7.png",
  "/avatars/avatar-f8.png",
  "/avatars/avatar-f9.png",
  "/avatars/avatar-f10.png",
  "/avatars/avatar-m1.png",
  "/avatars/avatar-m2.png",
  "/avatars/avatar-m3.png",
  "/avatars/avatar-m4.png",
  "/avatars/avatar-m5.png",
  "/avatars/avatar-m6.png",
  "/avatars/avatar-m7.png",
  "/avatars/avatar-m8.png",
  "/avatars/avatar-m9.png",
  "/avatars/avatar-m10.png",
];

/**
 * Returns the avatar URL for a given user ID.
 * The assignment is deterministic: same userId → same avatar every time.
 * IDs that are close together (e.g. 1, 2, 3 …) get visually distinct avatars.
 */
export function getUserAvatar(userId: number): string {
  const index = ((userId - 1) % AVATAR_COUNT + AVATAR_COUNT) % AVATAR_COUNT;
  return AVATARS[index];
}
