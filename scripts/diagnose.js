/* eslint-disable no-console */
require("dotenv").config();
const { Client, Databases, Query } = require("node-appwrite");

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const apiKey = process.env.APPWRITE_API_KEY;

console.log("\n=== Appwrite env ===");
console.log("endpoint :", endpoint);
console.log("project  :", projectId);
console.log("database :", databaseId);
console.log("api key  :", apiKey ? `present (${apiKey.length} chars)` : "MISSING");

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const db = new Databases(client);

async function countByLevel(level) {
  const r = await db.listDocuments(databaseId, "words", [
    Query.equal("level", level),
    Query.limit(1),
  ]);
  return r.total;
}

(async () => {
  try {
    console.log("\n=== Words per CEFR level ===");
    for (const lvl of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
      try {
        const t = await countByLevel(lvl);
        console.log(`  ${lvl}: ${t}`);
      } catch (e) {
        console.log(`  ${lvl}: ERROR ${e.message}`);
      }
    }

    console.log("\n=== Sample word doc ===");
    const sample = await db.listDocuments(databaseId, "words", [
      Query.limit(1),
    ]);
    if (sample.documents.length) {
      const w = sample.documents[0];
      console.log({
        id: w.$id,
        word: w.word,
        level: w.level,
        usabilityScore: w.usabilityScore,
        partOfSpeech: w.partOfSpeech,
      });
    } else {
      console.log("  no word docs at all");
    }

    console.log("\n=== Users collection ===");
    const users = await db.listDocuments(databaseId, "users", [
      Query.limit(10),
    ]);
    console.log(`  total users: ${users.total}`);
    for (const u of users.documents) {
      console.log({
        id: u.$id,
        name: u.name,
        email: u.email,
        level: u.level,
        streak: u.streak,
        lastActiveDate: u.lastActiveDate,
        sessionDates: u.sessionDates,
      });
    }

    console.log("\n=== UserWords sample ===");
    const userwords = await db.listDocuments(databaseId, "userwords", [
      Query.limit(20),
      Query.orderDesc("$createdAt"),
    ]);
    console.log(`  total: ${userwords.total}`);
    for (const uw of userwords.documents) {
      console.log({
        userId: uw.userId,
        wordId: uw.wordId,
        status: uw.status,
        nextReviewDate: uw.nextReviewDate,
        intervalIndex: uw.intervalIndex,
      });
    }
  } catch (e) {
    console.error("FATAL:", e.message, e.code, e.type);
  }
})();
