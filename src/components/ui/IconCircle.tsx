import { View, StyleSheet } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { radii } from '@constants/theme'

type IconLibrary = 'Ionicons' | 'MaterialCommunityIcons'

interface Props {
  library: IconLibrary
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  bgOpacity?: number
}

const CIRCLE_SIZES = { sm: 32, md: 44, lg: 56 } as const
const ICON_RATIO = 0.55

const IconMap = {
  Ionicons,
  MaterialCommunityIcons,
} as const

export function IconCircle({ library, name, color, size = 'md', bgOpacity = 0.15 }: Props) {
  const circleDiameter = CIRCLE_SIZES[size]
  const iconSize = Math.round(circleDiameter * ICON_RATIO)
  const IconComponent = IconMap[library]

  return (
    <View
      style={[
        styles.circle,
        {
          width: circleDiameter,
          height: circleDiameter,
          backgroundColor: `${color}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`,
        },
      ]}
    >
      <IconComponent name={name as never} size={iconSize} color={color} />
    </View>
  )
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
