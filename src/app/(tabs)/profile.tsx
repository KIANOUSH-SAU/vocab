import { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import { useCurrentUser, useIsGuest, useUserStore } from '@store/userStore'
import {
  useUserWords,
  useStreak,
  useSessionDates,
} from '@store/progressStore'
import { useTabFocusSync } from '@hooks/useRemoteSync'
import { useAvatarUpload, useAvatarUrl } from '@hooks/useAvatarUpload'
import { useEditProfile } from '@hooks/useEditProfile'
import { logoutSession, isAppwriteConfigured } from '@services/appwriteService'
import { useWordStore } from '@store/wordStore'
import { colors, radii, shadows, fonts, spacing } from '@constants/theme'
import { AccentBlob } from '@components/ui/AccentBlob'
import { SectionLabel } from '@components/ui/SectionLabel'
import { SessionCalendar } from '@components/profile/SessionCalendar'
import {
  EditFieldModal,
  type EditFieldConfig,
} from '@components/profile/EditFieldModal'

// ─── SVG Icons ────────────────────────────────────────────────

function FlameIcon({ size = 14, color = '#D97706' }: { size?: number; color?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <Path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 2-6 0 3.5 2.56 5.5 4 6.5 1.15.8 1.5 2.39 1.5 3.5a6 6 0 0 1-12 0c0-.59.12-1.2.36-1.78.28-.68.84-1.22 1.64-1.22.65 0 1.2.46 1 1"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function GraduationCapIcon({ size = 14, color = '#6D28D9' }: { size?: number; color?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <Path d="M22 10v6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 10l10-5 10 5-10 5z" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function CameraIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <Path
        d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
        stroke={color}
        strokeWidth={2.2}
      />
    </Svg>
  )
}

// ─── Guest Gate ──────────────────────────────────────────────

function GuestGate() {
  return (
    <View style={guestStyles.container}>
      <LinearGradient
        colors={[colors.skySoft, '#BAE6FD']}
        style={guestStyles.lockIcon}
      >
        <Ionicons name="lock-closed" size={32} color={colors.sky} />
      </LinearGradient>

      <Text style={guestStyles.heading}>Unlock Your Profile</Text>
      <Text style={guestStyles.body}>
        Track your mastery over time. Create a free account to unlock analytics
        and never lose progress.
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
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7DD3FC',
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.ink,
    textAlign: 'center',
  },
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

// ─── Hero ────────────────────────────────────────────────────

function ProfileHero({
  name,
  level,
}: {
  name: string
  level: string
}) {
  const avatarUrl = useAvatarUrl()
  const { isUploading, pickAndUpload } = useAvatarUpload()
  const initial = name?.charAt(0).toUpperCase() || '?'

  return (
    <View style={heroStyles.wrap}>
      <LinearGradient
        colors={[colors.irisSoft, colors.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AccentBlob placement="top-right" colorTheme="blue" />
      <AccentBlob placement="bottom-left" colorTheme="orange" />

      <View style={heroStyles.center}>
        <Pressable
          onPress={pickAndUpload}
          accessibilityLabel="Change profile picture"
          accessibilityRole="button"
          style={heroStyles.avatarRing}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={heroStyles.avatarImg} />
          ) : (
            <LinearGradient
              colors={[colors.iris, colors.irisDeeper]}
              style={heroStyles.avatarGradient}
            >
              <Text style={heroStyles.avatarInitial}>{initial}</Text>
            </LinearGradient>
          )}

          <View style={heroStyles.cameraBubble}>
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <CameraIcon size={14} color="#FFFFFF" />
            )}
          </View>
        </Pressable>

        <Text style={heroStyles.name} numberOfLines={1}>
          {name}
        </Text>

        <View style={heroStyles.levelPill}>
          <View style={heroStyles.levelDot} />
          <Text style={heroStyles.levelText}>Level {level}</Text>
        </View>
      </View>
    </View>
  )
}

const heroStyles = StyleSheet.create({
  wrap: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[5],
    backgroundColor: colors.card,
    ...shadows.soft,
    position: 'relative',
  },
  center: {
    alignItems: 'center',
    gap: spacing[3],
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    padding: 4,
    backgroundColor: colors.card,
    ...shadows.iris,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.borderSoft,
  },
  avatarGradient: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.serif,
    fontSize: 44,
    color: '#fff',
    letterSpacing: -1,
  },
  cameraBubble: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ink,
    borderWidth: 3,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.5,
    marginTop: spacing[1],
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.irisSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.iris,
  },
  levelText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.iris,
    letterSpacing: 0.4,
  },
})

// ─── Editable Row ────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  onPress,
  iconBg = colors.irisSoft,
  iconColor = colors.iris,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
  onPress?: () => void
  iconBg?: string
  iconColor?: string
}) {
  const editable = !!onPress
  return (
    <Pressable
      onPress={onPress}
      disabled={!editable}
      style={({ pressed }) => [
        infoStyles.row,
        pressed && editable && { opacity: 0.85 },
      ]}
    >
      <View style={[infoStyles.iconBg, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={infoStyles.textCol}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value} numberOfLines={1}>
          {value || '—'}
        </Text>
      </View>
      {editable ? (
        <Ionicons name="chevron-forward" size={18} color={colors.inkLight} />
      ) : null}
    </Pressable>
  )
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...shadows.sm,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 2 },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.inkLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.ink,
  },
})

// ─── Stat Card ───────────────────────────────────────────────

type StatIconType = 'flame' | 'cap'

const STAT_ICON_MAP: Record<
  StatIconType,
  { icon: React.FC<{ size?: number; color?: string }>; color: string; bg: string }
> = {
  flame: { icon: FlameIcon, color: '#D97706', bg: '#FEF3C7' },
  cap: { icon: GraduationCapIcon, color: '#6D28D9', bg: '#EDE9FE' },
}

function StatCard({
  label,
  value,
  iconType,
}: {
  label: string
  value: string
  iconType: StatIconType
}) {
  const { icon: IconComponent, color, bg } = STAT_ICON_MAP[iconType]
  return (
    <View style={statStyles.card}>
      <View style={[statStyles.iconBg, { backgroundColor: bg }]}>
        <IconComponent size={16} color={color} />
      </View>
      <View style={statStyles.textCol}>
        <Text style={statStyles.value}>{value}</Text>
        <Text style={statStyles.label}>{label}</Text>
      </View>
    </View>
  )
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: 12,
    ...shadows.sm,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 2 },
  value: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 26,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: colors.inkLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
})

// ─── Main Profile Screen ─────────────────────────────────────

export default function ProfileScreen() {
  useTabFocusSync()
  const user = useCurrentUser()
  const isGuest = useIsGuest()
  const userWords = useUserWords()
  const streak = useStreak()
  const sessionDates = useSessionDates()
  const logout = useUserStore((s) => s.logout)
  const { editName, editEmail } = useEditProfile()
  const wordCache = useWordStore((s) => s.wordCache)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [editConfig, setEditConfig] = useState<EditFieldConfig | null>(null)

  const mastered = useMemo(
    () =>
      Object.values(userWords).filter(
        (w) => w.status === 'mastered' && wordCache[w.wordId],
      ).length,
    [userWords, wordCache],
  )

  if (isGuest || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <GuestGate />
      </SafeAreaView>
    )
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      if (isAppwriteConfigured) await logoutSession()
    } catch {
      /* ignore */
    }
    logout()
    router.replace('/(onboarding)')
  }

  const openNameEditor = () =>
    setEditConfig({
      title: 'Display name',
      subtitle: 'How others see you across the app.',
      initialValue: user.name ?? '',
      placeholder: 'Your name',
      onSubmit: (value) => editName(value),
    })

  const openEmailEditor = () =>
    setEditConfig({
      title: 'Email address',
      subtitle:
        'You\'ll need your current password to confirm the change.',
      initialValue: user.email ?? '',
      placeholder: 'name@example.com',
      keyboardType: 'email-address',
      requiresPassword: true,
      onSubmit: (value, password) => editEmail(value, password ?? ''),
    })

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero name={user.name} level={user.level} />

        {/* Account info */}
        <View style={styles.section}>
          <SectionLabel title="ACCOUNT INFO" />
          <View style={styles.rowsCol}>
            <InfoRow
              icon="person-outline"
              label="Display name"
              value={user.name}
              onPress={openNameEditor}
            />
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={user.email ?? ''}
              iconBg="#FEF3C7"
              iconColor="#D97706"
              onPress={openEmailEditor}
            />
            <InfoRow
              icon="ribbon-outline"
              label="Level"
              value={user.level}
              iconBg="#ECFDF5"
              iconColor="#059669"
              onPress={() => router.push('/(onboarding)/placement-test')}
            />
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.section}>
          <SectionLabel title="OVERVIEW" />
          <View style={styles.grid}>
            <StatCard
              label="Current Streak"
              value={`${streak}`}
              iconType="flame"
            />
            <StatCard
              label="Mastered"
              value={`${mastered}`}
              iconType="cap"
            />
          </View>
        </View>

        {/* Activity calendar */}
        <View style={styles.section}>
          <SectionLabel title="ACTIVITY" />
          <SessionCalendar sessionDates={sessionDates} />
        </View>

        {/* Account actions */}
        <View style={styles.section}>
          <SectionLabel title="ACCOUNT" />
          <Pressable
            onPress={handleLogout}
            disabled={isLoggingOut}
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.coral} />
            <Text style={styles.logoutText}>
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <EditFieldModal
        visible={!!editConfig}
        config={editConfig}
        onClose={() => setEditConfig(null)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14, gap: 22, paddingBottom: 100 },

  section: { gap: 12 },

  rowsCol: { gap: 8 },

  grid: { flexDirection: 'row', gap: 10 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii.md,
    backgroundColor: colors.coralSoft,
  },
  logoutText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.coral,
  },
})
