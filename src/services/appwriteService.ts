import { Client, Databases, Account, ID } from "react-native-appwrite";

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

export const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? "";

export const COLLECTIONS = {
  WORDS: "words",
  USER_WORDS: "userWords",
  USERS: "users",
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
    fields: string[];
    voiceStyleId: string;
  },
) {
  return getDatabases().createDocument(DB_ID, COLLECTIONS.USERS, userId, userData);
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
    fields: string[];
    voiceStyleId: string;
  }>,
) {
  return getDatabases().updateDocument(
    DB_ID,
    COLLECTIONS.USERS,
    userId,
    updates,
  );
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
