import { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fonts, radii, shadows } from '@constants/theme'
import {
  buildCurrentWeekDates,
  toDateString,
  todayString,
} from '@utils/dateUtils'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const SCREEN_WIDTH = Dimensions.get('window').width
const PAGE_HORIZONTAL_PADDING = 28
const PAGE_WIDTH = SCREEN_WIDTH - PAGE_HORIZONTAL_PADDING * 2

interface Week {
  // Monday of the week, normalized to local midnight
  start: Date
  // Seven Date objects, Mon → Sun
  dates: Date[]
}

function buildWeekFromMonday(monday: Date): Week {
  const start = new Date(monday)
  start.setHours(0, 0, 0, 0)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
  return { start, dates }
}

/**
 * Build N most-recent weeks ending with the current week.
 * Returns an array oldest → newest so the current week sits at the end and
 * users swipe right-to-left to view history.
 */
function buildWeeks(weeksBack = 12): Week[] {
  const current = buildCurrentWeekDates()
  const monday = current[0]
  return Array.from({ length: weeksBack }, (_, i) => {
    const m = new Date(monday)
    m.setDate(monday.getDate() - (weeksBack - 1 - i) * 7)
    return buildWeekFromMonday(m)
  })
}

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function formatWeekHeading(week: Week): string {
  const start = week.dates[0]
  const end = week.dates[6]
  const startMonth = MONTH_LABELS[start.getMonth()]
  const endMonth = MONTH_LABELS[end.getMonth()]
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}–${end.getDate()}`
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`
}

/**
 * Horizontally pageable week calendar.
 * - Past day with session → green ring + green dot
 * - Past day without session → yellow ring
 * - Today → ink ring (pending)
 * - Future → muted dot
 */
export function SessionCalendar({
  sessionDates,
}: {
  sessionDates: string[]
}) {
  const weeks = useMemo(() => buildWeeks(12), [])
  const [pageIndex, setPageIndex] = useState(weeks.length - 1)
  const sessionSet = useMemo(() => new Set(sessionDates), [sessionDates])
  const today = todayString()
  const listRef = useRef<FlatList<Week>>(null)

  const onMomentumEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / PAGE_WIDTH)
      setPageIndex(Math.max(0, Math.min(weeks.length - 1, idx)))
    },
    [weeks.length],
  )

  const goPrev = useCallback(() => {
    if (pageIndex <= 0) return
    listRef.current?.scrollToIndex({ index: pageIndex - 1, animated: true })
    setPageIndex(pageIndex - 1)
  }, [pageIndex])

  const goNext = useCallback(() => {
    if (pageIndex >= weeks.length - 1) return
    listRef.current?.scrollToIndex({ index: pageIndex + 1, animated: true })
    setPageIndex(pageIndex + 1)
  }, [pageIndex, weeks.length])

  const activeCount = useMemo(() => {
    const w = weeks[pageIndex]
    if (!w) return 0
    return w.dates.reduce(
      (n, d) => (sessionSet.has(toDateString(d)) ? n + 1 : n),
      0,
    )
  }, [weeks, pageIndex, sessionSet])

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {weeks[pageIndex] ? formatWeekHeading(weeks[pageIndex]) : ''}
          </Text>
          <Text style={styles.subtitle}>{activeCount}/7 days active</Text>
        </View>
        <View style={styles.navRow}>
          <Pressable
            onPress={goPrev}
            disabled={pageIndex <= 0}
            style={[styles.navBtn, pageIndex <= 0 && styles.navBtnDisabled]}
            hitSlop={6}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={pageIndex <= 0 ? colors.inkLight : colors.ink}
            />
          </Pressable>
          <Pressable
            onPress={goNext}
            disabled={pageIndex >= weeks.length - 1}
            style={[
              styles.navBtn,
              pageIndex >= weeks.length - 1 && styles.navBtnDisabled,
            ]}
            hitSlop={6}
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={
                pageIndex >= weeks.length - 1 ? colors.inkLight : colors.ink
              }
            />
          </Pressable>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={weeks}
        keyExtractor={(w) => toDateString(w.start)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        initialScrollIndex={weeks.length - 1}
        getItemLayout={(_, index) => ({
          length: PAGE_WIDTH,
          offset: PAGE_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={[styles.page, { width: PAGE_WIDTH }]}>
            {item.dates.map((d, i) => {
              const dStr = toDateString(d)
              const isFuture = dStr > today
              const isToday = dStr === today
              const isActive = sessionSet.has(dStr)
              return (
                <View key={dStr} style={styles.dayCol}>
                  <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
                  <DayBubble
                    day={d.getDate()}
                    isActive={isActive}
                    isToday={isToday}
                    isFuture={isFuture}
                  />
                </View>
              )
            })}
          </View>
        )}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.mint }]} />
          <Text style={styles.legendText}>Active</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.amber }]}
          />
          <Text style={styles.legendText}>Missed</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.ink },
            ]}
          />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  )
}

function DayBubble({
  day,
  isActive,
  isToday,
  isFuture,
}: {
  day: number
  isActive: boolean
  isToday: boolean
  isFuture: boolean
}) {
  const ringColor = isActive
    ? colors.mint
    : isToday
      ? colors.ink
      : isFuture
        ? colors.border
        : colors.amber

  const fillColor = isActive
    ? colors.mintSoft
    : isToday
      ? colors.bg
      : isFuture
        ? colors.bg
        : colors.amberSoft

  const numberColor = isFuture ? colors.inkLight : colors.ink

  return (
    <View
      style={[
        styles.bubble,
        { borderColor: ringColor, backgroundColor: fillColor },
      ]}
    >
      <Text style={[styles.bubbleText, { color: numberColor }]}>{day}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
    gap: 14,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.ink2,
    marginTop: 2,
  },
  navRow: { flexDirection: 'row', gap: 6 },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.5 },
  page: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCol: { alignItems: 'center', gap: 8, flex: 1 },
  dayLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    color: colors.inkLight,
  },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    gap: 14,
    paddingTop: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.ink2,
  },
})
