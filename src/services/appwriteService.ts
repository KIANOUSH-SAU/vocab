import { Client, Databases, Account, ID, Storage } from "react-native-appwrite";

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

export const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? "";

export const COLLECTIONS = {
  WORDS: "words",
  USER_WORDS: "userwords",
  USERS: "users",
} as const;

// Bucket IDs come from the environment so the same code works across dev /
// staging / prod projects without rebuilding. Falls back to "avatars" if unset.
export const AVATARS_BUCKET_ID =
  process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID ?? "avatars";

export const BUCKETS = {
  AVATARS: AVATARS_BUCKET_ID,
} as const;

export { ID };

/** True when all required env vars are present */
export const isAppwriteConfigured =
  Boolean(endpoint) && Boolean(projectId) && Boolean(DB_ID);

// Only initialize the client when env vars are present.
// Single shared client instance — Account and Databases must share the same
// client so that session cookies/tokens are consistent across auth + DB calls.
let _client: Client | null = null;
let _account: Account | null = null;
let _databases: Databases | null = null;
let _storage: Storage | null = null;

function getClient(): Client {
  if (_client) return _client;
  if (!isAppwriteConfigured) {
    throw new Error(
      "[Appwrite] Not configured. Set EXPO_PUBLIC_APPWRITE_ENDPOINT, " +
        "EXPO_PUBLIC_APPWRITE_PROJECT_ID and EXPO_PUBLIC_APPWRITE_DATABASE_ID in .env",
    );
  }
  _client = new Client().setEndpoint(endpoint!).setProject(projectId!);
  return _client;
}

export function getAccount(): Account {
  if (!_account) _account = new Account(getClient());
  return _account;
}

export function getDatabases(): Databases {
  if (!_databases) _databases = new Databases(getClient());
  return _databases;
}

export function getStorage(): Storage {
  if (!_storage) _storage = new Storage(getClient());
  return _storage;
}

// Convenience re-exports for files that already use named imports
export const account = new Proxy({} as Account, {
  get: (_, prop) =>
    (getAccount() as unknown as Record<string | symbol, unknown>)[prop],
});
export const databases = new Proxy({} as Databases, {
  get: (_, prop) =>
    (getDatabases() as unknown as Record<string | symbol, unknown>)[prop],
});

// --- Auth Functions ---

/** Create new email/password account, then create session */
export async function signUp(email: string, password: string, name: string) {
  const acc = getAccount();
  await acc.create(ID.unique(), email, password, name);
  return acc.createEmailPasswordSession(email, password);
}

/** Login with existing email/password */
export async function login(email: string, password: string) {
  return getAccount().createEmailPasswordSession(email, password);
}

/** Get the current logged-in user. Returns null if no valid session. */
export async function getCurrentSession() {
  try {
    return await getAccount().get();
  } catch {
    return null;
  }
}

/** Logout — delete current session */
export async function logoutSession() {
  return getAccount().deleteSession("current");
}

/** Update the auth account's display name. */
export async function updateAccountName(name: string) {
  return getAccount().updateName(name);
}

/**
 * Update the auth account's email. Appwrite requires the user's current
 * password as a security check.
 */
export async function updateAccountEmail(email: string, password: string) {
  return getAccount().updateEmail(email, password);
}

/** OAuth login (Google). Uses deep link scheme "vocab" */
export function oauthLogin(provider: "google") {
  return getAccount().createOAuth2Session(
    provider as any,
    "vocab://auth/callback",
    "vocab://auth/failure",
  );
}

/** Create a user profile document in Appwrite DB */
export async function createUserDocument(
  userId: string,
  userData: {
    name: string;
    email: string;
    level: string;
    voiceStyleId: string;
    streak?: number;
    lastActiveDate?: string | null;
    avatarFileId?: string | null;
    sessionDates?: string[];
  },
) {
  return getDatabases().createDocument(DB_ID, COLLECTIONS.USERS, userId, {
    ...userData,
    streak: userData.streak ?? 0,
    lastActiveDate: userData.lastActiveDate ?? null,
    avatarFileId: userData.avatarFileId ?? null,
    sessionDates: userData.sessionDates ?? [],
  });
}

/** Get a user profile document from Appwrite DB */
export async function getUserDocument(userId: string) {
  try {
    const doc = await getDatabases().getDocument(
      DB_ID,
      COLLECTIONS.USERS,
      userId,
    );
    return doc;
  } catch {
    return null;
  }
}

/** Update an existing user profile document */
export async function updateUserDocument(
  userId: string,
  updates: Partial<{
    name: string;
    email: string;
    level: string;
    voiceStyleId: string;
    streak: number;
    lastActiveDate: string | null;
    avatarFileId: string | null;
    sessionDates: string[];
  }>,
) {
  const payload: any = { ...updates };
  return getDatabases().updateDocument(
    DB_ID,
    COLLECTIONS.USERS,
    userId,
    payload,
  );
}

// --- Storage helpers (avatars) ---

/**
 * Upload an avatar image to the `avatars` bucket and return the file ID.
 * Pass the local file URI returned by expo-image-picker.
 */
export async function uploadAvatarFile(args: {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}): Promise<string> {
  const storage = getStorage();
  const file = {
    uri: args.uri,
    name: args.name,
    type: args.mimeType,
    size: args.size,
  };
  const created = await storage.createFile(BUCKETS.AVATARS, ID.unique(), file);
  return created.$id;
}

/** Public view URL for an avatar file. Safe to embed directly in <Image src>. */
export function getAvatarUrl(fileId: string): string {
  if (!endpoint || !projectId) return "";
  return `${endpoint}/storage/buckets/${BUCKETS.AVATARS}/files/${fileId}/view?project=${projectId}`;
}

/** Best-effort delete — caller should not block on failures. */
export async function deleteAvatarFile(fileId: string): Promise<void> {
  try {
    await getStorage().deleteFile(BUCKETS.AVATARS, fileId);
  } catch {
    // ignore — avatar bucket cleanup is non-critical
  }
}

/** Migrate local userWords to Appwrite */
export async function migrateProgressToServer(
  userId: string,
  userWords: Record<string, Record<string, unknown>>,
) {
  const db = getDatabases();
  const promises = Object.values(userWords).map((uw) =>
    db.createDocument(DB_ID, COLLECTIONS.USER_WORDS, ID.unique(), {
      ...uw,
      userId,
    }),
  );
  return Promise.allSettled(promises);
}
