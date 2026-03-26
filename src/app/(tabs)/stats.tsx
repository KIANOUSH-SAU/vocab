import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useCurrentUser, useIsGuest, useUserStore } from '@store/userStore'
import { useUserWords, useStreak } from '@store/progressStore'
import { logoutSession, isAppwriteConfigured } from '@services/appwriteService'
import { FIELDS } from '@constants/fields'
import { colors, spacing, radii, shadows, fonts } from '@constants/theme'
import { AccentBlob } from '@components/ui/AccentBlob'
import { SectionLabel } from '@components/ui/SectionLabel'

const MOCK_ACTIVITY = [
  { day: 'Mon', value: 0.8 },
  { day: 'Tue', value: 1.0 },
  { day: 'Wed', value: 0.4 },
  { day: 'Thu', value: 0.9 },
  { day: 'Fri', value: 0.2 },
  { day: 'Sat', value: 0.0 },
  { day: 'Sun', value: 0.6 },
]

const MOCK_TIME_SPENT = '2h 15m'

// ─── Guest Gate ───────────────────────────────────────────────

function GuestGate() {
  return (
    <View style={guestStyles.container}>
      {/* Dimmed bars with lock */}
      <View style={guestStyles.lockVisual}>
        <View style={guestStyles.barsRow}>
          {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3].map((h, i) => (
            <View
              key={i}
              style={[guestStyles.bar, { height: h * 80, opacity: 0.12 }]}
            />
          ))}
        </View>
        <LinearGradient
          colors={[colors.skySoft, '#BAE6FD']}
          style={guestStyles.lockIcon}
        >
          <Ionicons name="lock-closed" size={32} color={colors.sky} />
        </LinearGradient>
      </View>

      <Text style={guestStyles.heading}>Unlock Your Progress</Text>
      <Text style={guestStyles.body}>
        Track your mastery over time. Create a free account to unlock analytics and never lose progress.
      </Text>

      <View style={guestStyles.actions}>
        <Pressable onPress={() => router.push('/(onboarding)/auth/signup')}>
          <LinearGradient
            colors={[colors.ink, '#27272A']}
            style={guestStyles.primaryBtn}
          >
            <Text style={guestStyles.primaryLabel}>Create Account</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(onboarding)/auth/login')}
          style={guestStyles.ghostBtn}
        >
          <Text style={guestStyles.ghostLabel}>Log In</Text>
        </Pressable>
      </View>
    </View>
  )
}

const guestStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 20,
  },
  lockVisual: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barsRow: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    width: '80%',
    justifyContent: 'center',
  },
  bar: {
    width: 24,
    borderRadius: 8,
    backgroundColor: colors.sky,
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7DD3FC',
  },
  heading: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink, textAlign: 'center' },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  actions: { width: '100%', gap: 12, marginTop: 8 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii.md,
    ...shadows.button,
  },
  primaryLabel: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: '#fff' },
  ghostBtn: { alignItems: 'center', paddingVertical: 12 },
  ghostLabel: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink2 },
})

// ─── Activity Chart ───────────────────────────────────────────

function ActivityChart() {
  const maxH = 80
  return (
    <View style={chartStyles.wrapper}>
      <View style={chartStyles.barsRow}>
        {MOCK_ACTIVITY.map((d) => {
          const barColor = d.value >= 0.8
            ? colors.mint
            : d.value >= 0.4
              ? colors.iris
              : colors.border
          return (
            <View key={d.day} style={chartStyles.barCol}>
              <View style={chartStyles.barTrack}>
                <LinearGradient
                  colors={d.value >= 0.4 ? [barColor, barColor] : [colors.border, colors.border]}
                  style={[chartStyles.barFill, { height: Math.max(d.value * maxH, 4) }]}
                />
              </View>
              <Text style={chartStyles.dayLabel}>{d.day}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const chartStyles = StyleSheet.create({
  wrapper: { paddingTop: 8 },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: '100%', height: 80, justifyContent: 'flex-end', alignItems: 'center' },
  barFill: { width: '70%', borderRadius: 6, minHeight: 4 },
  dayLabel: { fontFamily: fonts.monoMedium, fontSize: 10, color: colors.inkLight },
})

// ─── Stat Card ────────────────────────────────────────────────

function StatCard({ label, value, icon, gradient }: {
  label: string; value: string; icon: string; gradient: [string, string]
}) {
  return (
    <View style={statStyles.card}>
      <LinearGradient colors={gradient} style={statStyles.iconBg}>
        <Ionicons name={icon as any} size={16} color="#fff" />
      </LinearGradient>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  )
}

const statStyles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
    gap: 8,
    ...shadows.sm,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: fonts.sansBold, fontSize: 28, color: colors.ink },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.inkLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
})

// ─── Main Stats Screen ────────────────────────────────────────

export default function StatsScreen() {
  const user = useCurrentUser()
  const isGuest = useIsGuest()
  const userWords = useUserWords()
  const streak = useStreak()
  const logout = useUserStore((s) => s.logout)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (isGuest || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <GuestGate />
      </SafeAreaView>
    )
  }

  const all = Object.values(userWords)
  const mastered = all.filter((w) => w.status === 'mastered').length
  const totalAttempts = all.reduce((sum, w) => sum + w.totalAttempts, 0)
  const totalCorrect = all.reduce((sum, w) => {
    const c = typeof w.correctAttempts === 'string' ? parseInt(w.correctAttempts, 10) || 0 : w.correctAttempts
    return sum + c
  }, 0)
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

  const userFields = FIELDS.filter((f) => user.fields.includes(f.id))

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      if (isAppwriteConfigured) await logoutSession()
    } catch { /* ignore */ }
    logout()
    router.replace('/(onboarding)/')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { position: 'relative' }]}>
          <AccentBlob placement="top-left" colorTheme="blue" />
          <LinearGradient
            colors={[colors.iris, colors.irisDeeper]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {user.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{user.level}</Text>
            </View>
          </View>
        </View>

        {/* Field pills */}
        {userFields.length > 0 && (
          <View style={styles.fieldRow}>
            {userFields.map((f) => (
              <View key={f.id} style={[styles.fieldPill, { backgroundColor: `${f.color}15`, borderColor: f.color }]}>
                <View style={[styles.fieldDot, { backgroundColor: f.color }]} />
                <Text style={[styles.fieldPillText, { color: f.color }]}>{f.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stats Grid */}
        <View style={[styles.section, { position: 'relative' }]}>
          <AccentBlob placement="top-right" colorTheme="blue" />
          <SectionLabel title="OVERVIEW" />
          <View style={styles.grid}>
            <StatCard label="Current Streak" value={`${streak}`} icon="flame" gradient={['#FBBF24', '#F59E0B']} />
            <StatCard label="Accuracy" value={`${accuracy}%`} icon="checkmark-circle" gradient={['#2DD4A8', '#059669']} />
            <StatCard label="Mastered" value={`${mastered}`} icon="school" gradient={[colors.iris, colors.irisDeeper]} />
            <StatCard label="Time Spent" value={MOCK_TIME_SPENT} icon="time-outline" gradient={['#38BDF8', '#0284C7']} />
          </View>
        </View>

        {/* Activity */}
        <View style={[styles.section, { position: 'relative' }]}>
          <AccentBlob placement="top-left" colorTheme="blue" />
          <SectionLabel title="THIS WEEK" />
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Daily Activity</Text>
              <Text style={styles.chartSub}>Sessions completed</Text>
            </View>
            <ActivityChart />
          </View>
        </View>

        {/* Account */}
        <View style={[styles.section, { position: 'relative' }]}>
          <AccentBlob placement="bottom-right" colorTheme="blue" />
          <SectionLabel title="ACCOUNT" />
          <Pressable style={styles.settingRow}>
            <Ionicons name="swap-horizontal-outline" size={20} color={colors.iris} />
            <Text style={styles.settingText}>Change Fields or Level</Text>
            <View style={styles.settingArrow}>
              <Ionicons name="chevron-forward" size={14} color={colors.iris} />
            </View>
          </Pressable>

          <Pressable onPress={handleLogout} disabled={isLoggingOut} style={styles.logoutRow}>
            <Ionicons name="log-out-outline" size={18} color={colors.coral} />
            <Text style={styles.logoutText}>
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 24, paddingBottom: 100 },

  // Profile
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansBold, fontSize: 24, color: '#fff' },
  profileInfo: { gap: 4 },
  profileName: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.irisSoft,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelText: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.iris },

  // Fields
  fieldRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fieldDot: { width: 6, height: 6, borderRadius: 3 },
  fieldPillText: { fontFamily: fonts.sansMedium, fontSize: 12 },

  // Section
  section: { gap: 12 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  // Chart
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 20,
    ...shadows.card,
  },
  chartHeader: { gap: 2, marginBottom: 8 },
  chartTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.ink },
  chartSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink2 },

  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: 16,
    ...shadows.sm,
  },
  settingText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink, flex: 1 },
  settingArrow: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.irisSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  logoutText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.coral },
})
