export const ADMIN_USER_IDS = [
  "user_2nKMOf6hWjwXRhvspf1khf0NOSc",
  "user_2nmQLK32pORSbgMDL2Sv5lIvLEv",
] as const;

export function isAdmin(userId: string | null | undefined) {
  return ADMIN_USER_IDS.some((adminUserId) => adminUserId === userId);
}
