import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

export type AccentPlacement =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

export type AccentColorTheme = "purple" | "green" | "orange" | "blue";

const THEMES: Record<AccentColorTheme, [string, string]> = {
  purple: ["#C4B5FD", "#A78BFA"],
  green: ["#A7F3D0", "#34D399"],
  orange: ["#FDBA74", "#FB923C"],
  blue: ["#BAE6FD", "#38BDF8"],
};

export function AccentBlob({
  placement = "top-right",
  colorTheme = "purple",
  opacity = 0.3,
}: {
  placement?: AccentPlacement;
  colorTheme?: AccentColorTheme;
  opacity?: number;
}) {
  const morph = useSharedValue(0);

  useEffect(() => {
    morph.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const blobStyle = useAnimatedStyle(() => {
    const t = morph.value;
    return {
      borderTopLeftRadius: 60 + t * 20,
      borderTopRightRadius: 40 + t * 30,
      borderBottomLeftRadius: 50 - t * 15,
      borderBottomRightRadius: 50 + t * 20,
    };
  });

  const positionStyle: any = {};
  if (placement === "top-right") {
    positionStyle.top = -30;
    positionStyle.right = -20;
  }
  if (placement === "top-left") {
    positionStyle.top = -30;
    positionStyle.left = -20;
  }
  if (placement === "bottom-right") {
    positionStyle.bottom = -30;
    positionStyle.right = -20;
  }
  if (placement === "bottom-left") {
    positionStyle.bottom = -30;
    positionStyle.left = -20;
  }

  const gradientColors = THEMES[colorTheme];

  return (
    <Animated.View style={[styles.blobBase, positionStyle, { opacity }, blobStyle]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  blobBase: {
    width: 160,
    height: 160,
    position: "absolute",
  },
});
