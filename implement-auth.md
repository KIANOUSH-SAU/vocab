# Authentication Implementation Guide (Create Account)

**Objective**: Implement the full "Create Account" workflow tying together Appwrite Authentication, the custom Appwrite `users` collection, and the local Zustand state.

## 1. Auth Setup Overview
- **Appwrite UI**: Modify `src/app/(onboarding)/auth/signup.tsx`
- **Services**: `src/services/appwrite.ts` (has `account` and `databases` exports)
- **State management**: `src/store/userStore.ts` (has `useUserStore`)
- **Navigation**: `expo-router`

## 2. Step 1: Capture Form State (UI Layer)
In `signup.tsx`, set up React state to capture the user's inputs. 
- Use `useState` hooks for `name`, `email`, `password`, and `confirmPassword`.
- Add an `isLoading` boolean state to disable the button and show a loading indicator during the network request.
- Add an `error` string state to display form validation or API errors.

## 3. Step 2: Input Validation
Before making any API calls when the "Create Account" button is pressed:
- Check that no fields are empty.
- Verify that `password === confirmPassword`.
- Ensure the `password` is at least 8 characters long (Appwrite requirement).
- Set any validation errors to the local `error` state.

## 4. Step 3: Register with Appwrite Auth
When validation passes, call the Appwrite backend:
```javascript
import { account, ID } from '@services/appwrite';

// Create the auth user
const newAccount = await account.create(
  ID.unique(),
  email,
  password,
  name
);
```

## 5. Step 4: Auto-Login (Create Session)
Appwrite requires you to explicitly log the user in after registration to generate an active session token:
```javascript
// Immediately authenticate the new user device
await account.createEmailPasswordSession(email, password);
```

## 6. Step 5: Create the Custom Database Profile
Because the app tracks highly custom metrics like `streak`, `mastery`, `fields`, and `level` (which cannot be stored natively in the auth user object), create a corresponding document in the custom `users` collection.
```javascript
import { databases } from '@services/appwrite';
import { databaseId, usersCollectionId } from '@constants/appwrite'; // Or hardcode/fetch from env depending on your setup

// Create the user document bound strictly to their Auth ID
await databases.createDocument(
  databaseId, 
  usersCollectionId, 
  newAccount.$id, 
  { 
    name, 
    email, 
    streak: 0, 
    level: 'beginner', // Fetch dynamically if you have an onboarding store tracking this
    fields: [] // Same as above
  }
);
```

## 7. Step 6: Sync Global State (Zustand)
Tell the local app that the user is authenticated so it removes all "Guest Gates" and populates their profile.
```javascript
import { useUserStore } from '@store/userStore';

// Assuming inside your component:
const { setUser, setIsGuest } = useUserStore();

// Hydrate state
setUser({ 
  id: newAccount.$id, 
  name, 
  email, 
  level: 'beginner', // Provide fallback or real data
  fields: [] 
});
setIsGuest(false);
```

## 8. Step 7: Route to Home
Dismiss the onboarding flow entirely using `replace` (so the user cannot natively swipe "back" to the auth screen):
```javascript
import { router } from 'expo-router';

router.replace('/(tabs)/home');
```

## Summary Action Item for Claude:
1. Open `signup.tsx`.
2. Wrap the submit button logic in an atomic `try-catch` block handling the sequence: `account.create` -> `account.createEmailPasswordSession` -> `databases.createDocument`.
3. Dispatch state updates to `useUserStore`.
4. Run `router.replace('/(tabs)/home')`.
