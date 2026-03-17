# Rules — src/components/

## Structure
```
components/
├── ui/          Atoms — Button, Text, Badge, Input, Icon, Skeleton
├── cards/       Word cards — DailyWordCard, SwipeCard, WordDetailCard
├── exercises/   Exercise types (see exercises/CLAUDE.md)
└── charts/      Stats/progress visuals
```

## Every Component Must
- Use **named export** (no default exports)
- Define a `Props` interface at the top
- Use `StyleSheet.create` — no inline styles except dynamic values (e.g. animated styles)
- Have a one-line JSDoc comment above the function

## No Logic Rule
Components are purely presentational. If you find yourself writing:
- `useState` for anything beyond local UI state (open/closed, focused) → move to a hook
- `useEffect` for data fetching → move to a hook
- Business calculations → move to `src/utils/`

## Animation Rules
- Use `react-native-reanimated` — `useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`
- Never use `Animated` from `react-native` core
- Wrap gesture handlers with `GestureDetector` from `react-native-gesture-handler`

## Design System Tokens (use these, don't hardcode hex values inline)
Import from `src/constants/theme.ts`:
- `colors.background`, `colors.surface`, `colors.elevated`
- `colors.textPrimary`, `colors.textSecondary`, `colors.textMuted`
- `colors.fields.engineering`, `colors.fields.health`, etc.
- `spacing[4]`, `spacing[8]`, `spacing[16]`, etc.
- `radii.card`, `radii.pill`, etc.

## Accessibility
- All touchable elements need `accessibilityLabel`
- Minimum touch target: 44×44pt
- Text contrast ratio: minimum 4.5:1 against background
