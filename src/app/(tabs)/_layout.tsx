import { Tabs } from 'expo-router'
import { TabBar } from '@components/ui/TabBar'
import { useRemoteSync } from '@hooks/useRemoteSync'

export default function TabLayout() {
  // Source-of-truth pull from Appwrite on tab session start + every foreground.
  useRemoteSync()

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: 'absolute' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
      <Tabs.Screen name="review" options={{ title: 'Review' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
