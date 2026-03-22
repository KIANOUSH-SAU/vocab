# Pending Tasks & Technical Debt

This file tracks the required back-end wirings and functional integrations for the UI components that are currently mocked or stubbed.

### Home Screen Dashboard
- [ ] **Data Wiring (Dopamine Zone):** Swap out the static `MOCK_PROGRESS` data in `src/app/(tabs)/home.tsx` with live queries mapped directly to `userStore` and Appwrite.
  - Establish a query to track `sessionsCompleted` logic.
  - Compute the exact `wordsMastered` metrics dynamically from the `userWords` collection where `status = 'mastered'`.

### Mini-Modules
- [ ] **Pronounce like a Pro:** Build out the interactive audio evaluation engine in `src/app/modules/pronunciation.tsx`.
- [ ] **Letters Overseas:** Build out the context-heavy email simulation engine in `src/app/modules/letters.tsx`.

### Learn Screen (Action Hub)
- [ ] **Daily Stack Data:** Connect the 3D Daily Stack to the Appwrite `userWords` collection (where `status = 'new'`).
- [ ] **Spaced Repetition Queue:** Query the exact count of words where `nextReviewDate` is past due and inject it into the `expo-linear-gradient` review block.
- [ ] **Word of the Day:** Replace the stunning hardcoded mockup with a randomized premium word fetch from the global `words` collection filtered by the user's selected fields.
- [ ] **Learning Engine:** Build out the actual spaced-repetition logic inside the new placeholder screen `src/app/learning/session.tsx`.

### Review Screen (Mastery Vault)
- [ ] **Library Data Integration:** Fetch and map all matching `userWords` joined with their `words` dictionary data into the global `FlatList`.
- [ ] **Mastery Level Engine:** Wire the 5-bar `MasteryMeter` component visually to the dynamic `intervalIndex` and `correctAttempts` data block logic pulled from the unified user storage.

### Stats & Profile Screen
- [ ] **Data Aggregation:** Write an Appwrite/Zustand aggregator function to replace `MOCK_STATS`. This must parse the unified `userWords` collection to calculate the user's global "Accuracy Rate", "Total Words Embedded", and 7-day trailing activity.
