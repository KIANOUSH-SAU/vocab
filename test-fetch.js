require("dotenv").config();
const { Client, Databases, Query } = require("node-appwrite");

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

async function testFetch() {
  try {
    const response = await databases.listDocuments(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
      "words",
      [Query.equal("level", "B1")],
    );
    console.log("Total words for B1:", response.documents.length);
    if (response.documents.length > 0) {
      console.log("Sample fields:", response.documents[0].fields);
    }
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

testFetch();
