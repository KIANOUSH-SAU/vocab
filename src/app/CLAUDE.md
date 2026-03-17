# Rules — src/app/ (Expo Router Screens)

All files here are Expo Router screens. Follow these rules strictly.

## File & Export Rules
- Every screen file must have a **default export** (Expo Router requirement)
- Named exports are allowed for types/constants only
- Route groups use parentheses: `(auth)`, `(tabs)`, `(onboarding)`

## Screen Structure (in order)
1. Imports
2. Local types (if any)
3. Default export component
4. `StyleSheet.create` at the bottom

## Every Screen Must Have
- `SafeAreaView` as root from `react-native-safe-area-context`
- `Stack.Screen` options block with a title
- Background color `#0D0D0D`

## No Logic in Screens
- No API calls directly in screens
- No complex state — use Zustand stores via hooks
- No computations — extract to `src/utils/`
- Data fetching lives in `src/hooks/`

## Navigation
- Use `router.push()` / `router.replace()` from `expo-router`
- Never use `navigation.navigate()` (React Navigation style)
- Auth guard: check `userStore.isGuest` or `userStore.isAuthenticated` at screen level

## Loading & Error States
Every screen that fetches data must handle:
- Loading: show a skeleton or spinner
- Error: show an error message with retry option
- Empty: show a meaningful empty state
