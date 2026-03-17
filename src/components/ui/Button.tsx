import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { colors, spacing, radii, typography, shadows } from '@constants/theme'

type IconLibrary = 'Ionicons' | 'MaterialCommunityIcons'

interface ButtonIcon {
  library: IconLibrary
  name: string
  position?: 'left' | 'right'
}

interface Props {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ButtonIcon
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  accessibilityLabel?: string
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const IconMap = {
  Ionicons,
  MaterialCommunityIcons,
} as const

const SIZE_STYLES = {
  sm: { paddingVertical: 8, paddingHorizontal: spacing[4], fontSize: 14 },
  md: { paddingVertical: 14, paddingHorizontal: spacing[6], fontSize: 16 },
  lg: { paddingVertical: spacing[4], paddingHorizontal: spacing[8], fontSize: 18 },
} as const

const ICON_SIZES = { sm: 16, md: 18, lg: 20 } as const

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
}: Props) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 })
  }

  const sizeStyle = SIZE_STYLES[size]
  const iconSize = ICON_SIZES[size]
  const iconPosition = icon?.position ?? 'right'

  const variantStyles = {
    primary: styles.primaryContainer,
    secondary: styles.secondaryContainer,
    ghost: styles.ghostContainer,
  }

  const textColors = {
    primary: '#FFFFFF',
    secondary: colors.textPrimary,
    ghost: colors.textSecondary,
  }

  const renderIcon = () => {
    if (!icon) return null
    const IconComponent = IconMap[icon.library]
    return (
      <IconComponent
        name={icon.name as never}
        size={iconSize}
        color={textColors[variant]}
      />
    )
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      style={[
        animatedStyle,
        styles.base,
        variantStyles[variant],
        {
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
        variant === 'primary' && shadows.button,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColors[variant]} />
      ) : (
        <View style={styles.content}>
          {iconPosition === 'left' && renderIcon()}
          <Text
            style={[
              styles.label,
              { fontSize: sizeStyle.fontSize, color: textColors[variant] },
            ]}
          >
            {label}
          </Text>
          {iconPosition === 'right' && renderIcon()}
        </View>
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryContainer: {
    backgroundColor: colors.primaryGreen,
  },
  secondaryContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  label: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
})
