# Skill: Animation Patterns

> **Auto-trigger:** Activate when implementing any animation, transition, gesture interaction, or micro-interaction in the Vocab App.

---

## Purpose

Provide exact, copy-paste-ready animation implementations using `react-native-reanimated` and `react-native-gesture-handler` that match the Vocab App design system.

---

## Shared Configuration

Always import and use these. Never hardcode spring/timing values inline.

```typescript
// src/utils/animations.ts
import { Easing } from "react-native-reanimated";

export const SPRING = {
  snappy: { damping: 15, stiffness: 150 },
  bouncy: { damping: 12, stiffness: 180, mass: 0.8 },
  gentle: { damping: 20, stiffness: 100 },
  quick: { damping: 20, stiffness: 200 },
} as const;

export const TIMING = {
  fast: { duration: 200, easing: Easing.out(Easing.cubic) },
  medium: { duration: 300, easing: Easing.out(Easing.cubic) },
  slow: { duration: 500, easing: Easing.out(Easing.cubic) },
} as const;

export const COLORS = {
  iris: "#7C5CFC",
  irisDark: "#6340E8",
  irisDeeper: "#5B3FD4",
  irisLight: "#A78BFA",
  irisSoft: "#F0ECFF",
  mint: "#2DD4A8",
  mintSoft: "#ECFDF5",
  coral: "#FB7185",
  coralSoft: "#FFF1F2",
  amber: "#FBBF24",
  amberSoft: "#FFFBEB",
  ink: "#18181B",
  ink2: "#71717A",
  border: "#E4E4E7",
  bg: "#FAFAF8",
} as const;
```

---

## Animation Implementations

### 1. Card Flip (3D)

```typescript
// src/components/FlashcardStack/animations.ts
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { SPRING } from "@/utils/animations";

export function useCardFlip() {
  const flip = useSharedValue(0); // 0 = front, 1 = back

  const toggle = () => {
    flip.value = withSpring(flip.value === 0 ? 1 : 0, SPRING.bouncy);
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: "hidden",
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` },
    ],
    backfaceVisibility: "hidden",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }));

  return { toggle, frontStyle, backStyle, isFlipped: flip };
}

// Usage:
// <Pressable onPress={toggle}>
//   <Animated.View style={[styles.cardFace, styles.front, frontStyle]}>
//     <Text style={styles.serif}>Algorithm</Text>
//     <Text style={styles.mono}>/ˈæl.ɡə.rɪ.ðəm/</Text>
//   </Animated.View>
//   <Animated.View style={[styles.cardFace, styles.back, backStyle]}>
//     <Text style={styles.sans}>{definition}</Text>
//     <Text style={styles.sansItalic}>{exampleSentence}</Text>
//   </Animated.View>
// </Pressable>
//
// Front face: gradient-deep bg, white text, shadow-iris
// Back face: white bg, 2px mint border, ink text
```

### 2. Swipe Card Gesture

```typescript
// src/hooks/useFlashcardGestures.ts
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler";
import { Dimensions } from "react-native";
import { SPRING, TIMING } from "@/utils/animations";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 500;
const MAX_ROTATION = 12; // degrees

export function useFlashcardGestures(
  onSwipeRight: () => void,
  onSwipeLeft: () => void,
) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3; // dampen vertical
    })
    .onEnd((e) => {
      const shouldSwipeRight =
        e.translationX > SWIPE_THRESHOLD || e.velocityX > VELOCITY_THRESHOLD;
      const shouldSwipeLeft =
        e.translationX < -SWIPE_THRESHOLD || e.velocityX < -VELOCITY_THRESHOLD;

      if (shouldSwipeRight) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, TIMING.medium);
        runOnJS(onSwipeRight)();
      } else if (shouldSwipeLeft) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, TIMING.medium);
        runOnJS(onSwipeLeft)();
      } else {
        // Snap back
        translateX.value = withSpring(0, SPRING.snappy);
        translateY.value = withSpring(0, SPRING.snappy);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-MAX_ROTATION, 0, MAX_ROTATION],
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  // Style for card behind (index 1 → front candidate)
  const nextCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    return {
      transform: [
        { scale: interpolate(progress, [0, 1], [0.94, 1.0]) },
        { translateY: interpolate(progress, [0, 1], [14, 0]) },
      ],
    };
  });

  return { panGesture, cardStyle, nextCardStyle, translateX };
}
```

### 3. Confetti Burst

```typescript
// src/components/ConfettiBurst/index.tsx
import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SPRING, COLORS } from "@/utils/animations";

const PARTICLE_COLORS = [
  COLORS.iris,
  COLORS.coral,
  COLORS.amber,
  COLORS.mint,
  COLORS.sky,
  COLORS.coral,
];

// Particle positions (relative to center, in px)
const PARTICLE_TARGETS = [
  { x: -15, y: -25 },
  { x: 20, y: -22 },
  { x: 28, y: 5 },
  { x: 15, y: 25 },
  { x: -18, y: 20 },
  { x: -25, y: -5 },
];

export function useConfetti() {
  const triggerScale = useSharedValue(1);
  const triggerRotation = useSharedValue(0);
  const particleOpacities = PARTICLE_COLORS.map(() => useSharedValue(0));
  const particleTranslates = PARTICLE_TARGETS.map(() => ({
    x: useSharedValue(0),
    y: useSharedValue(0),
  }));

  const fire = () => {
    // Main element bounce
    triggerScale.value = withSequence(
      withSpring(1.15, SPRING.bouncy),
      withSpring(1.0, SPRING.snappy),
    );
    triggerRotation.value = withSequence(
      withSpring(-5, SPRING.bouncy),
      withSpring(0, SPRING.snappy),
    );

    // Particles fly outward
    PARTICLE_TARGETS.forEach((target, i) => {
      particleOpacities[i].value = withDelay(
        i * 50,
        withSequence(
          withTiming(1, { duration: 100 }),
          withDelay(100, withTiming(0, { duration: 100 })),
        ),
      );
      particleTranslates[i].x.value = withDelay(
        i * 50,
        withSequence(
          withSpring(target.x, SPRING.bouncy),
          withTiming(0, { duration: 0 }),
        ),
      );
      particleTranslates[i].y.value = withDelay(
        i * 50,
        withSequence(
          withSpring(target.y, SPRING.bouncy),
          withTiming(0, { duration: 0 }),
        ),
      );
    });
  };

  return {
    fire,
    triggerScale,
    triggerRotation,
    particleOpacities,
    particleTranslates,
    PARTICLE_COLORS,
  };
}
```

### 4. Blob Morph

```typescript
// src/components/WordCard/animations.ts
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from "react-native-reanimated";

// Three keyframe states for organic border radii
const BLOB_STATES = [
  [60, 40, 50, 50, 50, 60, 40, 50], // State A
  [40, 60, 50, 50, 60, 40, 50, 50], // State B
  [50, 50, 40, 60, 40, 50, 60, 50], // State C
];

export function useBlobMorph() {
  const progress = useSharedValue(0);

  // Start the morph cycle: 0 → 1 → 2 → 0, repeating
  React.useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(2, { duration: 2000 }),
        withTiming(0, { duration: 2000 }),
      ),
      -1, // infinite
    );
  }, []);

  const blobStyle = useAnimatedStyle(() => {
    const p = progress.value;
    // Interpolate between the three states
    const getRadius = (index: number) => {
      if (p <= 1) {
        return interpolate(
          p,
          [0, 1],
          [BLOB_STATES[0][index], BLOB_STATES[1][index]],
        );
      } else {
        return interpolate(
          p,
          [1, 2],
          [BLOB_STATES[1][index], BLOB_STATES[2][index]],
        );
      }
    };

    return {
      borderTopLeftRadius: `${getRadius(0)}%`,
      borderTopRightRadius: `${getRadius(1)}%`,
      borderBottomRightRadius: `${getRadius(2)}%`,
      borderBottomLeftRadius: `${getRadius(3)}%`,
      // Note: In React Native, complex organic radii may need a different approach.
      // Consider using react-native-svg Path with animated d attribute instead.
    };
  });

  return blobStyle;
}
```

### 5. Shimmer Progress

```typescript
// src/components/ShimmerProgress/index.tsx
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

export function useShimmer() {
  const shimmerX = useSharedValue(-1);

  React.useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(2, { duration: 2500, easing: Easing.linear }),
      -1,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value * 100 }], // percentage-based
  }));

  return shimmerStyle;
}

// Usage in component:
// <View style={[styles.barBg, { width: '100%', height: 24, borderRadius: 12,
//                                backgroundColor: '#F4F4F5', overflow: 'hidden' }]}>
//   <View style={[styles.barFill, { width: `${percent}%`, borderRadius: 12,
//                                    overflow: 'hidden' }]}>
//     <Animated.View style={[styles.shimmerLayer, shimmerStyle]}>
//       <LinearGradient
//         colors={['#7C5CFC', '#A78BFA', '#7C5CFC']}
//         start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//         style={StyleSheet.absoluteFill}
//       />
//     </Animated.View>
//     <Text style={styles.percentLabel}>{percent}%</Text>
//   </View>
// </View>
//
// percentLabel: { position: 'absolute', right: 8, fontFamily: 'JetBrainsMono_500Medium',
//                  fontSize: 11, color: 'white', fontWeight: '700' }
```

### 6. Pulse Ring

```typescript
// src/components/PulseRing/index.tsx
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";

interface PulseRingProps {
  color: string; // e.g., '#FBBF24' for amber
  size: number; // diameter of the element this wraps
  maxExpand?: number; // extra px the ring grows
}

export function usePulseRing(color: string, maxExpand = 6) {
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true, // reverse
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: -maxExpand,
    left: -maxExpand,
    right: -maxExpand,
    bottom: -maxExpand,
    borderRadius: 999,
    backgroundColor: color,
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.15]) }],
  }));

  return ringStyle;
}

// Usage:
// <View style={{ position: 'relative' }}>
//   <Animated.View style={pulseRingStyle} />
//   <View style={styles.todayDot}>
//     <Text style={styles.dayInitial}>S</Text>
//   </View>
// </View>
```

### 7. SVG Path Draw

```typescript
// src/components/LearningPath/animations.ts
import {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const PATH_LENGTH = 300; // approximate, measure your actual path

export function usePathDraw() {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
    );
  }, []);

  const animatedPathProps = useAnimatedProps(() => ({
    strokeDashoffset: PATH_LENGTH - progress.value * PATH_LENGTH,
  }));

  return animatedPathProps;
}

// Usage with react-native-svg:
// import { Path as SvgPath } from 'react-native-svg';
// import Animated from 'react-native-reanimated';
// const AnimatedPath = Animated.createAnimatedComponent(SvgPath);
//
// <Svg viewBox="0 0 180 60">
//   <AnimatedPath
//     d="M10 50 Q45 10 90 30 T170 15"
//     stroke="#7C5CFC"
//     strokeWidth={3}
//     fill="none"
//     strokeLinecap="round"
//     strokeDasharray={PATH_LENGTH}
//     animatedProps={animatedPathProps}
//   />
//   <Circle cx={10} cy={50} r={4} fill="#7C5CFC" />
//   <Circle cx={90} cy={30} r={4} fill="#2DD4A8" />
//   <Circle cx={170} cy={15} r={4} fill="#FB7185" />
// </Svg>
```

### 8. Button Press Feedback

```typescript
// src/hooks/usePressAnimation.ts
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { SPRING } from "@/utils/animations";

export function usePressAnimation(scaleDown = 0.97) {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(scaleDown, SPRING.quick);
  };
  const onPressOut = () => {
    scale.value = withSpring(1, SPRING.snappy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { onPressIn, onPressOut, animatedStyle };
}

// Usage:
// const { onPressIn, onPressOut, animatedStyle } = usePressAnimation();
// <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
//   <Animated.View style={[styles.button, animatedStyle]}>
//     <Text>Check Answer</Text>
//   </Animated.View>
// </Pressable>
```

### 9. Float / Hover (Orbit Dots)

```typescript
// src/hooks/useFloat.ts
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

export function useFloat(amplitude = 4, duration = 3000, delay = 0) {
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-amplitude, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true, // reverse
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return style;
}

// Usage for orbit dots (staggered):
// {categories.map((cat, i) => {
//   const floatStyle = useFloat(4, 3000, i * 500);
//   return (
//     <Animated.View key={i} style={[styles.orbitDot, { backgroundColor: cat.color }, floatStyle]}>
//       <Text>{cat.count}</Text>
//     </Animated.View>
//   );
// })}
```

### 10. Word Morph / Text Rotate

```typescript
// src/components/WordRotator/index.tsx
import {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
  withRepeat,
} from "react-native-reanimated";

interface Props {
  words: Array<{ text: string; color: string }>;
  cycleDuration?: number; // total cycle time in ms (default 6000)
}

export function useWordRotator(wordCount: number, cycleDuration = 6000) {
  const holdTime = cycleDuration / wordCount; // time each word is visible
  const enterDuration = 300;
  const exitDuration = 300;

  return Array.from({ length: wordCount }, (_, i) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    React.useEffect(() => {
      const delay = i * holdTime;
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: enterDuration }), // fade in
            withDelay(
              holdTime - enterDuration - exitDuration,
              withTiming(0, { duration: exitDuration }),
            ), // hold then fade out
            withDelay(cycleDuration - holdTime, withTiming(0, { duration: 0 })), // wait for cycle
          ),
          -1,
        ),
      );
      translateY.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0, { duration: enterDuration }), // slide up
            withDelay(
              holdTime - enterDuration - exitDuration,
              withTiming(-20, { duration: exitDuration }),
            ),
            withTiming(20, { duration: 0 }), // reset
            withDelay(
              cycleDuration - holdTime,
              withTiming(20, { duration: 0 }),
            ),
          ),
          -1,
        ),
      );
    }, []);

    return useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
      position: "absolute",
    }));
  });
}

// Usage:
// const words = [
//   { text: 'Paradigm', color: '#7C5CFC' },
//   { text: 'Resilient', color: '#2DD4A8' },
//   { text: 'Algorithm', color: '#FB7185' },
// ];
// const styles = useWordRotator(words.length);
//
// <View style={{ height: 38, overflow: 'hidden' }}>
//   {words.map((w, i) => (
//     <Animated.Text key={i} style={[{ fontFamily: 'DMSerifDisplay_400Regular',
//       fontSize: 22, color: w.color }, styles[i]]}>
//       {w.text}
//     </Animated.Text>
//   ))}
// </View>
```

---

## Rules

1. **Never inline spring/timing values.** Always import from `src/utils/animations.ts`.
2. **All gesture logic in hooks.** Per architecture rules, complex sequential flows (especially audio + gestures) must be in isolated hooks.
3. **Use `runOnJS` for callbacks.** When calling JS functions from gesture handlers or worklets.
4. **Performance:** Avoid `useAnimatedStyle` that depends on props that change frequently. Use `useDerivedValue` for computed animation values.
5. **Cancel animations:** When unmounting, set shared values to their final state with `cancelAnimation()` if needed.
