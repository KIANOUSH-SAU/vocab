require("dotenv").config();
const { Client, Databases } = require("node-appwrite");

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

async function test() {
  try {
    const doc = await databases.createDocument(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
      "userwords", // Actually let's check the exact ID
      "unique()",
      {
        userId: "testID123",
        wordId: "q_vocab_something",
        status: "learning",
        nextReviewDate: new Date().toISOString(),
        intervalIndex: 0,
        totalAttempts: 0,
        correctAttempts: "0",
      },
    );
    console.log("Success:", doc.$id);
  } catch (err) {
    console.error("Appwrite error:", err);
  }
}
test();
