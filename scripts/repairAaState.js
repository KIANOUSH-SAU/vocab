/* eslint-disable no-console */
require("dotenv").config();
const { Client, Databases, Query } = require("node-appwrite");

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const apiKey = process.env.APPWRITE_API_KEY;

const TODAY = "2026-05-06"; // currentDate per the system context

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);
const db = new Databases(client);

(async () => {
  // Clear the false daily-completion state for any user whose lastActiveDate
  // is "today" but who likely never actually finished a session, then let
  // them re-sync from the freshly fixed app.
  const users = await db.listDocuments(databaseId, "users", [Query.limit(50)]);
  for (const u of users.documents) {
    if (u.lastActiveDate !== TODAY) continue;

    const cleanedSessionDates = (Array.isArray(u.sessionDates)
      ? u.sessionDates
      : []
    ).filter((d) => d !== TODAY);

    // Streak only counts if yesterday or today was active. After we drop
    // today, the most recent date governs the new streak. If there's no
    // adjacent recent activity, reset to 0.
    let newStreak = 0;
    if (cleanedSessionDates.length > 0) {
      const sorted = [...cleanedSessionDates].sort();
      const last = sorted[sorted.length - 1];
      const lastDate = new Date(last + "T00:00:00");
      const yest = new Date(TODAY + "T00:00:00");
      yest.setDate(yest.getDate() - 1);
      const yesterdayStr = yest.toISOString().slice(0, 10);
      newStreak = last === yesterdayStr ? Number(u.streak) || 0 : 0;
    }

    console.log(
      `[repair] user=${u.$id} (${u.name}) lastActiveDate ${u.lastActiveDate} -> ${
        cleanedSessionDates[cleanedSessionDates.length - 1] ?? null
      }, sessionDates ${JSON.stringify(u.sessionDates)} -> ${JSON.stringify(
        cleanedSessionDates,
      )}, streak ${u.streak} -> ${newStreak}`,
    );

    await db.updateDocument(databaseId, "users", u.$id, {
      lastActiveDate:
        cleanedSessionDates[cleanedSessionDates.length - 1] ?? null,
      sessionDates: cleanedSessionDates,
      streak: newStreak,
    });
  }

  console.log("[repair] done");
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
