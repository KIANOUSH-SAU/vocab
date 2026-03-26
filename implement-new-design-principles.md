# Vocab v2: Implementation Guide for New Design Changes

> **CRITICAL RULE:** This document describes exactly 5 targeted changes. Everything else in the app — the splash screen, login/signup pages, "Pick your field" screen, onboarding flow, font choices, color palette, `<SectionLabel />`, `<MaxWidthContainer />`, card borders, button styles, primary CTA gradients — must remain **completely untouched**. If a component, style, or animation is not explicitly mentioned below, **do not modify it**.

---

## Table of Contents

1. [Change 1: Quiz Screen Redesign](#change-1-quiz-screen-redesign)
2. [Change 2: Tab Bar Redesign](#change-2-tab-bar-redesign)
3. [Change 3: Streak Widget Redesign](#change-3-streak-widget-redesign)
4. [Change 4: AccentBlob → Fluid Morphing Blob](#change-4-accentblob--fluid-morphing-blob)
5. [Change 5: Stats Page Refinements](#change-5-stats-page-refinements)
6. [Shared Dependencies & Notes](#shared-dependencies--notes)

---

## Change 1: Quiz Screen Redesign

**Goal:** Transform the quiz from dull and soulless → vibrant, encouraging, and playful. Not cartoonish — celebratory and polished.

**Files likely affected:** The quiz/question screen component and its stylesheet only.

### 1.1 Screen Background

Change the quiz screen background from flat `colors.bg` (`#FAFAFA`) to a subtle vertical gradient:

```
backgroundColor: undefined  // remove flat bg
// Apply LinearGradient as the screen wrapper:
<LinearGradient colors={['#F5F0FF', colors.bg]} start={{x:0,y:0}} end={{x:0,y:1}}>
```

This gives the quiz a very faint lavender-to-white wash. Subtle, not distracting.

### 1.2 Progress Bar — Add Shimmer Effect

The current progress bar is a static colored fill. Add a shimmer animation:

**Structure:**

```tsx
<View style={styles.progressTrack}>
  <View style={[styles.progressFill, { width: `${progress}%` }]}>
    <Animated.View style={[styles.progressShimmer, shimmerAnimatedStyle]} />
  </View>
</View>
```

**Styles:**

```ts
progressTrack: {
  height: 8,
  backgroundColor: colors.border,   // #E4E4E7
  borderRadius: 4,
  overflow: 'hidden',
  marginVertical: 16,
},
progressFill: {
  height: '100%',
  borderRadius: 4,
  // Use LinearGradient inside: colors={['#8B5CF6', '#C4B5FD']} horizontal
  overflow: 'hidden',
  position: 'relative',
},
progressShimmer: {
  ...StyleSheet.absoluteFillObject,
  // This is animated via translateX
},
```

**Animation (Reanimated):**

```ts
const shimmerTranslate = useSharedValue(-1);

useEffect(() => {
  shimmerTranslate.value = withRepeat(
    withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
    -1, // infinite
    false, // no reverse
  );
}, []);

const shimmerAnimatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: shimmerTranslate.value * 200 }],
  // Render as a LinearGradient: colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
  // width: 200, height: '100%'
}));
```

The shimmer is a translucent white gradient that slides across the progress fill continuously.

### 1.3 Question Counter — Size Reduction

Reduce the question counter text sizes. Current sizes are too large for a phone mockup:

```ts
counterNumber: {
  fontFamily: fonts.serif,        // DM Serif Display
  fontSize: 22,                   // WAS ~28, NOW 22
  letterSpacing: -0.5,
},
counterTotal: {
  fontFamily: fonts.sans,         // Space Grotesk
  fontSize: 13,                   // WAS ~16, NOW 13
  fontWeight: '300',
  color: colors.inkLight,         // #A1A1AA
},
```

### 1.4 Question Card — Gradient Top Strip

Add a thin 3px gradient strip to the top of the question card:

```tsx
<View style={styles.questionCard}>
  <LinearGradient
    colors={["#8B5CF6", "#C4B5FD", "#10B981"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.questionCardStrip}
  />
  <Text style={styles.questionText}>
    What does <Text style={styles.wordHighlight}>"collaborate"</Text> mean?
  </Text>
</View>
```

**Styles:**

```ts
questionCard: {
  backgroundColor: colors.card,   // #FFFFFF
  borderWidth: 2,
  borderColor: colors.border,     // #E4E4E7
  borderRadius: radii.xl,         // 24
  padding: 18,                    // WAS 24, NOW 18
  marginBottom: 16,               // WAS 20, NOW 16
  position: 'relative',
  overflow: 'hidden',
},
questionCardStrip: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 3,
},
questionText: {
  fontSize: 13,                   // WAS ~15, NOW 13
  color: colors.ink,              // #18181B
  lineHeight: 13 * 1.5,
  fontWeight: '500',
  fontFamily: fonts.sans,
},
wordHighlight: {
  fontFamily: fonts.serif,        // DM Serif Display
  fontSize: 17,                   // WAS ~22, NOW 17
  color: '#6D28D9',              // iris-dark
  // The underline highlight effect:
  // In React Native, simulate with a View wrapper that has a
  // partial background. Or use a Text with backgroundColor
  // covering the bottom 40%:
  // textDecorationLine: 'none' — use a wrapper <View> approach instead.
},
```

**Word Highlight Implementation (React Native):**
Since CSS `background: linear-gradient(180deg, transparent 60%, rgba(...) 60%)` can't be directly replicated on `<Text>`, wrap the highlighted word:

```tsx
<View
  style={{
    position: "relative",
    alignSelf: "flex-start",
    display: "flex",
    flexDirection: "row",
  }}
>
  <Text style={styles.wordHighlight}>"collaborate"</Text>
  <View
    style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "40%",
      backgroundColor: "rgba(139, 92, 246, 0.15)",
      borderRadius: 2,
      zIndex: -1,
    }}
  />
</View>
```

### 1.5 Answer Options — Size Reduction + Interaction States

**Reduce padding and text:**

```ts
optionContainer: {
  backgroundColor: colors.card,
  borderWidth: 2,
  borderColor: colors.border,
  borderRadius: radii.lg,         // 16
  padding: 12,                    // WAS 16, NOW 12
  paddingHorizontal: 16,          // WAS 20, NOW 16
  marginBottom: 8,                // WAS 10, NOW 8
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
},
optionRadio: {
  width: 18,                      // WAS 22, NOW 18
  height: 18,                     // WAS 22, NOW 18
  borderRadius: 9,
  borderWidth: 2,
  borderColor: colors.border,
},
optionText: {
  fontSize: 12,                   // WAS 14, NOW 12
  fontWeight: '500',
  color: colors.ink,
  fontFamily: fonts.sans,
},
```

**Hover/Press state (use `Pressable` + Reanimated):**

On press-in, the option should:

- Slide right by 4px (`translateX: 4`)
- Border color changes to `colors.irisLight` (`#C4B5FD`)
- Gain a subtle purple shadow: `shadowColor: '#8B5CF6', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }`

Use `withSpring` for the translateX.

### 1.6 Correct Answer State

When the user selects the correct answer:

```ts
optionCorrect: {
  borderColor: '#10B981',         // mint
  backgroundColor: undefined,     // use LinearGradient instead
  // LinearGradient: colors={['#ECFDF5', colors.card]} horizontal
  transform: [{ translateX: 4 }, { scale: 1.01 }],
  shadowColor: '#10B981',
  shadowOpacity: 0.15,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 4 },
},
optionCorrectRadio: {
  borderColor: '#10B981',
  backgroundColor: '#10B981',
  // Render a white checkmark (✓) inside, fontSize: 10, fontWeight: '700'
},
```

**Trigger confetti on correct answer.** See Section 1.8.

### 1.7 Wrong Answer State

When the user selects a wrong answer:

```ts
optionWrong: {
  borderColor: '#EF4444',         // coral
  // LinearGradient: colors={['#FEF2F2', colors.card]} horizontal
},
optionWrongRadio: {
  borderColor: '#EF4444',
  backgroundColor: '#EF4444',
  // Render a white ✗ inside, fontSize: 10, fontWeight: '700'
},
```

**Shake animation on wrong:**

```ts
const shakeX = useSharedValue(0);

function triggerWrongShake() {
  shakeX.value = withSequence(
    withTiming(-6, { duration: 80 }),
    withTiming(6, { duration: 80 }),
    withTiming(-4, { duration: 60 }),
    withTiming(4, { duration: 60 }),
    withTiming(0, { duration: 60 }),
  );
}

const shakeStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: shakeX.value }],
}));
```

After showing the wrong state + shake, also highlight the correct option with the green correct state so the user learns.

### 1.8 Confetti on Correct Answer

Install `react-native-confetti-cannon` or implement a lightweight confetti burst.

**Lightweight custom approach using Reanimated:**

Create 25–30 small colored squares/circles that burst from the top-center of the screen, falling downward with rotation, fading to opacity 0.

Confetti colors: `['#8B5CF6', '#10B981', '#F59E0B', '#0EA5E9', '#EF4444', '#FFD700', '#FF6B00']`

Each particle:

- Start: `translateY: -20`, `scale: 0`, `opacity: 1`, `rotate: 0deg`
- End: `translateY: 400`, `scale: 1`, `opacity: 0`, `rotate: 720deg`
- Duration: 1500ms with `Easing.out(Easing.ease)`
- Random `translateX` drift per particle
- Staggered start delay: `Math.random() * 500ms`
- Particle sizes: `width/height: 4–10` (random)
- Shapes: 50% circles (borderRadius: 50%), 50% rounded squares (borderRadius: 2)

Use `pointerEvents="none"` on the confetti container so it doesn't block touches.

### 1.9 Encouragement Footer

Keep the existing footer text ("No right or wrong — just be honest") and its shield icon. No changes.

---

## Change 2: Tab Bar Redesign

**Goal:** Replace the floating pill-shaped tab bar with a full-width, bottom-anchored bar that uses frosted glass and has subtle rounded top corners.

**Files likely affected:** The main tab navigator component and its styles. This is likely a custom `tabBar` prop on your `<Tab.Navigator>`.

### 2.1 Container Shape

**Remove:**

- The pill shape (any `borderRadius` that makes it float as a capsule)
- Any `margin` / `marginHorizontal` that makes it float inward
- Any `bottom` offset that creates a gap between the bar and screen edge

**Apply:**

```ts
tabBarContainer: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  // NO borderRadius on bottom. Only top corners:
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  // Frosted glass:
  backgroundColor: 'rgba(255, 255, 255, 0.85)',
  // Border on top edge only:
  borderTopWidth: 1,
  borderTopColor: 'rgba(228, 228, 231, 0.6)',
  borderLeftWidth: 0,
  borderRightWidth: 0,
  borderBottomWidth: 0,
  // Padding:
  paddingHorizontal: 16,
  paddingTop: 8,
  paddingBottom: Math.max(8, safeAreaInsets.bottom), // respect safe area
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
},
```

### 2.2 Frosted Glass Effect

For the blur/glassmorphism on React Native:

**Option A — `@react-native-community/blur` (iOS + Android):**

```tsx
import { BlurView } from "@react-native-community/blur";

<BlurView
  style={StyleSheet.absoluteFill}
  blurType="light"
  blurAmount={24}
  reducedTransparencyFallbackColor="white"
/>;
```

**Option B — `expo-blur` (if using Expo):**

```tsx
import { BlurView } from "expo-blur";

<BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />;
```

Wrap the tab bar content inside this BlurView so content scrolls underneath with the frosted effect visible.

### 2.3 Tab Item Structure

Each tab item:

```tsx
<Pressable style={styles.tabItem} onPress={onPress}>
  {/* Active indicator bar — only shown when active */}
  {isActive && (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.tabIndicator, { backgroundColor: themeColor }]}
    />
  )}
  <Animated.View
    style={[styles.tabIcon, isActive && { transform: [{ scale: 1.15 }] }]}
  >
    {/* SVG icon — stroke color changes when active */}
    <Icon
      name={iconName}
      size={22}
      strokeWidth={2.5}
      color={isActive ? themeColor : colors.inkLight}
    />
  </Animated.View>
  <Text
    style={[
      styles.tabLabel,
      { color: isActive ? themeColor : colors.inkLight },
    ]}
  >
    {label}
  </Text>
</Pressable>
```

**Styles:**

```ts
tabItem: {
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: radii.md,        // 12
  position: 'relative',
},
tabIndicator: {
  position: 'absolute',
  top: -8,
  width: 24,
  height: 3,
  borderRadius: 1.5,
  // Color is set dynamically per tab (see 2.4)
},
tabIcon: {
  width: 24,
  height: 24,
  alignItems: 'center',
  justifyContent: 'center',
},
tabLabel: {
  fontFamily: fonts.sans,        // Space Grotesk
  fontSize: 10,
  fontWeight: '600',
},
```

### 2.4 Per-Tab Theme Colors

Map each tab route to its theme color for the indicator bar, active icon tint, and active label color:

```ts
const tabThemeColors = {
  Home: "#8B5CF6", // iris
  Learn: "#10B981", // mint
  Review: "#F59E0B", // amber
  Stats: "#0EA5E9", // sky
};
```

### 2.5 Active Tab Animation

When a tab becomes active:

- The tab item lifts by 2px: `transform: [{ translateY: -2 }]`
- The icon scales to 1.15x
- The indicator bar animates width from 0 → 24 via `entering={FadeIn}` or a layout animation

Use `withSpring({ damping: 15, stiffness: 150 })` for the translateY and scale transitions.

### 2.6 Icons

Use stroke-based SVG icons (like Lucide icons) with `strokeWidth: 2.5`. The specific icons per tab:

| Tab    | Icon (Lucide name) |
| ------ | ------------------ |
| Home   | `home` (house)     |
| Learn  | `book-open`        |
| Review | `refresh-cw`       |
| Stats  | `bar-chart-3`      |

These should be consistent with the existing icon set. If you're already using different icons, keep those — just make sure they're stroke-based SVGs, not filled, so the color tinting works cleanly.

---

## Change 3: Streak Widget Redesign

**Goal:** Replace the static fire emoji on the Home screen's streak card with an animated multi-layer SVG flame that has ember particles and a warm glow. The streak should feel like a living fire you're tending.

**Files likely affected:** The streak card/widget component on the Home screen.

### 3.1 Card Background

**Keep** the existing gradient orange card. **Enhance** it with a richer gradient and add a radial inner glow:

```ts
streakCard: {
  borderRadius: radii['2xl'],     // 32
  padding: 28,
  paddingHorizontal: 24,
  position: 'relative',
  overflow: 'hidden',
  // Shadow for depth:
  shadowColor: '#FF6B00',
  shadowOpacity: 0.3,
  shadowRadius: 48,
  shadowOffset: { width: 0, height: 16 },
  elevation: 16,
},
```

**Card gradient:**

```tsx
<LinearGradient
  colors={['#FF8C00', '#FF6B00', '#E85D04']}
  start={{x:0,y:0}} end={{x:1,y:1}}
  style={styles.streakCard}
>
```

**Inner radial glow (pseudo):**
Add an absolutely-positioned radial gradient view at the top-center:

```tsx
<RadialGradient
  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
  colors={["rgba(255,200,50,0.3)", "transparent"]}
  center={[0.5, 0.3]}
  radius={0.6}
/>
```

If `RadialGradient` isn't available, approximate with a blurred circle:

```tsx
<View
  style={{
    position: "absolute",
    top: "10%",
    left: "25%",
    width: "50%",
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: "rgba(255, 200, 50, 0.25)",
    // Use a blur effect or just leave as-is — the soft color is enough
  }}
/>
```

### 3.2 Animated SVG Fire (Replace Emoji)

**Remove** the fire emoji entirely. Replace with an SVG fire component.

**Install `react-native-svg` if not already present.**

Create a new component: `<AnimatedFire size={80} />`

The fire consists of 4 SVG path layers, each animated independently:

```tsx
import Svg, { Path, Ellipse } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

function AnimatedFire({ size = 80 }) {
  // Each layer has its own animation driver
  const mainAnim = useSharedValue(0);
  const leftAnim = useSharedValue(0);
  const rightAnim = useSharedValue(0);
  const innerAnim = useSharedValue(0);

  useEffect(() => {
    mainAnim.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true, // alternate
    );
    leftAnim.value = withRepeat(
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    rightAnim.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    innerAnim.value = withRepeat(
      withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  // Animate via transform on wrapping Animated.View for each layer
  // since animating SVG path `d` directly is complex in RN.
  // Instead, animate scaleY and scaleX on each layer's wrapper.

  const mainStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: interpolate(mainAnim.value, [0, 1], [1, 1.08]) },
      { scaleX: interpolate(mainAnim.value, [0, 1], [1, 0.96]) },
    ],
  }));

  const leftStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(leftAnim.value, [0, 1], [-3, 3])}deg` },
      { scaleY: interpolate(leftAnim.value, [0, 1], [1, 1.1]) },
    ],
  }));

  const rightStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(rightAnim.value, [0, 1], [3, -3])}deg` },
      { scaleY: interpolate(rightAnim.value, [0, 1], [1.05, 0.95]) },
    ],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: interpolate(innerAnim.value, [0, 1], [0.9, 1.1]) },
      { scaleX: interpolate(innerAnim.value, [0, 1], [1.05, 0.95]) },
    ],
    opacity: interpolate(innerAnim.value, [0, 1], [0.8, 1]),
  }));

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 80 80">
        {/* Layer 1: Outer flame */}
        <Animated.View
          style={[{ transformOrigin: "bottom center" }, mainStyle]}
        >
          <Path
            d="M40,70 C25,70 15,55 15,42 C15,28 25,18 32,10 C34,8 36,12 35,16 C34,20 38,14 40,8 C42,14 46,20 45,16 C44,12 46,8 48,10 C55,18 65,28 65,42 C65,55 55,70 40,70 Z"
            fill="#FF6B00"
          />
        </Animated.View>

        {/* Layer 2: Left flicker */}
        <Animated.View
          style={[{ transformOrigin: "bottom center" }, leftStyle]}
        >
          <Path
            d="M35,68 C28,68 22,58 22,48 C22,38 28,30 33,24 C34,23 35,26 34,28 C33,30 36,25 38,20 C38,28 42,38 35,48 C32,52 32,62 35,68 Z"
            fill="#FF8C00"
          />
        </Animated.View>

        {/* Layer 3: Right flicker */}
        <Animated.View
          style={[{ transformOrigin: "bottom center" }, rightStyle]}
        >
          <Path
            d="M45,68 C52,68 58,58 58,48 C58,38 52,30 47,24 C46,23 45,26 46,28 C47,30 44,25 42,20 C42,28 38,38 45,48 C48,52 48,62 45,68 Z"
            fill="#FF8C00"
          />
        </Animated.View>

        {/* Layer 4: Inner core (yellow-gold) */}
        <Animated.View
          style={[{ transformOrigin: "bottom center" }, innerStyle]}
        >
          <Path
            d="M40,68 C34,68 30,60 30,52 C30,44 34,38 37,32 C38,31 39,34 38,36 C37,38 40,34 40,28 C40,34 43,38 42,36 C41,34 42,31 43,32 C46,38 50,44 50,52 C50,60 46,68 40,68 Z"
            fill="#FFD700"
          />
        </Animated.View>

        {/* Layer 5: Hottest core (white-yellow ellipse) */}
        <Ellipse cx="40" cy="58" rx="6" ry="8" fill="#FFF3C4" opacity={0.7} />
      </Svg>
    </View>
  );
}
```

**Important:** Since `react-native-svg` `<Path>` elements can't be directly wrapped in `Animated.View` inside an `<Svg>`, you have two approaches:

**Approach A (Recommended):** Use animated style transforms on wrapper `<Animated.View>`s that each contain their own `<Svg>` with one path. Stack them absolutely:

```tsx
<View style={{ width: size, height: size, position: "relative" }}>
  {/* Each flame layer is its own absolutely-positioned Svg */}
  <Animated.View style={[StyleSheet.absoluteFill, mainStyle]}>
    <Svg viewBox="0 0 80 80" width={size} height={size}>
      <Path d="M40,70 C25,70..." fill="#FF6B00" />
    </Svg>
  </Animated.View>
  <Animated.View style={[StyleSheet.absoluteFill, leftStyle]}>
    <Svg viewBox="0 0 80 80" width={size} height={size}>
      <Path d="M35,68 C28,68..." fill="#FF8C00" />
    </Svg>
  </Animated.View>
  {/* ... rightStyle, innerStyle layers ... */}
</View>
```

**Approach B:** Use `react-native-reanimated` + `react-native-svg` animated props to animate `d` path data directly (more complex, requires path interpolation library).

**Apply a drop-shadow filter (glow) to the fire container:**

```ts
fireContainer: {
  // React Native shadow for the golden glow:
  shadowColor: '#FFD700',
  shadowOpacity: 0.6,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 0 },
  elevation: 12,
},
```

### 3.3 Ember Particles

Add 5 small golden dots that float upward from the flame, fading out. Create a reusable `<EmberParticle />` component:

```tsx
function EmberParticle({ delay, driftX }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -60]) },
      { translateX: interpolate(progress.value, [0, 1], [0, driftX]) },
      { scale: interpolate(progress.value, [0, 1], [1, 0]) },
    ],
    opacity: interpolate(progress.value, [0, 0.5, 1], [1, 0.8, 0]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: "#FFD700",
        },
        style,
      ]}
    />
  );
}
```

**Place 5 embers above the fire:**

```tsx
<View style={styles.emberContainer}>
  <EmberParticle delay={0} driftX={-15} />
  <EmberParticle delay={400} driftX={20} />
  <EmberParticle delay={800} driftX={-8} />
  <EmberParticle delay={1200} driftX={12} />
  <EmberParticle delay={1600} driftX={-20} />
</View>
```

### 3.4 Day Circles

**Keep** the current M/T/W/T/F/S/S layout. **Update** styling:

```ts
dayCircle: {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  // If BlurView is available, add: overflow: 'hidden' and nest a BlurView
},
dayCircleCompleted: {
  backgroundColor: 'rgba(255, 255, 255, 0.35)',
  shadowColor: '#FFC832',
  shadowOpacity: 0.3,
  shadowRadius: 12,
},
dayCircleToday: {
  backgroundColor: '#FFFFFF',
  shadowColor: '#FFFFFF',
  shadowOpacity: 0.4,
  shadowRadius: 16,
  transform: [{ scale: 1.1 }],
},
dayLabel: {
  fontFamily: fonts.sans,
  fontWeight: '700',
  fontSize: 11,
  color: 'rgba(255, 255, 255, 0.7)',
},
dayLabelCompleted: {
  color: '#FFFFFF',
},
dayLabelToday: {
  color: '#E85D04',             // orange on white background
},
```

### 3.5 Streak Number & Label

**Keep** the current layout (number + "day streak" label). Ensure:

```ts
streakNumber: {
  fontFamily: fonts.serif,        // DM Serif Display
  fontSize: 56,
  color: '#FFFFFF',
  textAlign: 'center',
  textShadowColor: 'rgba(0,0,0,0.2)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 12,
  lineHeight: 56,
},
streakLabel: {
  fontFamily: fonts.sans,
  fontWeight: '700',
  fontSize: 14,
  color: 'rgba(255, 255, 255, 0.9)',
  letterSpacing: 1,
  textTransform: 'uppercase',
  textAlign: 'center',
  marginBottom: 20,
},
```

---

## Change 4: AccentBlob → Fluid Morphing Blob

**Goal:** Replace the current `<AccentBlob />` component (a rotating square with irregular `borderRadius`) with a fluid, self-distorting organic circular blob that uses SVG path morphing.

**Files likely affected:** The `AccentBlob` component file only. All call sites remain the same — just the internal rendering changes.

### 4.1 What to Remove

Inside `<AccentBlob />`, remove:

- The `View` with fixed `borderRadius: 40, 60, 80, 40` (the irregular square)
- The `withRepeat(withTiming(rotate 360deg))` rotation animation
- The fixed rectangular dimensions

### 4.2 What to Replace It With

The new AccentBlob renders an SVG `<Path>` that morphs between organic blob shapes using `react-native-svg` and `react-native-reanimated`.

**Implementation:**

```tsx
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// 4 blob shape keyframes (all have exactly 6 cubic bezier control points)
const BLOB_SHAPES = [
  "M100,20 C140,20 170,40 180,80 C190,120 180,160 150,180 C120,200 70,200 40,170 C10,140 10,100 20,70 C30,40 60,20 100,20 Z",
  "M110,15 C150,25 185,50 185,90 C185,130 170,165 140,185 C110,205 65,195 35,165 C5,135 0,95 15,60 C30,25 70,5 110,15 Z",
  "M95,25 C135,15 175,35 185,75 C195,115 175,155 145,175 C115,195 75,205 45,180 C15,155 5,110 15,70 C25,30 55,35 95,25 Z",
  "M105,10 C145,15 180,45 185,85 C190,125 175,165 145,185 C115,205 70,200 40,175 C10,150 5,105 20,65 C35,25 65,5 105,10 Z",
];

// Parse a path string into an array of numbers for interpolation
function parsePathNumbers(d: string): number[] {
  return d.match(/-?\d+/g)!.map(Number);
}

// Reconstruct path string from numbers array
function buildPath(nums: number[]): string {
  const [
    m1,
    m2,
    c1,
    c2,
    c3,
    c4,
    c5,
    c6,
    c7,
    c8,
    c9,
    c10,
    c11,
    c12,
    c13,
    c14,
    c15,
    c16,
    c17,
    c18,
    c19,
    c20,
    c21,
    c22,
    c23,
    c24,
    c25,
    c26,
    c27,
    c28,
    c29,
    c30,
  ] = nums;
  return `M${m1},${m2} C${c1},${c2} ${c3},${c4} ${c5},${c6} C${c7},${c8} ${c9},${c10} ${c11},${c12} C${c13},${c14} ${c15},${c16} ${c17},${c18} C${c19},${c20} ${c21},${c22} ${c23},${c24} C${c25},${c26} ${c27},${c28} ${c29},${c30} Z`;
}

const parsedShapes = BLOB_SHAPES.map(parsePathNumbers);

interface AccentBlobProps {
  placement: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  colorTheme: string; // hex color, e.g. '#8B5CF6'
  size?: number; // default 200
}

export function AccentBlob({
  placement,
  colorTheme,
  size = 200,
}: AccentBlobProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(3, {
        duration: 8000 + Math.random() * 3000, // 8-11s, slightly random per instance
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // infinite
      true, // reverse (ping-pong)
    );
  }, []);

  const animatedProps = useAnimatedProps(() => {
    "worklet";
    const p = progress.value;
    // Determine which two shapes to interpolate between
    const idx = Math.floor(p);
    const fraction = p - idx;
    const from = parsedShapes[idx % parsedShapes.length];
    const to = parsedShapes[(idx + 1) % parsedShapes.length];

    const interpolated = from.map((val, i) => val + (to[i] - val) * fraction);

    return {
      d: buildPath(interpolated),
    };
  });

  const positionStyle = {
    "top-left": { top: -size * 0.3, left: -size * 0.3 },
    "top-right": { top: -size * 0.3, right: -size * 0.3 },
    "bottom-left": { bottom: -size * 0.3, left: -size * 0.3 },
    "bottom-right": { bottom: -size * 0.3, right: -size * 0.3 },
  }[placement];

  return (
    <View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          opacity: 0.25, // KEEP this at 0.25 — same as before
          pointerEvents: "none",
        },
        positionStyle,
      ]}
    >
      <Svg viewBox="0 0 200 200" width={size} height={size}>
        <AnimatedPath animatedProps={animatedProps} fill={colorTheme} />
      </Svg>
    </View>
  );
}
```

### 4.3 Props API — No Changes

The `<AccentBlob />` component's external API stays the same:

- `placement`: `'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`
- `colorTheme`: the hex color matching the current tab's theme

All existing call sites like:

```tsx
<AccentBlob placement="top-left" colorTheme="green" />
```

...should continue to work. Just update the internal `colorTheme` mapping if it currently takes string names (`"green"`) instead of hex values — map `"green"` → `'#10B981'`, etc.

### 4.4 The Alternating Placement Rule

**Keep** the existing rule: alternate blob placement (Left, Right, Left) as you scroll down a page. Nothing changes here.

### 4.5 Performance Considerations

- The `useAnimatedProps` runs on the UI thread — this is performant.
- Use `shouldRasterizeIOS={true}` on the blob container if you notice any rendering hiccups.
- The blob is `pointerEvents: 'none'` so it doesn't interfere with touch targets.

---

## Change 5: Stats Page Refinements

**Goal:** Fix the artificial feel of the stats page. Replace emojis with SVG line icons, simplify the Daily Activity chart, add a profile edit icon, and keep the existing section title style.

**Files likely affected:** The Stats screen component and its sub-components.

### 5.1 Section Titles — NO CHANGES

The `<SectionLabel />` titles (e.g., `/ OVERVIEW`, `/ THIS WEEK`, `/ ACCOUNT`) are already correct. **Do not modify them in any way.** They use the existing slash + uppercase pattern from the design system.

### 5.2 Profile Avatar — Add Edit Icon

Next to (overlapping the bottom-right of) the existing profile avatar square, add a small circular edit button.

**Structure:**

```tsx
<View style={styles.profileRow}>
  <View style={{ position: "relative" }}>
    <View style={styles.profileAvatar}>
      <Text style={styles.profileAvatarText}>K</Text>
    </View>
    {/* New: Edit icon overlay */}
    <Pressable style={styles.avatarEditBtn} onPress={onEditProfilePic}>
      {/* Pencil icon — Lucide "pencil" or "edit-2" */}
      <PencilIcon size={10} strokeWidth={2.5} color="#FFFFFF" />
    </Pressable>
  </View>
  <View>
    <Text style={styles.profileName}>KIANOUSH</Text>
    <View style={styles.levelBadge}>
      <Text style={styles.levelText}>A1</Text>
    </View>
  </View>
</View>
```

**Edit button styles:**

```ts
avatarEditBtn: {
  position: 'absolute',
  bottom: -2,
  right: -2,
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: colors.ink,     // #18181B — dark circle
  borderWidth: 2,
  borderColor: colors.bg,          // #FAFAFA — creates a "cut-out" ring
  alignItems: 'center',
  justifyContent: 'center',
},
```

The pencil SVG icon (Lucide `pencil`):

```
viewBox="0 0 24 24"
<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
<path d="m15 5 4 4" />
```

Render it at `width={10} height={10}` with `stroke="white"` and `strokeWidth={2.5}`.

### 5.3 Stat Cards — Replace Emojis with SVG Icons

**Remove** all emoji characters from stat card icons. Replace each with a stroke-based SVG icon that matches the tab bar icon style (`strokeWidth: 2.5`, `strokeLinecap: "round"`, `strokeLinejoin: "round"`).

The stat icon container style stays the same:

```ts
statIcon: {
  width: 28,
  height: 28,
  borderRadius: radii.sm,        // 8
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 10,
},
```

**Icon replacements:**

| Stat           | OLD      | NEW SVG (Lucide)       | Icon Color | BG Color  |
| -------------- | -------- | ---------------------- | ---------- | --------- |
| Current Streak | 🔥 emoji | `flame` (fire outline) | `#D97706`  | `#FEF3C7` |
| Accuracy       | ✓ text   | `circle-check`         | `#059669`  | `#ECFDF5` |
| Mastered       | 🎓 emoji | `graduation-cap`       | `#6D28D9`  | `#EDE9FE` |
| Time Spent     | ⏱ emoji  | `clock`                | `#0284C7`  | `#E0F2FE` |

**SVG path data for each (render at size={14}):**

**Flame (streak):**

```xml
<svg viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5"
     stroke-linecap="round" stroke-linejoin="round">
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 2-6
           0 3.5 2.56 5.5 4 6.5 1.15.8 1.5 2.39 1.5 3.5a6 6 0 0 1-12 0c0-.59.12-1.2.36-1.78
           .28-.68.84-1.22 1.64-1.22.65 0 1.2.46 1 1"/>
</svg>
```

**Circle-Check (accuracy):**

```xml
<svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"
     stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <path d="m9 12 2 2 4-4"/>
</svg>
```

**Graduation Cap (mastered):**

```xml
<svg viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="2.5"
     stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 10v6"/>
  <path d="M2 10l10-5 10 5-10 5z"/>
  <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/>
</svg>
```

**Clock (time spent):**

```xml
<svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2.5"
     stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</svg>
```

### 5.4 Daily Activity Chart — Simplify

**Current problem:** The chart has two bars per day (learned + reviewed) with a legend, which looks cluttered and too busy in the phone screen.

**New design:** Single bar per day showing "Sessions completed." Remove the legend entirely.

**Changes:**

1. **Remove** the secondary (iris/purple) bar from each day group
2. **Remove** the legend row (the "Learned" / "Reviewed" flex row with colored dots)
3. **Keep** only one `primary` bar per day (mint gradient)
4. **Change subtitle** from `"Words learned & reviewed"` to `"Sessions completed"`
5. **Bar width:** Each bar should be 70% of its column width (not 100%) — this creates breathing room
6. **Inactive days** (Sat/Sun with no data): Show a tiny 4px stub at `opacity: 0.4` instead of a full bar

**Updated bar styles:**

```ts
organicBar: {
  width: '70%',                   // NOT full width
  borderTopLeftRadius: 6,
  borderTopRightRadius: 6,
  borderBottomLeftRadius: 4,
  borderBottomRightRadius: 4,
  minHeight: 4,
  // Gradient: use LinearGradient colors={['#10B981', '#059669']} vertical
  position: 'relative',
  overflow: 'hidden',
},
organicBarShine: {
  // Overlay on top 50% of bar for glass effect
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '50%',
  borderTopLeftRadius: 6,
  borderTopRightRadius: 6,
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
},
```

**Bar height animation on mount:**

When the chart section scrolls into view, animate each bar from `height: 4` to its final height with a staggered delay:

```ts
// Per bar, with index-based delay:
height.value = withDelay(
  index * 80,
  withTiming(targetHeight, {
    duration: 800,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  }),
);
```

Use `onLayout` or an IntersectionObserver-like scroll trigger to start the animation when visible.

### 5.5 Learning Journey Section — Keep As-Is

The "Learning Journey" section with word items, status dots, and status badges is already well-designed. **No changes needed.**

---

## Shared Dependencies & Notes

### Required Packages

Ensure these are installed (most likely already are):

| Package                                                  | Used For                             |
| -------------------------------------------------------- | ------------------------------------ |
| `react-native-reanimated`                                | All animations (already in use)      |
| `react-native-svg`                                       | Blob morphing, fire SVG, stat icons  |
| `react-native-linear-gradient` or `expo-linear-gradient` | Gradient backgrounds, progress fills |
| `@react-native-community/blur` or `expo-blur`            | Tab bar frosted glass                |

### Color Token Reference

No new colors are introduced. All colors come from the existing palette:

```ts
// Existing — DO NOT CHANGE
colors.iris = "#8B5CF6";
colors.irisLight = "#C4B5FD";
colors.irisDark = "#6D28D9";
colors.mint = "#10B981";
colors.mintLight = "#6EE7B7";
colors.mintDark = "#059669";
colors.amber = "#F59E0B";
colors.amberLight = "#FCD34D";
colors.amberDark = "#D97706";
colors.sky = "#0EA5E9";
colors.skyLight = "#7DD3FC";
colors.skyDark = "#0284C7";
colors.coral = "#EF4444";
colors.coralLight = "#FCA5A5";
colors.bg = "#FAFAFA";
colors.card = "#FFFFFF";
colors.ink = "#18181B";
colors.ink2 = "#52525B";
colors.inkLight = "#A1A1AA";
colors.border = "#E4E4E7";
```

### Font Token Reference

```ts
// Existing — DO NOT CHANGE
fonts.serif = "DM Serif Display";
fonts.sans = "Space Grotesk";
fonts.mono = "JetBrains Mono";
```

### What NOT to Touch — Explicit Checklist

- [ ] Splash screen (animated dots, "vocab." title)
- [ ] Login screen layout, fields, buttons
- [ ] Sign-up screen layout, fields, buttons
- [ ] "Pick your field" screen (cards, animations, continue button)
- [ ] Onboarding quiz (the initial 10-question assessment)
- [ ] Home screen layout (other than the streak card changes in Change 3)
- [ ] Learn screen (today's words, review queue, word of the day)
- [ ] Review / Mastery Vault screen (word list, search, filters, status badges)
- [ ] `<SectionLabel />` component
- [ ] `<MaxWidthContainer />` component
- [ ] Primary CTA button style (dark gradient with white text)
- [ ] Card border style (`borderWidth: 2, borderColor: colors.border`)
- [ ] Card border radius (`radii.lg = 16`)
- [ ] Shadow definitions (`shadows.sm`)
- [ ] Any font family, weight, or global text style definitions
- [ ] The color palette itself (no new colors, no renamed tokens)
- [ ] The overall app background color (`colors.bg`)
- [ ] Navigation/routing structure
- [ ] Any API calls, data models, or business logic

### Implementation Order (Recommended)

1. **AccentBlob** (Change 4) — smallest blast radius, no layout changes, drop-in replacement
2. **Tab Bar** (Change 2) — structural but isolated to one component
3. **Stats Page** (Change 5) — icon swaps + chart simplification, low risk
4. **Streak Widget** (Change 3) — new SVG component, contained to Home screen
5. **Quiz Screen** (Change 1) — most changes, multiple interaction states

### Testing Checklist

After implementing each change, verify:

- [ ] Animations run at 60fps on both iOS and Android
- [ ] No layout shifts or flickers during screen transitions
- [ ] Tab bar safe area respects iPhone notch / home indicator
- [ ] AccentBlobs don't overflow their parent `overflow: 'hidden'` containers
- [ ] Confetti particles don't block quiz option touch targets
- [ ] Fire SVG renders correctly on both platforms (test on real device)
- [ ] Stat card SVG icons align vertically with the text below them
- [ ] Chart bars animate smoothly on first appearance
- [ ] Profile edit button is tappable (minimum 44x44 touch target with hitSlop)
