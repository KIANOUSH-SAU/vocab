# Skill: Component Builder

> **Auto-trigger:** Activate when asked to create or scaffold any new UI component for the Vocab App.

---

## Purpose

Build React Native components that perfectly match the Vocab App design system. This skill provides exact implementation blueprints for every designed component.

## Dependencies

- Must read `DESIGN-SYSTEM.md` before building any component.
- Must check the `skill-design-system.md` rules.
- Must check existing components in `src/components/` for potential reuse.

---

## Component Blueprints

### 1. WordCard (Blob Style)

```typescript
// src/components/WordCard/index.tsx
//
// Props:
//   word: string
//   phonetic: string
//   definition: string
//   field: 'engineering' | 'health' | 'law' | 'sports' | 'education'
//   level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
//   onPlayAudio?: () => void
//
// Structure:
//   <View style={{ position: 'relative' }}>
//     <AnimatedBlobShape />       ← Morphing blob behind card
//     <View style={cardInner}>   ← White card surface
//       <Text style={label}>WORD OF THE DAY</Text>
//       <Text style={wordMain}>{word}</Text>        ← DM Serif Display, 30px
//       <Text style={phonetic}>{phonetic}</Text>    ← JetBrains Mono, 13px, iris
//       <View style={divider} />
//       <Text style={definition}>{definition}</Text> ← Space Grotesk, 14px, ink2
//       <View style={footer}>
//         <FieldChip field={field} />
//         <PlayButton onPress={onPlayAudio} />
//       </View>
//     </View>
//   </View>
//
// Key styles:
//   cardInner: { bg: white, borderRadius: 24, padding: 24, shadowColor: '#7C5CFC',
//                shadowOffset: {0,8}, shadowOpacity: 0.12, shadowRadius: 32, elevation: 8 }
//   label: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 11, color: '#71717A',
//            letterSpacing: 1.5, textTransform: 'uppercase' }
//   wordMain: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 30, color: '#18181B',
//               letterSpacing: -0.5 }
//   phonetic: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 13, color: '#7C5CFC' }
//   definition: { fontFamily: 'SpaceGrotesk_400Regular', fontSize: 14, color: '#71717A',
//                 lineHeight: 21 }
//
// Blob animation (separate animated component):
//   - Use 8 shared values for border-radius percentages
//   - withRepeat + withTiming cycling through 3 states over 6000ms
//   - Background: LinearGradient(['#C4B5FD', '#A78BFA']), opacity: 0.5
//   - Size: 120x120, position: absolute, top: -20, right: -10
```

### 2. FlashcardStack

```typescript
// src/components/FlashcardStack/index.tsx
//
// Props:
//   words: Word[]
//   onSwipeRight: (word: Word) => void  // know it
//   onSwipeLeft: (word: Word) => void   // skip
//   onFlip: (word: Word) => void
//   onPlayAudio: (word: Word) => void
//
// CRITICAL: This is a gesture-heavy component.
// All gesture logic MUST live in a dedicated hook:
//   src/hooks/useFlashcardGestures.ts
//
// Stack rendering (3 visible cards):
//   {words.slice(currentIndex, currentIndex + 3).reverse().map((word, i) => {
//     const layer = 2 - i; // 0=back, 1=mid, 2=front
//     return (
//       <Animated.View style={[
//         styles.card,
//         { zIndex: layer + 1 },
//         layer === 2 ? frontCardAnimatedStyle : stackAnimatedStyle(layer)
//       ]}>
//         {layer === 2 ? <FlashcardContent word={word} /> : null}
//       </Animated.View>
//     );
//   })}
//
// Layer transforms:
//   Front (layer 2): scale 1.0, translateY 0, gradient-deep bg, shadow-iris
//   Mid (layer 1): scale 0.94, translateY 14, gradient(#C4B5FD → #A78BFA)
//   Back (layer 0): scale 0.88, translateY 24, iris-soft bg
//
// Front card gesture:
//   Gesture.Pan()
//     .onUpdate: translateX = e.translationX, rotate = translationX * 0.05 (max ±12deg)
//     .onEnd: if |translationX| > 120 || |velocityX| > 500:
//               → exit animation (translateX ±screenWidth, rotate ±15deg, opacity 0)
//               → call onSwipeRight or onSwipeLeft
//             else:
//               → snap back with SPRING_CONFIGS.snappy
//
// Card flip (on tap):
//   Use a shared value `isFlipped` (0 or 1)
//   Toggle with withSpring(bouncy)
//   Front: rotateY interpolated 0→90deg (hide at 90)
//   Back: rotateY interpolated 90→0deg (show at 90)
//   Both faces: backfaceVisibility 'hidden'
//
// Stack promotion:
//   When front card exits, remaining cards transition:
//   - scale: withTiming(nextScale, { duration: 300, easing: Easing.out(Easing.cubic) })
//   - translateY: withTiming(nextTranslateY, same)
```

### 3. GlassQuiz (Fill-in-the-Blank)

```typescript
// src/components/GlassQuiz/index.tsx
//
// Props:
//   sentence: string (with {blank} placeholder)
//   correctAnswer: string
//   options: string[]
//   questionNumber: number
//   totalQuestions: number
//   timeRemaining?: number
//   onAnswer: (answer: string) => void
//
// CRITICAL: Use expo-blur BlurView for the glass effect.
//
// Structure:
//   <View style={gradientBackground}>  ← gradient-glass-bg behind
//     <BlurView intensity={20} style={glassPanel}>
//       <View style={header}>
//         <StepBadge>Q{n} of {total}</StepBadge>
//         <TimerText>{formatTime(timeRemaining)}</TimerText>
//       </View>
//       <SentenceWithBlank sentence={sentence} filledWord={selectedWord} />
//       <WordChips options={options} selected={selectedWord} onSelect={handleSelect} />
//     </BlurView>
//   </View>
//
// WordChip animation on selection:
//   withSpring(scale: 1.05, SPRING_CONFIGS.quick)
//   Background transitions: white → iris, text transitions: ink → white
//
// Glass panel styles:
//   { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 20,
//     borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
//     padding: 22, overflow: 'hidden' }
```

### 4. OrbitProgress

```typescript
// src/components/OrbitProgress/index.tsx
//
// Props:
//   masteryPercent: number
//   categories: Array<{ label: string, count: number, color: string }>
//
// Implementation with react-native-svg:
//   <Svg width={200} height={200}>
//     <Circle cx={100} cy={100} r={96} stroke="#E4E4E7" strokeWidth={1.5}
//             strokeDasharray="4 4" fill="none" />
//     <Circle cx={100} cy={100} r={66} stroke="#E4E4E7" strokeWidth={1.5}
//             strokeDasharray="4 4" fill="none" />
//     <Circle cx={100} cy={100} r={36} stroke="#E4E4E7" strokeWidth={1.5}
//             strokeDasharray="4 4" fill="none" />
//   </Svg>
//
// Center node: Positioned View on top of SVG
//   { width: 48, height: 48, borderRadius: 14, bg: '#18181B', centered }
//   Text: "{percent}%", JetBrains Mono, 13px, white, bold
//
// Orbit dots: Positioned Views at calculated angles
//   Position on outer ring using trigonometry:
//     x = centerX + radius * cos(angle)
//     y = centerY + radius * sin(angle)
//   Distribute 5 dots evenly (72° apart)
//
// Each dot:
//   { width: 28, height: 28, borderRadius: 14, bg: category.color }
//   Count text: 10px, white, bold
//   Float animation: translateY 0↔-4, staggered by index * 500ms
```

### 5. ScratchRevealCard

```typescript
// src/components/ScratchRevealCard/index.tsx
//
// Props:
//   word: string
//   answer: string
//   onReveal: () => void
//
// State: isRevealed (boolean, animated with shared value)
//
// Structure:
//   <View style={container}>
//     <View style={questionSection}>
//       <Text style={label}>CAN YOU RECALL?</Text>
//       <Text style={word}>{word}</Text>         ← DM Serif Display
//     </View>
//     <Pressable style={revealSection} onPress={reveal}>
//       <Animated.View style={[overlayStyle]}>   ← Fades out
//         <Text>Swipe to reveal</Text>
//       </Animated.View>
//       <Animated.View style={[answerStyle]}>    ← Fades in
//         <Text>{answer} ✓</Text>
//       </Animated.View>
//     </Pressable>
//   </View>
//
// Reveal section background:
//   Before reveal: Diagonal stripe pattern using a repeating SVG or image
//     (45deg stripes, alternating iris-soft / #E8E0FF, 8px width)
//   After reveal: mint-soft background
//
// Animation on reveal:
//   overlay: opacity 1→0, translateY 0→-10, duration 400ms
//   answer: opacity 0→1, translateY 10→0, duration 400ms
//   background: interpolateColor from '#F0ECFF' to '#ECFDF5'
```

### 6. WaveformPlayer

```typescript
// src/components/WaveformPlayer/index.tsx
//
// Props:
//   word: string
//   voiceName: string
//   audioUri: string
//   duration: number (seconds)
//   waveformData?: number[] (array of 30 bar heights, 10-32 range)
//
// CRITICAL: Audio playback logic MUST be in a dedicated hook:
//   src/hooks/useAudioPlayer.ts
//
// Waveform bars:
//   30 bars in a flex row, gap 2, height 32, align center
//   Each bar: width 3, borderRadius 2, variable height from waveformData
//
// Bar coloring based on playback progress:
//   const barState = index < playedIndex ? 'played'
//                  : index < playedIndex + 2 ? 'active'
//                  : 'upcoming';
//
//   played: { backgroundColor: 'rgba(124,92,252,0.4)' }
//   active: { backgroundColor: '#7C5CFC' }
//   upcoming: { backgroundColor: '#E4E4E7' }
//
// Play button:
//   44px circle, LinearGradient(['#7C5CFC', '#6340E8'])
//   Shadow: shadow-iris
//   On press: withSpring scale 1.08 (quick config)
//
// If waveformData not provided, generate random:
//   Array.from({length: 30}, () => Math.floor(Math.random() * 22) + 10)
```

### 7. StreakWidget

```typescript
// src/components/StreakWidget/index.tsx
//
// Props:
//   streakCount: number
//   weekProgress: Array<'done' | 'today' | 'future'>
//
// Flame animation:
//   scale: withRepeat(withSequence(
//     withTiming(1.1, { duration: 375 }),
//     withTiming(1.0, { duration: 375 }),
//   ), -1)
//   rotation: withRepeat(withSequence(
//     withTiming(-3deg, { duration: 500 }),
//     withTiming(3deg, { duration: 500 }),
//   ), -1, true)
//
// Today dot pulse ring:
//   An Animated.View behind the dot
//   Scale: withRepeat(withTiming(1.5, { duration: 1000 }), -1, true)
//   Opacity: interpolate(scale, [1, 1.5], [0.3, 0])
//   Background: amber at 30%
//
// Day labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S']
// Styles:
//   done: { bg: '#7C5CFC', color: white }
//   today: { bg: '#FBBF24', color: white } + pulse ring
//   future: { bg: '#F4F4F5', color: '#71717A' }
```

### 8. QuizOption

```typescript
// src/components/QuizOption/index.tsx
//
// Props:
//   letter: 'A' | 'B' | 'C' | 'D'
//   text: string
//   state: 'default' | 'selected' | 'correct' | 'wrong'
//   onPress: () => void
//
// Animated state transitions:
//   default → selected: border iris, bg iris-soft, badge bg iris + white text
//   default → correct: border mint, bg mint-soft, badge bg mint + white text
//   default → wrong: border coral, bg coral-soft, badge bg coral + white text
//
// Use useAnimatedStyle with interpolateColor for smooth color transitions
// On press: withSpring scale 0.97 → 1.0 (snappy)
//
// Letter badge:
//   { width: 28, height: 28, borderRadius: 8, justifyContent: 'center',
//     alignItems: 'center' }
//   Text: JetBrains Mono (not Space Grotesk!), 12px, bold
```

---

## File Placement Rules

| File Type               | Directory                                   | Naming                       |
| ----------------------- | ------------------------------------------- | ---------------------------- |
| Component               | `src/components/{PascalName}/index.tsx`     | PascalCase folder            |
| Styles                  | `src/components/{PascalName}/styles.ts`     | Co-located                   |
| Animations              | `src/components/{PascalName}/animations.ts` | Co-located                   |
| Hooks (component logic) | `src/hooks/use{Name}.ts`                    | camelCase with "use" prefix  |
| Animation utils         | `src/utils/animations.ts`                   | Shared spring/timing configs |
| Theme constants         | `src/constants/theme.ts`                    | All tokens                   |
| Type definitions        | `src/types/components.ts`                   | Shared prop types            |

## Checklist Before Marking Component Done

- [ ] Uses only design system colors (no raw hex outside theme)
- [ ] Uses correct font family for each text role (serif/sans/mono)
- [ ] Border radii match the spec (20 for cards, 14 for buttons, etc.)
- [ ] Animations use predefined spring configs
- [ ] Background color is `#FAFAF8`, not white, where it should be screen bg
- [ ] All interactive elements have press feedback (spring scale)
- [ ] Complex gesture logic lives in a dedicated hook, not inline
- [ ] Component is exported from an index file
- [ ] TypeScript props are defined with proper types
