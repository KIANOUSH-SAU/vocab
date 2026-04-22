# Auth Implementation Tasks

Please execute the following authentication roadmap sequentially, strictly adhering to the project's architecture (`CLAUDE.md` and the existing `.claude` configuration).

## 1. Onboarding Screen UI Updates (`src/app/(onboarding)/index.tsx`)
- **Social Auth Buttons:** Add two new buttons for "Continue with Google" and "Continue with Apple". Use appropriate icons from the design system.
- **Dynamic Main CTA Button:** 
  - Modify the existing primary button text based on user history:
    - First-time user: `"Create an account"`
    - Returning user: `"Go to your account"`
  - **Navigation:** Update the `onPress` functionality so clicking this button navigates to a dedicated Email/Password Auth screen (you will need to scaffold a new route for this, e.g., `src/app/(auth)/login.tsx`).

## 2. Full Appwrite Authentication Implementation
- **Email & Password Flow:** Scaffold the necessary UI screens and implement a complete sign-up and login flow using Appwrite's Email/Password authentication.
- **OAuth Flow:** Implement the business logic for Google and Apple OAuth logins utilizing Appwrite's `account.createOAuth2Session` methods.
- **Service & Store Integration:** 
  - Abstract all raw Appwrite authentication calls into `src/services/appwriteService.ts`.
  - Ensure the resulting session and user profile data are properly synced to Zustand via `src/store/userStore.ts`.
  - Handle loading, error states, and session persistence robustly.
