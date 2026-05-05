import { useEffect } from 'react'
import { View, Pressable, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  interpolate,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radii, fonts, springConfigs } from '@constants/theme'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  home: { active: 'home', inactive: 'home-outline' },
  learn: { active: 'book', inactive: 'book-outline' },
  review: { active: 'refresh', inactive: 'refresh-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
}

const TAB_LABELS: Record<string, string> = {
  home: 'Home',
  learn: 'Learn',
  review: 'Review',
  profile: 'Profile',
}

const TAB_THEME_COLORS: Record<string, string> = {
  home: '#8B5CF6',
  learn: '#10B981',
  review: '#F59E0B',
  profile: '#0EA5E9',
}

function TabItem({
  routeName,
  isFocused,
  onPress,
}: {
  routeName: string
  isFocused: boolean
  onPress: () => void
}) {
  const translateY = useSharedValue(0)
  const iconScale = useSharedValue(1)

  useEffect(() => {
    translateY.value = withSpring(isFocused ? -2 : 0, springConfigs.snappy)
    iconScale.value = withSpring(isFocused ? 1.15 : 1, springConfigs.snappy)
  }, [isFocused])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }))

  const icons = TAB_ICONS[routeName] ?? { active: 'help', inactive: 'help-outline' }
  const iconName = isFocused ? icons.active : icons.inactive
  const label = TAB_LABELS[routeName] ?? routeName
  const themeColor = TAB_THEME_COLORS[routeName] ?? '#8B5CF6'

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={animatedStyle}>
        {/* Active indicator bar */}
        {isFocused && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[styles.tabIndicator, { backgroundColor: themeColor }]}
          />
        )}
        <Animated.View style={[styles.tabIcon, iconAnimStyle]}>
          <Ionicons
            name={iconName as never}
            size={22}
            color={isFocused ? themeColor : colors.inkLight}
          />
        </Animated.View>
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? themeColor : colors.inkLight },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(8, insets.bottom) },
      ]}
    >
      <BlurView
        intensity={80}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      {state.routes.map((route, index) => (
        <TabItem
          key={route.key}
          routeName={route.name}
          isFocused={state.index === index}
          onPress={() => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!event.defaultPrevented && state.index !== index) {
              navigation.navigate(route.name)
            }
          }}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(228, 228, 231, 0.6)',
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tabItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
  tabIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
  },
})
