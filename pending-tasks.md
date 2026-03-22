# Pending Tasks & Technical Debt

This file tracks the required back-end wirings and functional integrations for the UI components that are currently mocked or stubbed.

### Home Screen Dashboard
- [ ] **Data Wiring (Dopamine Zone):** Swap out the static `MOCK_PROGRESS` data in `src/app/(tabs)/home.tsx` with live queries mapped directly to `userStore` and Appwrite.
  - Establish a query to track `sessionsCompleted` logic.
  - Compute the exact `wordsMastered` metrics dynamically from the `userWords` collection where `status = 'mastered'`.

### Mini-Modules
- [ ] **Pronounce like a Pro:** Build out the interactive audio evaluation engine in `src/app/modules/pronunciation.tsx`.
- [ ] **Letters Overseas:** Build out the context-heavy email simulation engine in `src/app/modules/letters.tsx`.
