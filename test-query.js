require("dotenv").config();
const { Client, Databases, Query } = require("node-appwrite");

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

async function testFetch() {
  try {
    const q = Query.contains("fields", ["engineering", "health"]);
    console.log("Query string:", q);
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

testFetch();
