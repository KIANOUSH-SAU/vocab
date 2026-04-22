# Vocab: Core Design Principles

This document serves as the "source of truth" for the overall aesthetic, theming, and structure of the Vocab application. Keep these principles in mind when adding new features or screens to maintain the highly-polished, "high-dopamine" editorial feel.

---

## 1. Typography (The "Editorial" Look)

The app leans heavily on a magazine-like typography mix to feel sophisticated rather than like a standard utility app.

- **Serif Headings (`DM Serif Display`)**: Used _only_ for giant, impactful titles (e.g., "Create your account", "Pick your field", the user's name on the Stats page). Should have tight letter spacing (`-0.5` or `-1`) to look custom.
- **Sans-Serif (`Space Grotesk`)**: The primary workhorse font. Used for everything from body text to button labels (`sansMedium` / `sansSemiBold`) and tiny capitalized labels.
- **Monospace (`JetBrains Mono`)**: Used sparingly for technical/data-driven microcopy (e.g., A1/B2 Level Badges, graph X-axis labels).

---

## 2. Color Palette & Section Theming

Instead of relying on a single brand color, the app uses a **color-coding system** where each main tab/functional area has its own visual identity.

- **Iris / Purple (`#8B5CF6`) - The "Brand" Theme**: Used on the Home tab, onboarding, and general primary buttons.
- **Mint / Green (`#10B981`) - The "Learn" Theme**: Used on the Learn tab. Signifies growth, starting new modules, and the "Mastered" status.
- **Amber / Orange (`#F59E0B`) - The "Review" Theme**: Used on the Review tab. Signifies active studying, warnings, and the "Learning" status.
- **Sky / Blue (`#0EA5E9`) - The "Stats" Theme**: Used on the Stats tab. Represents analytics, locked content, and data.
- **Coral / Red (`#EF4444`) - Destructive**: Used strictly for errors, "Struggling" status, and logging out.

**Neutral/Structural Colors**:

- `bg` (`#FAFAFA`): The overall off-white app background.
- `card` (`#FFFFFF`): Pure white paper-like surfaces.
- `ink` (`#18181B`): Nearly black text for high contrast.
- `ink2` & `inkLight`: Muted grays for subtitles.

---

## 3. Core Component Shapes & Elements

- **Accent Blobs (`<AccentBlob />`)**
  - **What it is:** A fluid, self-distorting organic SVG blob that morphs between 4 bezier-curve keyframes using `react-native-svg` and `react-native-reanimated` animated props. Replaces the old rotating square.
  - **Usage:** Placed absolutely (`top-left`, `top-right`, etc.) in the background of `<View style={styles.section}>` containers.
  - **Rule:** They must be set to `0.25` opacity and their color must exactly match the theme of the current tab (e.g., Blue on Stats, Green on Learn). To avoid clutter, **alternate their placement** (Left, Right, Left) as you scroll down a page. The blob uses `pointerEvents: 'none'` and SVG path interpolation for smooth organic motion.
- **Section Labels (`<SectionLabel />`)**
  - **What it is:** The "Digital Dictionary" header. Formatted with a light grey slash and solid black text (e.g., `<span style="color: gray">/</span> OVERVIEW`).
  - **Usage:** Replaces bulky, boxed-in titles. It float freely above grids and lists to look clean and editorial.
- **Cards & Buttons**
  - **Cards:** Thick borders (`borderWidth: 2`) with `colors.border`, large border radii (`radii.lg` = 16px), and subtle structural drop shadows (`shadows.sm`).
  - **Primary Buttons:** Deep, dark, high-contrast linear gradients (`colors.ink` to `#27272A`) with stark white text to look premium against the off-white background.

---

## 4. Animations & Micro-Interactions

We use `react-native-reanimated` heavily to make the app feel alive.

- **Entrance Staggering:** Lists (like the Fields selector or Module cards) slide up (`translateY`) from the bottom while fading in (`opacity: 0 -> 1`). The items must stagger (`withDelay(index * 80)`) to create a cascading entrance.
- **Press States:** Interactive cards and buttons should use `withSpring` to smoothly shrink (`scale: 0.98`) when pressed and expand slightly (`scale: 1.02`) when selected.
- **Environmental Ambiance:** The `AccentBlob` background shapes morph between organic SVG blob keyframes using `useAnimatedProps` on the UI thread over 8-11 seconds (ping-pong) to give the screen a fluid "breathing" effect.
- **Streak Fire:** The streak widget uses a multi-layer animated SVG fire (4 flame layers + core ellipse) with ember particles that float upward, replacing the old emoji.
- **Quiz Confetti:** On correct answer, 28 confetti particles burst from top-center with random drift, rotation, and fade-out.
- **Quiz Shimmer:** The progress bar has a translucent white shimmer that slides continuously across the gradient fill.
- **Chart Bars:** Activity chart bars animate from 4px to their target height with staggered delays on mount.

---

## 5. Layout Structure (The Skeleton)

Every main scrollable screen follows this exact nested skeleton:

```tsx
<MaxWidthContainer>
  {" "}
  // Clamps width on iPad/Web
  <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header (Titles, Back buttons) */}
      <View style={styles.header}> ... </View>

      {/* 2. Content Sections (Alternating blobs!) */}
      <View style={[styles.section, { position: "relative" }]}>
        <AccentBlob placement="top-left" colorTheme="green" />
        <SectionLabel title="QUICK MODULES" />
        {/* ... section content grid ... */}
      </View>

      <View style={[styles.section, { position: "relative" }]}>
        <AccentBlob placement="bottom-right" colorTheme="green" />
        <SectionLabel title="DAILY VOCAB" />
        {/* ... section content list ... */}
      </View>
    </ScrollView>
  </SafeAreaView>
</MaxWidthContainer>
```
