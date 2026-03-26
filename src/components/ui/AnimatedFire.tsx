import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Ellipse } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";

// ─── Ember Particle ──────────────────────────────────────────

function EmberParticle({ delay, driftX }: { delay: number; driftX: number }) {
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

// ─── Animated Fire ───────────────────────────────────────────

export function AnimatedFire({ size = 80 }: { size?: number }) {
  const mainAnim = useSharedValue(0);
  const leftAnim = useSharedValue(0);
  const rightAnim = useSharedValue(0);
  const innerAnim = useSharedValue(0);

  useEffect(() => {
    mainAnim.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
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
    <View style={styles.fireWrapper}>
      <View style={[styles.fireContainer, { width: size, height: size }]}>
        {/* Layer 1: Outer flame */}
        <Animated.View style={[StyleSheet.absoluteFill, mainStyle]}>
          <Svg viewBox="0 0 80 80" width={size} height={size}>
            <Path
              d="M40,70 C25,70 15,55 15,42 C15,28 25,18 32,10 C34,8 36,12 35,16 C34,20 38,14 40,8 C42,14 46,20 45,16 C44,12 46,8 48,10 C55,18 65,28 65,42 C65,55 55,70 40,70 Z"
              fill="#FF6B00"
            />
          </Svg>
        </Animated.View>

        {/* Layer 2: Left flicker */}
        <Animated.View style={[StyleSheet.absoluteFill, leftStyle]}>
          <Svg viewBox="0 0 80 80" width={size} height={size}>
            <Path
              d="M35,68 C28,68 22,58 22,48 C22,38 28,30 33,24 C34,23 35,26 34,28 C33,30 36,25 38,20 C38,28 42,38 35,48 C32,52 32,62 35,68 Z"
              fill="#FF8C00"
            />
          </Svg>
        </Animated.View>

        {/* Layer 3: Right flicker */}
        <Animated.View style={[StyleSheet.absoluteFill, rightStyle]}>
          <Svg viewBox="0 0 80 80" width={size} height={size}>
            <Path
              d="M45,68 C52,68 58,58 58,48 C58,38 52,30 47,24 C46,23 45,26 46,28 C47,30 44,25 42,20 C42,28 38,38 45,48 C48,52 48,62 45,68 Z"
              fill="#FF8C00"
            />
          </Svg>
        </Animated.View>

        {/* Layer 4: Inner core */}
        <Animated.View style={[StyleSheet.absoluteFill, innerStyle]}>
          <Svg viewBox="0 0 80 80" width={size} height={size}>
            <Path
              d="M40,68 C34,68 30,60 30,52 C30,44 34,38 37,32 C38,31 39,34 38,36 C37,38 40,34 40,28 C40,34 43,38 42,36 C41,34 42,31 43,32 C46,38 50,44 50,52 C50,60 46,68 40,68 Z"
              fill="#FFD700"
            />
          </Svg>
        </Animated.View>

        {/* Layer 5: Hottest core ellipse */}
        <View style={StyleSheet.absoluteFill}>
          <Svg viewBox="0 0 80 80" width={size} height={size}>
            <Ellipse cx="40" cy="58" rx="6" ry="8" fill="#FFF3C4" opacity={0.7} />
          </Svg>
        </View>
      </View>

      {/* Ember particles */}
      <View style={styles.emberContainer}>
        <EmberParticle delay={0} driftX={-15} />
        <EmberParticle delay={400} driftX={20} />
        <EmberParticle delay={800} driftX={-8} />
        <EmberParticle delay={1200} driftX={12} />
        <EmberParticle delay={1600} driftX={-20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fireWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  fireContainer: {
    position: "relative",
    shadowColor: "#FFD700",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  emberContainer: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    width: 40,
    height: 20,
    alignItems: "center",
  },
});
