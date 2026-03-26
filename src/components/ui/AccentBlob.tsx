import React, { useEffect } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// 4 blob shape keyframes — each has exactly 6 cubic bezier segments (32 numbers)
const BLOB_SHAPES = [
  "M100,20 C140,20 170,40 180,80 C190,120 180,160 150,180 C120,200 70,200 40,170 C10,140 10,100 20,70 C30,40 60,20 100,20 Z",
  "M110,15 C150,25 185,50 185,90 C185,130 170,165 140,185 C110,205 65,195 35,165 C5,135 0,95 15,60 C30,25 70,5 110,15 Z",
  "M95,25 C135,15 175,35 185,75 C195,115 175,155 145,175 C115,195 75,205 45,180 C15,155 5,110 15,70 C25,30 55,35 95,25 Z",
  "M105,10 C145,15 180,45 185,85 C190,125 175,165 145,185 C115,205 70,200 40,175 C10,150 5,105 20,65 C35,25 65,5 105,10 Z",
];

function parsePathNumbers(d: string): number[] {
  "worklet";
  return d.match(/-?\d+/g)!.map(Number);
}

function buildPath(nums: number[]): string {
  "worklet";
  const [
    m1, m2,
    c1, c2, c3, c4, c5, c6,
    c7, c8, c9, c10, c11, c12,
    c13, c14, c15, c16, c17, c18,
    c19, c20, c21, c22, c23, c24,
    c25, c26, c27, c28, c29, c30,
  ] = nums;
  return `M${m1},${m2} C${c1},${c2} ${c3},${c4} ${c5},${c6} C${c7},${c8} ${c9},${c10} ${c11},${c12} C${c13},${c14} ${c15},${c16} ${c17},${c18} C${c19},${c20} ${c21},${c22} ${c23},${c24} C${c25},${c26} ${c27},${c28} ${c29},${c30} Z`;
}

const parsedShapes = BLOB_SHAPES.map(parsePathNumbers);

export type AccentPlacement =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

export type AccentColorTheme = "purple" | "green" | "orange" | "blue";

const THEME_COLORS: Record<AccentColorTheme, string> = {
  purple: "#A78BFA",
  green: "#34D399",
  orange: "#FB923C",
  blue: "#38BDF8",
};

export function AccentBlob({
  placement = "top-right",
  colorTheme = "purple",
  opacity = 0.25,
  size = 200,
}: {
  placement?: AccentPlacement;
  colorTheme?: AccentColorTheme;
  opacity?: number;
  size?: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(3, {
        duration: 8000 + Math.random() * 3000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, []);

  const animatedProps = useAnimatedProps(() => {
    "worklet";
    const p = progress.value;
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

  const fillColor = THEME_COLORS[colorTheme];

  return (
    <View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          opacity,
          pointerEvents: "none",
        },
        positionStyle,
      ]}
    >
      <Svg viewBox="0 0 200 200" width={size} height={size}>
        <AnimatedPath animatedProps={animatedProps} fill={fillColor} />
      </Svg>
    </View>
  );
}
