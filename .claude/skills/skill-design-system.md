# Skill: Design System Enforcer

> **Auto-trigger:** Activate this skill whenever creating, modifying, or reviewing any UI component, screen, or styled element in the Vocab App.

---

## Purpose

Ensure every piece of UI code produced for the Vocab App strictly follows the design system defined in `DESIGN-SYSTEM.md`. This skill is the bridge between the design spec and actual React Native code.

## When This Skill Activates

- Creating a new component or screen
- Modifying an existing component's styles
- Reviewing a PR that touches `src/components/`, `src/constants/theme`, or any screen in `app/`
- Answering questions about "how should X look" or "what color/font/spacing should I use"

## Pre-Flight Checklist

Before writing ANY styled code, confirm:

1. **Read `DESIGN-SYSTEM.md`** — it is the single source of truth. If there's a conflict between this skill and the design system doc, the doc wins.
2. **Check if a theme constant already exists** in `src/constants/` for the value you need.
3. **Check if a similar component already exists** in `src/components/` before creating a new one.

## Rules (Non-Negotiable)

### Colors

- NEVER use raw hex codes inline. Always reference theme tokens.
- Background is `#FAFAF8` (warm cream), NOT `#FFFFFF` or `#F9FAFB`.
- Primary accent is `iris` (`#7C5CFC`), not indigo, not blue.
- CTA buttons use `ink` (#18181B) background, NOT `iris`. Iris is for selected/active states.
- Semantic colors are fixed: `mint` = success/mastered, `coral` = error/skipped, `amber` = warning/learning, `sky` = info.

### Typography

- **Three font families, three roles. No exceptions:**
  - `DM Serif Display` → Display text only (word on card, screen title, logo)
  - `Space Grotesk` → All UI text (buttons, labels, body, nav)
  - `JetBrains Mono` → Data text only (phonetics, timers, counters, level codes)
- Never use DM Serif for buttons or body text.
- Never use Space Grotesk for phonetic transcriptions.
- Uppercase labels always have `letterSpacing: 1.5`.

### Spacing & Radii

- Use the defined spacing scale: 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56.
- Card radius: 20px. Button/option radius: 14px. Badge radius: 8px. Pill radius: 100px.

### Animations

- Prefer `withSpring` for interactive elements (buttons, cards, selections).
- Use `withTiming` only for determinate animations (progress bars, shimmer, path draw).
- Use the predefined spring configs from `DESIGN-SYSTEM.md` Section 5.1.
- Card flip uses `bouncy` spring. Button press uses `snappy` spring. Layout transition uses `gentle` spring.

### Component Patterns

- Word cards must have the serif/mono/sans triple typography.
- Flashcard stack must show 3 layers with scaling (1.0, 0.94, 0.88).
- Quiz options must include a letter badge (A/B/C/D) with correct/wrong states (green checkmark / red X).
- Status badges use semantic soft colors (e.g., `mint-soft` bg + `#059669` text for "Mastered").
- **AccentBlob**: Uses SVG path morphing via `react-native-svg` + `useAnimatedProps`. 4 organic bezier keyframes, 8-11s ping-pong cycle, opacity 0.25. Props: `placement`, `colorTheme`, `size`.
- **AnimatedFire** (`src/components/ui/AnimatedFire.tsx`): Multi-layer SVG fire with 4 animated flame paths + ellipse core + 5 ember particles. Used in StreakWidget on Home screen.
- **TabBar**: Full-width frosted glass (`expo-blur`) bottom bar. Per-tab theme colors: Home=#8B5CF6, Learn=#10B981, Review=#F59E0B, Stats=#0EA5E9. Active state: indicator bar + translateY -2 + scale 1.15.
- **Quiz Screen**: Gradient bg (#F5F0FF → bg), shimmer progress bar, gradient top strip on question card, confetti burst on correct (28 particles), shake on wrong, then reveal correct.
- **Stat Cards**: SVG stroke icons (flame, circle-check, graduation-cap, clock) with semantic bg tints. NO emojis.
- **Activity Chart**: Single mint gradient bar per day with glass shine overlay. Staggered height animation on mount (`withDelay(index * 80)`). Inactive days show 4px stub at 0.4 opacity.

## When Merging with Existing Styles

If the project already has a theme or styled components:

1. **Audit first.** List all existing color/font/spacing tokens.
2. **Map, don't replace.** Create a migration table: old token → new token.
3. **Update the theme file** to include all design system tokens.
4. **Refactor gradually.** Don't change every file at once. Prioritize: theme constants → shared components → screens.
5. **Preserve any existing animation hooks.** The design system animations should augment, not replace custom hooks (per Architecture Rule about isolated component-level hooks).

## Output Format

When creating a new component, always structure it as:

```
src/components/[ComponentName]/
├── index.tsx           ← The component
├── styles.ts           ← StyleSheet or NativeWind classes
└── animations.ts       ← Reanimated hooks/configs (if animated)
```

## Quick Reference

```
IRIS:     #7C5CFC    MINT:     #2DD4A8    CORAL:    #FB7185
AMBER:    #FBBF24    SKY:      #38BDF8    INK:      #18181B
BG:       #FAFAF8    BORDER:   #E4E4E7    CARD:     #FFFFFF

SERIF:    DM Serif Display   → Word display, titles
SANS:     Space Grotesk      → Everything UI
MONO:     JetBrains Mono     → Phonetics, timers, data

SPRING (snappy):  { damping: 15, stiffness: 150 }
SPRING (bouncy):  { damping: 12, stiffness: 180, mass: 0.8 }
SPRING (gentle):  { damping: 20, stiffness: 100 }
```
