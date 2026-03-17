import { Client, Databases, Account, ID } from 'react-native-appwrite'

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID

export const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? ''

export const COLLECTIONS = {
  WORDS: 'words',
  USER_WORDS: 'userWords',
  USERS: 'users',
} as const

export { ID }

/** True when all required env vars are present */
export const isAppwriteConfigured =
  Boolean(endpoint) && Boolean(projectId) && Boolean(DB_ID)

// Only initialize the client when env vars are present.
// Import appwriteClient lazily — never call it when isAppwriteConfigured is false.
let _account: Account | null = null
let _databases: Databases | null = null

function getClient(): Client {
  if (!isAppwriteConfigured) {
    throw new Error(
      '[Appwrite] Not configured. Set EXPO_PUBLIC_APPWRITE_ENDPOINT, ' +
        'EXPO_PUBLIC_APPWRITE_PROJECT_ID and EXPO_PUBLIC_APPWRITE_DATABASE_ID in .env'
    )
  }
  const client = new Client().setEndpoint(endpoint!).setProject(projectId!)
  return client
}

export function getAccount(): Account {
  if (!_account) _account = new Account(getClient())
  return _account
}

export function getDatabases(): Databases {
  if (!_databases) _databases = new Databases(getClient())
  return _databases
}

// Convenience re-exports for files that already use named imports
export const account = new Proxy({} as Account, {
  get: (_, prop) => (getAccount() as unknown as Record<string | symbol, unknown>)[prop],
})
export const databases = new Proxy({} as Databases, {
  get: (_, prop) => (getDatabases() as unknown as Record<string | symbol, unknown>)[prop],
})
