import * as Notifications from 'expo-notifications'
import type { Word } from '@/types'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

/** Request notification permissions */
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    return status === 'granted'
  } catch (error) {
    throw new Error(`[notificationService.requestPermissions] ${error}`)
  }
}

/** Schedule daily word reminder notification */
export async function scheduleDailyReminder(hour = 9, minute = 0): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your daily words are ready',
        body: "5 new words picked just for you. Let's learn!",
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    })
  } catch (error) {
    throw new Error(`[notificationService.scheduleDailyReminder] ${error}`)
  }
}

/** Show an immediate word-of-the-day notification */
export async function showWordNotification(word: Word): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Word of the day: ${word.word}`,
        body: word.definition,
        data: { wordId: word.id },
      },
      trigger: null,
    })
  } catch (error) {
    throw new Error(`[notificationService.showWordNotification] ${error}`)
  }
}
