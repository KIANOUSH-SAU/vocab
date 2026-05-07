/* eslint-disable no-console */
require("dotenv").config();
const { Client, Databases, Query } = require("node-appwrite");

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const db = new Databases(client);
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

const AA_ID = "69e92ac10024835e4968";

(async () => {
  const userwords = await db.listDocuments(databaseId, "userwords", [
    Query.equal("userId", AA_ID),
    Query.limit(500),
  ]);
  console.log(`Aa userWords count: ${userwords.total}`);
  for (const uw of userwords.documents) {
    console.log({
      wordId: uw.wordId,
      status: uw.status,
      nextReviewDate: uw.nextReviewDate,
      intervalIndex: uw.intervalIndex,
    });
  }

  // Check which of these wordIds actually exist in the words collection
  console.log("\nValidating word existence...");
  let validCount = 0;
  let invalidCount = 0;
  const invalidIds = [];
  for (const uw of userwords.documents) {
    try {
      await db.getDocument(databaseId, "words", uw.wordId);
      validCount++;
    } catch (e) {
      invalidCount++;
      invalidIds.push(uw.wordId);
    }
  }
  console.log(`Valid: ${validCount}, Invalid (orphan): ${invalidCount}`);
  if (invalidIds.length) console.log("Orphan wordIds:", invalidIds);

  // Check what level those valid words are
  console.log("\nLevel distribution of valid userWords:");
  const levelCounts = {};
  for (const uw of userwords.documents) {
    try {
      const w = await db.getDocument(databaseId, "words", uw.wordId);
      levelCounts[w.level] = (levelCounts[w.level] || 0) + 1;
    } catch {}
  }
  console.log(levelCounts);
})().catch((e) => console.error(e));
