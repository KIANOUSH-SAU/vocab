# Vocab App — Design System v2

> This document is the single source of truth for the Vocab App's visual language.
> Every component, color, font, spacing value, and animation spec lives here.
> When building or modifying any screen, **always consult this file first**.

---

## 1. Color Palette

### 1.1 Primary — Iris Violet

The primary brand color. Warmer than pure indigo, more distinctive. Feels intellectual yet approachable.

| Token         | Hex       | Usage                                                            |
| ------------- | --------- | ---------------------------------------------------------------- |
| `iris`        | `#7C5CFC` | Primary buttons, active states, selected options, card gradients |
| `iris-dark`   | `#6340E8` | Gradient midpoint, pressed states                                |
| `iris-deeper` | `#5B3FD4` | Gradient endpoint, strong emphasis                               |
| `iris-light`  | `#A78BFA` | Secondary accents, background cards behind stack                 |
| `iris-soft`   | `#F0ECFF` | Tag backgrounds, selected option fill, subtle highlight          |
| `iris-wash`   | `#E8E0FF` | Very light tint for stacked card backgrounds                     |

**Primary gradient (135deg):** `#7C5CFC → #5B3FD4`
**Extended gradient (145deg):** `#7C5CFC → #6340E8 → #4C2EBF` (for hero cards)

### 1.2 Semantic Colors

| Token   | Hex       | Soft Variant | Purpose                                   |
| ------- | --------- | ------------ | ----------------------------------------- |
| `mint`  | `#2DD4A8` | `#ECFDF5`    | Correct answers, mastered words, success  |
| `coral` | `#FB7185` | `#FFF1F2`    | Wrong answers, skipped words, errors      |
| `amber` | `#FBBF24` | `#FFFBEB`    | Learning state, warnings, streaks, timers |
| `sky`   | `#38BDF8` | `#E0F2FE`    | Info, neutral highlights, categories      |

**Correct answer badge text:** `#059669`
**Learning badge text:** `#D97706`
**Skipped badge text:** `#E11D48`

### 1.3 Neutrals — Zinc (Warm)

| Token         | Hex       | Usage                                    |
| ------------- | --------- | ---------------------------------------- |
| `ink`         | `#18181B` | Primary text, headings, dark buttons     |
| `ink-mid`     | `#3F3F46` | Secondary headings                       |
| `ink2`        | `#71717A` | Body text, descriptions, captions        |
| `ink-light`   | `#A1A1AA` | Placeholder text, disabled states        |
| `border`      | `#E4E4E7` | Card borders, dividers, inactive states  |
| `border-soft` | `#F4F4F5` | Subtle backgrounds, alternating rows     |
| `bg`          | `#FAFAF8` | Page/screen background (warm cream tint) |
| `card`        | `#FFFFFF` | Card surfaces                            |

**Important:** Background is `#FAFAF8`, NOT pure white. This subtle cream warmth is a key part of the design's personality.

### 1.4 Shadows

```
shadow-sm:    0 1px 2px rgba(0,0,0,0.04)
shadow:       0 4px 24px rgba(0,0,0,0.06)
shadow-float: 0 20px 60px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.04)
shadow-iris:  0 12px 40px rgba(124,92,252,0.3)     // for primary cards
shadow-iris-hover: 0 6px 24px rgba(124,92,252,0.4)  // for pressed/hovered primary elements
```

### 1.5 Gradients

```
gradient-primary:   linear-gradient(135deg, #7C5CFC, #5B3FD4)
gradient-deep:      linear-gradient(150deg, #7C5CFC 0%, #5B3FD4 60%, #4C2EBF 100%)
gradient-card-back: linear-gradient(145deg, #C4B5FD, #A78BFA)
gradient-streak:    linear-gradient(135deg, #FFFBEB, #FEF3C7)
gradient-progress:  linear-gradient(90deg, #7C5CFC, #A78BFA)  // shimmer bar
gradient-quiz-prog: linear-gradient(90deg, #7C5CFC, #FB7185)  // flashcard progress
gradient-mint-prog: linear-gradient(90deg, #7C5CFC, #2DD4A8)  // quiz progress
gradient-glass-bg:  linear-gradient(135deg, #E8E0FF, #F0ECFF, #E0F2FE) // behind glass panels
```

---

## 2. Typography

### 2.1 Font Stack

| Role    | Font Family        | Fallback                        | Usage                                                                     |
| ------- | ------------------ | ------------------------------- | ------------------------------------------------------------------------- |
| Display | `DM Serif Display` | `Georgia, serif`                | Screen titles, word display on cards, hero text. **Used sparingly.**      |
| UI      | `Space Grotesk`    | `system-ui, sans-serif`         | Everything else: section titles, buttons, labels, body text, descriptions |
| Mono    | `JetBrains Mono`   | `SF Mono, Fira Code, monospace` | Phonetic transcriptions, tags, metadata, timers, code-like data           |

**React Native mapping:**

- Display: Load via `expo-font` or `@expo-google-fonts/dm-serif-display`
- UI: Load via `@expo-google-fonts/space-grotesk`
- Mono: Load via `@expo-google-fonts/jetbrains-mono`

### 2.2 Type Scale

| Level         | Font           | Size | Weight | Letter Spacing | Line Height | Usage                            |
| ------------- | -------------- | ---- | ------ | -------------- | ----------- | -------------------------------- |
| Display XL    | DM Serif       | 32px | 400    | -1px           | 1.15        | Word on flashcard                |
| Display L     | DM Serif       | 28px | 400    | -0.5px         | 1.2         | Screen title ("Hello, Kianoush") |
| Display M     | DM Serif       | 22px | 400    | -0.5px         | 1.25        | Section header on quiz prompt    |
| Heading L     | Space Grotesk  | 18px | 700    | -0.3px         | 1.3         | Section titles                   |
| Heading M     | Space Grotesk  | 16px | 600    | -0.2px         | 1.35        | Card titles, word in list        |
| Body          | Space Grotesk  | 15px | 400    | 0              | 1.55        | Definitions, descriptions        |
| Body Small    | Space Grotesk  | 14px | 400    | 0              | 1.5         | Option text in quiz              |
| Caption       | Space Grotesk  | 13px | 500    | 0              | 1.4         | Subtext, timestamps              |
| Caption Small | Space Grotesk  | 12px | 400    | 0              | 1.4         | Fine print, nav labels           |
| Mono          | JetBrains Mono | 13px | 400    | 0              | 1.3         | Phonetics `/rɪˈzɪl.i.ənt/`       |
| Mono Small    | JetBrains Mono | 12px | 500    | 0              | 1.3         | Timer `0:42`, tags               |
| Label         | Space Grotesk  | 11px | 600    | 1.5px (caps)   | 1.2         | Section labels, uppercase tags   |
| Badge         | Space Grotesk  | 12px | 600    | 0              | 1.0         | Status badges (Mastered, New)    |

### 2.3 Typography Rules

1. **Serif (DM Serif Display)** is ONLY for display-level text: word on flashcards, screen titles, the app logo "V". Never for body text or buttons.
2. **Mono (JetBrains Mono)** is ONLY for data-like content: phonetics, timers, counters, level codes (B1), field labels in code-style tags.
3. **All UI text** (buttons, labels, descriptions, navigation) uses Space Grotesk.
4. **Uppercase labels** use `letter-spacing: 1.5px` and weight 600.
5. The contrast of serif + sans + mono creates the app's distinctive character. **Do not replace with a single font family.**

---

## 3. Spacing & Layout

### 3.1 Spacing Scale (in px)

```
2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56
```

### 3.2 Border Radii

| Token      | Value | Usage                              |
| ---------- | ----- | ---------------------------------- |
| `r-full`   | 100px | Pills, badges, circular buttons    |
| `r-xl`     | 24px  | Phone screen inner, main cards     |
| `r-lg`     | 20px  | Cards, panels, word cards          |
| `r-md`     | 14px  | Options, buttons, onboarding items |
| `r-sm`     | 12px  | Small cards, stat boxes            |
| `r-xs`     | 8px   | Letter badges, tabs, chips         |
| `r-2xs`    | 6px   | Field tags, small chips            |
| `r-circle` | 50%   | Avatars, play buttons, dots        |

### 3.3 Screen Layout

- Screen padding: `14px` horizontal
- Card gap: `6-8px` between list items
- Section gap: `14-16px` between sections
- Bottom nav height: ~50px
- Status bar / dynamic island clearance: handled by SafeAreaView

---

## 4. Components

### 4.1 Word Card (Blob Style)

The signature component. A clean white card with a floating organic blob shape behind it.

**Structure:**

```
<View style={relative}>
  <BlobShape />           ← Animated blob, position absolute, behind card
  <View style={cardInner}> ← White card, z-index above blob
    <Text label>WORD OF THE DAY</Text>         ← Label (uppercase, 11px, ink2, spacing 1.5px)
    <Text wordMain>Resilient</Text>             ← DM Serif Display, 30px
    <Text phonetic>/rɪˈzɪl.i.ənt/</Text>       ← JetBrains Mono, 13px, iris
    <Divider />                                  ← 1px line, border color
    <Text definition>Able to withstand...</Text> ← Space Grotesk, 14px, ink2
    <View footer>
      <FieldChip icon="⚙️" label="Engineering" /> ← iris-soft bg, iris text, 6px radius
      <PlayButton />                               ← 34px circle, ink bg, white play icon
    </View>
  </View>
</View>
```

**Blob shape specs:**

- Size: ~120x120px
- Position: top -20px, right -10px (offset behind card)
- Color: `linear-gradient(135deg, #C4B5FD, #A78BFA)` at 50% opacity
- Border radius: organic/morphing `60% 40% 50% 50% / 50% 60% 40% 50%`
- Animation: Morph between 3 border-radius states over 6s, `ease-in-out`, infinite repeat
- Implementation: Use `react-native-reanimated` `useSharedValue` + `withRepeat` + `withTiming` to animate border radii

**Card inner:**

- Background: white
- Border radius: 24px
- Padding: 24px horizontal, 24px vertical
- Shadow: `shadow-iris` (0 8px 32px rgba(124,92,252,0.12))

**Play button:**

- 34px diameter circle
- Background: `ink` (#18181B)
- Icon: white play triangle SVG, 12x14px
- Press animation: `withSpring` scale to 1.1, spring back

### 4.2 Flashcard Swipe Stack

Three visible cards stacked with depth scaling.

**Stack layout (within a 260x180 container):**

| Layer  | z-index | Background                                    | Scale | translateY | Shadow      |
| ------ | ------- | --------------------------------------------- | ----- | ---------- | ----------- |
| Card 3 | 1       | `#F0ECFF` (iris-soft)                         | 0.88  | +24px      | none        |
| Card 2 | 2       | `gradient(145deg, #C4B5FD, #A78BFA)`          | 0.94  | +14px      | subtle      |
| Card 1 | 3       | `gradient(150deg, #7C5CFC, #5B3FD4, #4C2EBF)` | 1.0   | 0          | shadow-iris |

**Top card content:**

- Phonetic: JetBrains Mono, 12px, white at 60% opacity
- Word: DM Serif Display, 28px, white
- Definition: Space Grotesk, 14px, white at 80% opacity, centered, padding 0 20px
- Hint pill: "Tap to flip" — 12px, white at 40%, background rgba(255,255,255,0.1), border-radius 100px, position absolute bottom 12px

**Swipe behavior:**

- Library: `rn-swiper-list` or custom with `Gesture.Pan()` from gesture-handler v2
- Right swipe = "Know it" → card exits right with rotation (+8deg), green flash
- Left swipe = "Skip" → card exits left with rotation (-8deg), red flash
- On drag: top card follows finger with translateX, rotate proportional to drag distance (max ±12deg)
- On release: if velocity/distance threshold met → `withSpring` exit animation; else snap back with `withSpring({ damping: 15, stiffness: 150 })`
- Next card transitions: scale from 0.94→1.0, translateY from 14→0, with `withTiming(300ms, Easing.out(Easing.cubic))`

**Action buttons (below card stack):**

- Three circles, 48px diameter each, centered with 16px gap
- Skip: border `2px solid coral`, coral text "✕", coral-soft background
- Audio: border `2px solid border`, ink2 text "🔊", white background
- Know: border `2px solid mint`, mint text "✓", mint-soft background
- Hover/press: `withSpring` scale to 1.12

### 4.3 Glassmorphism Fill-in-the-Blank

A frosted glass panel for sentence-completion exercises.

**Container (the glass panel):**

- Background: `rgba(255,255,255,0.6)`
- Backdrop filter: `blur(20px)` — in React Native use `@react-native-community/blur` or `expo-blur`
- Border: `1px solid rgba(255,255,255,0.8)`
- Border radius: 20px
- Padding: 22px 18px

**Background:** Place this component over a gradient mesh background: `linear-gradient(135deg, #E8E0FF, #F0ECFF, #E0F2FE)`

**Header row:**

- Left: step indicator "Q3 of 10" — 12px, weight 600, iris color, iris-soft bg, 4px radius padding 3px 8px
- Right: timer "0:42" — JetBrains Mono, 13px, coral color

**Sentence:**

- Space Grotesk, 15px, line-height 1.65
- Blank: inline, min-width 80px, border-bottom `2.5px dashed iris`, text centered, iris color, weight 600

**Word chips:**

- Flex wrap row, gap 6px
- Each chip: padding 8px 14px, white bg, `1.5px solid border`, border-radius 100px (pill), 13px weight 500
- Hover: border-color iris, bg iris-soft
- Selected/active: bg iris, white text, border iris, `withSpring` scale to 1.05
- Implementation: chips are draggable (optional) or tappable

### 4.4 Orbit Progress Visualization

An orbital diagram where word categories float around a central mastery score.

**Container:** 200x200px, relative positioning

**Orbital rings (3 concentric):**

- Ring 1: 200px diameter, `1.5px dashed border` (#E4E4E7)
- Ring 2: 140px diameter, centered inside ring 1
- Ring 3: 80px diameter, centered inside ring 2

**Center node:**

- 48x48px, border-radius 14px
- Background: `ink` (#18181B)
- Text: "75%", white, 13px, weight 700
- z-index 3

**Orbiting dots (5 category dots):**

- Size: 28x28px, border-radius 50%
- Shadow: `0 2px 8px rgba(0,0,0,0.15)`
- Each shows a count number: 10px, weight 700, white
- Positioned absolutely along the outer ring:
  - Dot 1 (top center): `iris` #7C5CFC — "28" (new words)
  - Dot 2 (top right): `mint` #2DD4A8 — "15" (mastered)
  - Dot 3 (bottom right): `coral` #FB7185 — "8" (skipped)
  - Dot 4 (bottom center): `amber` #FBBF24 — "12" (learning)
  - Dot 5 (top left): `sky` #38BDF8 — "5" (reviewing)
- Animation: gentle float (translateY 0 to -4px), 3s ease-in-out infinite, each dot staggered by 0.5s

**Implementation:** Use `react-native-svg` for the dashed circles. Position dots absolutely. Animate with `withRepeat(withTiming(...))` on translateY shared values.

### 4.5 Scratch-to-Reveal Card

A card that hides the answer behind a hatched pattern — user swipes/taps to reveal.

**Card container:**

- Width: 240px (or full width minus padding on mobile)
- Background: white
- Border radius: 20px
- Shadow: `0 4px 20px rgba(0,0,0,0.06)`
- Overflow: hidden

**Top section (question):**

- Padding: 20px, text-align center
- Label: "CAN YOU RECALL?" — 11px, ink2, letter-spacing 1px, uppercase
- Word: DM Serif Display, 24px

**Bottom section (hidden answer):**

- Height: 80px
- Background: diagonal stripe pattern (45deg repeating, iris-soft / #E8E0FF, 8px stripes)
- Centered text overlay: "Swipe to reveal" with down-arrow icon
- On reveal: background transitions to mint-soft, overlay fades out (opacity 0, translateY -10px), answer fades in (opacity 1, translateY 0 from +10px)
- Answer text: 15px, weight 600, mint color, with "✓" suffix

**Implementation:** Use `Gesture.Pan()` vertical swipe or `Pressable` with Reanimated shared values. Animate opacity and translateY with `withTiming(400ms)`. The diagonal stripe can be done with a repeating linear gradient image or a small SVG pattern tile.

### 4.6 Waveform Audio Player

A voice-message style player for ElevenLabs TTS pronunciation.

**Container:**

- Width: full (minus padding)
- Background: white
- Border radius: 20px
- Padding: 20px
- Shadow: `0 4px 20px rgba(0,0,0,0.06)`

**Header row (flex, gap 14px, align center):**

- Play button: 44px circle, `gradient-primary`, white play SVG (14x16), shadow `shadow-iris`
  - Press: `withSpring` scale 1.08, shadow intensifies to `shadow-iris-hover`
- Word info:
  - Word: Space Grotesk, 16px, weight 600
  - Voice label: 12px, ink2, flex row with a green dot (6px circle, `mint`) + "Morgan Freeman AI"

**Waveform (flex row, gap 2px, height 32px, align center):**

- ~30 individual bars
- Each bar: 3px wide, border-radius 2px, variable height (10-32px, randomized to look like real audio)
- Three states:
  - `.played` — iris color at 40% opacity (already played portion)
  - `.active` — iris color at 100% (current playback position, 1-2 bars)
  - Default — `border` color (#E4E4E7) (upcoming portion)
- As audio plays, bars transition from default → active → played left to right

**Time display:**

- JetBrains Mono, 11px, ink2
- Left: current time "0:01"
- Right: total time "0:03"

**Implementation:** Generate bar heights from audio amplitude data (or random seed). Track playback position with an Animated.Value that maps to the bar index. Use `useAnimatedStyle` to conditionally apply colors.

### 4.7 Streak Flame Widget

A compact motivational widget for daily streaks.

**Container:**

- Width: ~240px (or responsive)
- Background: white
- Border radius: 20px
- Padding: 20px
- Text-align: center
- Shadow: `0 4px 20px rgba(0,0,0,0.06)`

**Flame emoji:** 🔥 at ~38px size

- Animation: pulse — scale oscillates between 1.0 and 1.1 with subtle rotation (-3deg to +3deg), 1.5s ease-in-out infinite

**Counter:** DM Serif Display, 36px, `ink` color
**Label:** "day streak", Space Grotesk, 13px, `ink2`

**Week dots (flex row, centered, gap 6px):**

- Each dot: 28x28px, border-radius 8px, centered text (day initial M/T/W/T/F/S/S), 10px weight 600
- `.done` — iris bg, white text
- `.today` — amber bg, white text, pulsing ring animation: `box-shadow` radiates from `0 0 0 0 rgba(251,191,36,0.3)` to `0 0 0 6px rgba(251,191,36,0)`, 2s infinite
- `.future` — border-soft bg, ink2 text

### 4.8 Multiple Choice Quiz Option

**Container (each option):**

- Flex row, align center, gap 12px
- Padding: 14px
- Background: white
- Border: `2px solid border`
- Border radius: 14px
- Margin bottom: 8px

**Letter badge:**

- 28x28px, border-radius 8px
- Default: border-soft bg, 12px weight 700, ink2 text
- Hover: iris bg, white text
- Correct: mint bg, white text

**States:**

- Default: white bg, border border
- Hover/press: iris border, iris-soft bg
- Selected (correct): mint border, mint-soft bg
- Selected (wrong): coral border, coral-soft bg

**Quiz prompt card (above options):**

- Background: white
- Border radius: 16px
- Padding: 16px
- Shadow: shadow-sm
- Content:
  - Label: "WHAT DOES THIS MEAN?" — 11px, ink2, uppercase, spacing 0.5px
  - Word: DM Serif Display, 22px
  - Context sentence (optional): 13px, ink2, italic, line-height 1.5, margin-top 8px

### 4.9 Spaced Repetition Timeline

**Due-now card:**

- Background: `linear-gradient(135deg, iris-soft, #E8E0FF)`
- Border: `1px solid #D4C9FE`
- Border radius: 16px
- Padding: 16px
- Decorative circle: absolute top-right, 80px diameter, `rgba(124,92,252,0.08)`, overflow hidden
- Content:
  - Badge: "DUE NOW" — 11px, weight 700, iris, uppercase, spacing 1px
  - Count: "8 words to review" — 22px, weight 700
  - Sub: "Estimated time: ~4 min" — 12px, ink2
  - CTA button: inline, padding 8px 20px, iris bg, white text, border-radius 10px, 13px weight 600

**Timeline (vertical):**

- Left rail: 2px wide, `linear-gradient(180deg, iris, border)`, absolute left 9px
- Padding-left: 28px for content

**Step dots (absolute left -24px from content):**

- 12px diameter circle, 2.5px white border
- `.done` — iris fill, iris outer ring
- `.current` — amber fill, amber outer ring, `box-shadow: 0 0 8px rgba(251,191,36,0.3)` glow
- `.upcoming` — border color fill, border outer ring

**Step content:**

- Label: 13px, weight 600
- Time: 11px, ink2

### 4.10 Onboarding Option Card

**Container:**

- Padding: 14px 16px
- Border: `2px solid border`
- Border radius: 14px
- Flex row, align center, gap 12px

**States:**

- Default: border border, white bg
- Hover: border iris
- Selected: border iris, iris-soft bg

**Content:**

- Emoji: 20px
- Label: Space Grotesk, 15px, weight 500

**Check indicator (right side):**

- 20px diameter circle
- Default: `2px solid border`, empty
- Selected: iris fill, iris border, white checkmark SVG inside

**CTA button (below options):**

- Full width, padding 14px
- Background: `ink` (#18181B) — NOT iris. The dark button is a deliberate contrast.
- Color: white
- Border radius: 14px
- Font: 15px, weight 600

**Page dots (below CTA):**

- Flex row, centered, gap 6px
- Inactive: 6px diameter circle, border color
- Active: 18px wide pill (border-radius 3px), iris color

---

## 5. Animations

### 5.1 Spring Configurations

Define these as reusable configs in your animation utils:

```typescript
// src/utils/animations.ts
export const SPRING_CONFIGS = {
  // Snappy — for button presses, option selections
  snappy: { damping: 15, stiffness: 150 },

  // Bouncy — for card flip, confetti, success states
  bouncy: { damping: 12, stiffness: 180, mass: 0.8 },

  // Gentle — for card stack transitions, layout shifts
  gentle: { damping: 20, stiffness: 100 },

  // Quick — for hover states, micro-interactions
  quick: { damping: 20, stiffness: 200 },
};

export const TIMING_CONFIGS = {
  fast: { duration: 200, easing: Easing.out(Easing.cubic) },
  medium: { duration: 300, easing: Easing.out(Easing.cubic) },
  slow: { duration: 500, easing: Easing.out(Easing.cubic) },
};
```

### 5.2 Card Flip (3D)

Triggered by tap on flashcard.

```
Properties animated:
  - rotateY: 0deg → 180deg (front → back)
  - rotateY: 180deg → 0deg (back → front)

Spring: bouncy { damping: 12, stiffness: 180 }

Implementation:
  - Two absolutely positioned views (front/back)
  - Both have backfaceVisibility: 'hidden'
  - Back view has initial rotateY: 180deg
  - Shared value: isFlipped (0 or 1)
  - Interpolate: isFlipped → rotateY

Front face: gradient-deep background, white text
Back face: white bg, mint border (2px), ink text, definition + example sentence
```

### 5.3 Confetti Burst

Triggered on correct answer.

```
6 particles around a central element (e.g., the checkmark button)
Each particle: 6px diameter circle, different semantic color

On trigger:
  1. Central element: withSequence(
       withSpring(scale: 1.15, rotation: -5deg),
       withSpring(scale: 1.0, rotation: 0)
     )
  2. Each particle (staggered by 50ms):
     - opacity: 0 → 1 → 0 (200ms total)
     - translateX/Y: from center outward (randomized 20-40px)
     - scale: 0 → 1 → 0

Colors: iris, coral, amber, mint, sky, coral (6 particles)
Positions: radially distributed around the trigger element
```

### 5.4 Word Morph / Text Rotate

For "word of the day" or loading states on the home screen.

```
3 words cycle through a fixed-height container

Each word animation (staggered by 2s, total cycle 6s):
  - Enter: opacity 0→1, translateY +20px→0 (300ms)
  - Hold: visible for ~1.2s
  - Exit: opacity 1→0, translateY 0→-20px (300ms)
  - Hidden for remainder of cycle

Container: fixed height (38px), overflow hidden
Font: DM Serif Display, 22px
Each word can have its own color (iris, mint, coral)
```

### 5.5 Shimmer Progress Bar

The progress fill has a gradient that slides across continuously.

```
Container: full width, 24px height, border-soft bg, border-radius 12px
Fill: width = progress%, border-radius 12px

Gradient on fill: linear-gradient(90deg, iris, #A78BFA, iris)
  - backgroundSize: 200% 100%
  - Animation: translate background-position from 200% to -200%, 2.5s linear infinite

Percentage label: inside the fill, right-aligned, 11px JetBrains Mono white bold

For React Native:
  - Use a LinearGradient inside the fill view
  - Animate the gradient's start/end points with useAnimatedProps
  - Or use a masked shimmer layer with translateX animation
```

### 5.6 Ripple Fill Button

On press, a circle expands from center filling the button with accent color.

```
Button container: ink bg, white text, border-radius 12px, overflow hidden

On press:
  1. A circle view (position absolute, centered) scales from 0 to cover full button
     - Start: width 0, height 0, border-radius 50%, iris bg
     - End: width 200px, height 200px (larger than button)
     - Duration: 500ms withTiming
  2. Button lifts: translateY -2px, shadow intensifies
  3. On release: reverse

Text must be above the ripple (z-index)
```

### 5.7 Learning Path Draw (SVG)

An SVG curved path that draws itself to show journey progress.

```
SVG viewBox: 0 0 180 60
Path: cubic bezier "M10 50 Q45 10 90 30 T170 15"
  - stroke: iris, strokeWidth: 3, strokeLinecap: round
  - fill: none

Three milestone dots on the path:
  - Start (10,50): iris, 4px radius
  - Mid (90,30): mint, 4px radius
  - End (170,15): coral, 4px radius

Animation:
  - stroke-dasharray: total path length (~300)
  - stroke-dashoffset: animated from 300 → 0 (drawing) → -300 (erasing)
  - Duration: 3s ease-in-out infinite

React Native implementation:
  - react-native-svg for Path, Circle
  - useAnimatedProps to animate strokeDashoffset
  - Calculate path length with path.getTotalLength() or hard-code
```

### 5.8 Blob Morph

The organic shape behind the word card continuously morphs.

```
3 keyframe states for borderRadius:
  State A: 60% 40% 50% 50% / 50% 60% 40% 50%
  State B: 40% 60% 50% 50% / 60% 40% 50% 50%
  State C: 50% 50% 40% 60% / 40% 50% 60% 50%

Cycle: A → B → C → A, 6s total, ease-in-out
Implementation: Animate each of the 8 borderRadius values individually using shared values

Alternative: Use react-native-svg with a Path and animate control points for a smoother organic feel
```

### 5.9 Float / Hover (Orbit Dots)

Gentle floating motion for decorative or informational elements.

```
translateY: 0 → -4px → 0
Duration: 3s
Easing: ease-in-out
Repeat: infinite
Stagger: 0.5s between each dot in a group

withRepeat(
  withTiming(sharedValue, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
  -1, // infinite
  true // reverse
)
```

### 5.10 Pulse Ring (Today's Streak / SRS Current)

A radiating ring that draws attention to the "current" element.

```
An outer ring that scales outward and fades:
  - Start: scale 1, opacity 0.3, matching element color at 30% opacity
  - End: scale 1.5 (or +6px radius), opacity 0
  - Duration: 2s, infinite

For the amber "today" streak dot:
  box-shadow equivalent: animated view behind the dot
  Color: rgba(251, 191, 36, 0.3) → rgba(251, 191, 36, 0)

For the SRS current step dot:
  box-shadow: 0 0 8px rgba(251,191,36,0.3) static glow
  + optional pulse ring animation
```

---

## 6. Screen Specifications

### 6.1 Home Dashboard

```
SafeAreaView (bg: #FAFAF8)
├── Header Row (flex, space-between, align-center, mb 14)
│   ├── Greeting Column
│   │   ├── "Good morning" — Caption, ink2
│   │   └── "Kianoush" — DM Serif Display, 22px
│   └── Avatar (40x40, r-md, gradient-primary, centered initial letter)
├── Streak Card (gradient-streak bg, r-md, p-12 14, border 1px #FDE68A, mb 14)
│   ├── 🔥 emoji (24px)
│   └── Column: "12-day streak" (13px 600 #92400E) + "You're on fire" (11px #B45309)
├── Stats Row (3-column grid, gap 8, mb 16)
│   └── Stat Box × 3 (white bg, r-sm, p-12 8, center, shadow-sm)
│       ├── Number (18px 700, colored: iris/mint/amber)
│       └── Label (10px, ink2)
├── Section Title ("Today's Words", 13px 600, flex space-between)
│   └── Right: "See all" (11px, iris, 500)
├── Word Rows × N
│   └── Word Row (flex, align-center, gap 10, white bg, r-sm, p-10 12, shadow-sm, mb 6)
│       ├── Icon (36x36, r-xs, gradient bg, centered letter white 12px 700)
│       ├── Text Column (word 14px 600 + def 11px ink2)
│       └── Mastery Badge (10px 600, semantic color + soft bg, r-2xs, p-3 7)
└── Bottom Nav (flex space-around, pt 10, border-top 1px border)
    └── Nav Item × 4 (icon 20x20 r-2xs + label 10px + active dot 4px iris)
```

### 6.2 Flashcard Screen

```
SafeAreaView (bg: #FAFAF8)
├── Header Row (flex space-between, "← Back" / "Engineering · B1" 600 / "6/20" ink2)
├── Progress Bar (4px height, border bg, r-2xs, mb 20)
│   └── Fill (gradient-quiz-prog 90deg, width = progress%)
├── Card Stack Area (height ~250, relative)
│   ├── Background Card 2 (90% width, r-lg, iris-soft, scale 0.88, top +24)
│   ├── Background Card 1 (90% width, r-lg, iris-wash, scale 0.94, top +14)
│   └── Main Card (100% width, r-xl+2, gradient-deep, shadow-iris)
│       └── Content: phonetic (Mono 12px 60%) + word (Serif 28px) + def (14px 80%) + hint pill
├── Action Buttons Row (flex center, gap 16)
│   └── 3 × CircleButton (48px, bordered, semantic colors)
├── Hint Text ("← Swipe to skip · Swipe to confirm →" 11px ink2 center)
└── Bottom Nav
```

### 6.3 Quiz Screen

```
SafeAreaView (bg: #FAFAF8)
├── Header Row
├── Progress Bar (gradient-mint-prog)
├── Prompt Card (white, r-lg-2, p-16, shadow-sm, center)
│   ├── Label (uppercase, 11px ink2)
│   ├── Word (Serif 22px)
│   └── Context sentence (13px ink2 italic, optional)
├── Options × 4 (white, border 2px, r-md, p-14, mb 8)
│   ├── Letter Badge (28x28 r-xs)
│   └── Option Text (14px)
├── CTA Button ("Check Answer" — ink bg, white, r-sm, p-12, 14px 600)
└── Bottom Nav
```

---

## 7. Implementation Notes

### 7.1 NativeWind / Tailwind Mapping

If using NativeWind, add these to your `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        iris: {
          DEFAULT: "#7C5CFC",
          dark: "#6340E8",
          deeper: "#5B3FD4",
          light: "#A78BFA",
          soft: "#F0ECFF",
          wash: "#E8E0FF",
        },
        mint: { DEFAULT: "#2DD4A8", soft: "#ECFDF5" },
        coral: { DEFAULT: "#FB7185", soft: "#FFF1F2" },
        amber: { DEFAULT: "#FBBF24", soft: "#FFFBEB" },
        sky: { DEFAULT: "#38BDF8", soft: "#E0F2FE" },
        ink: {
          DEFAULT: "#18181B",
          mid: "#3F3F46",
          2: "#71717A",
          light: "#A1A1AA",
        },
        surface: { bg: "#FAFAF8", card: "#FFFFFF" },
        border: { DEFAULT: "#E4E4E7", soft: "#F4F4F5" },
      },
      borderRadius: {
        "r-2xs": "6px",
        "r-xs": "8px",
        "r-sm": "12px",
        "r-md": "14px",
        "r-lg": "20px",
        "r-xl": "24px",
        "r-full": "100px",
      },
      fontFamily: {
        display: ["DMSerifDisplay_400Regular"],
        sans: ["SpaceGrotesk_400Regular", "system-ui", "sans-serif"],
        "sans-medium": ["SpaceGrotesk_500Medium"],
        "sans-semibold": ["SpaceGrotesk_600SemiBold"],
        "sans-bold": ["SpaceGrotesk_700Bold"],
        mono: ["JetBrainsMono_400Regular", "monospace"],
        "mono-medium": ["JetBrainsMono_500Medium"],
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.04)",
        card: "0 4px 24px rgba(0,0,0,0.06)",
        float: "0 20px 60px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.04)",
        iris: "0 12px 40px rgba(124,92,252,0.3)",
        "iris-hover": "0 6px 24px rgba(124,92,252,0.4)",
      },
    },
  },
};
```

### 7.2 Font Loading (Expo)

```typescript
import {
  useFonts,
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
```

### 7.3 Required Packages

```
react-native-reanimated          (animations)
react-native-gesture-handler     (swipe, pan, tap)
react-native-svg                 (orbits, waveforms, path draw)
expo-blur                        (glassmorphism)
expo-linear-gradient             (card gradients)
rn-swiper-list                   (card deck swipe) — OR custom with gesture-handler
expo-font / @expo-google-fonts/* (typography)
```

### 7.4 Key Design Principles

1. **Serif for words, sans for UI, mono for data.** Never deviate.
2. **Warm, not cool.** Background is cream (#FAFAF8), not white. Grays are zinc, not slate.
3. **Depth through layers.** Card stacks, blob behind card, glassmorphism — not flat gradients.
4. **Spring over timing.** Prefer `withSpring` for interactive elements. Use `withTiming` only for progress/determinate animations.
5. **Semantic color consistency.** Mint = good, Coral = bad, Amber = in progress. Always.
6. **Dark buttons for CTAs.** Primary CTA buttons use `ink` (#18181B), not iris. Iris is for selected states and accents.
7. **Hatching for hidden content.** Diagonal stripes signal "something to reveal" — use for scratch cards and locked content.
8. **Organic shapes.** The blob, orbital paths, and curved SVG paths make the app feel alive vs. rigid rectangles.
