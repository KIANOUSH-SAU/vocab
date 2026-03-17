import { View, StyleSheet, Platform } from 'react-native'
import type { ReactNode } from 'react'
import { colors } from '@constants/theme'

interface Props {
  children: ReactNode
}

/** Constrains content to a mobile-like width on web. Transparent on native. */
export function MaxWidthContainer({ children }: Props) {
  if (Platform.OS !== 'web') return <>{children}</>

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
})
