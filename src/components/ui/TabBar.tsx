import { View, Pressable, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, radii, shadows, springConfigs } from '@constants/theme'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  home: { active: 'home', inactive: 'home-outline' },
  learn: { active: 'book', inactive: 'book-outline' },
  review: { active: 'refresh', inactive: 'refresh-outline' },
  stats: { active: 'stats-chart', inactive: 'stats-chart-outline' },
}

const TAB_LABELS: Record<string, string> = {
  home: 'Home',
  learn: 'Learn',
  review: 'Review',
  stats: 'Stats',
}

function TabItem({
  routeName,
  isFocused,
  onPress,
  dynamicLabel,
}: {
  routeName: string
  isFocused: boolean
  onPress: () => void
  dynamicLabel?: string
}) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.85, springConfigs.snappy)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfigs.snappy)
  }

  const icons = TAB_ICONS[routeName] ?? { active: 'help', inactive: 'help-outline' }
  const iconName = isFocused ? icons.active : icons.inactive
  const label = dynamicLabel ?? TAB_LABELS[routeName] ?? routeName

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tabIconContainer, animatedStyle]}>
        <Ionicons
          name={iconName as never}
          size={22}
          color={isFocused ? colors.ink : colors.inkLight}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? colors.ink : colors.inkLight },
        ]}
      >
        {label}
      </Text>
      {isFocused && <View style={styles.activeIndicator} />}
    </Pressable>
  )
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.outerContainer, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.pillContainer}>
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
    </View>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    height: 64,
    alignItems: 'center',
    ...shadows.tabBar,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 2,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.iris,
  },
})
